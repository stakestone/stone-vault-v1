// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IBalancerVault} from "../interfaces/IBalancerVault.sol";
import {IAuraRewardPool} from "../interfaces/IAuraRewardPool.sol";
import {IMetaStablePool} from "../interfaces/IMetaStablePool.sol";
import {IWstETH} from "../interfaces/IWstETH.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";

import {Strategy} from "./Strategy.sol";
import {SwappingAggregator} from "./SwappingAggregator.sol";

contract RETHBalancerAuraStrategy is Strategy {
    uint256 internal immutable MULTIPLIER = 1e18;
    uint256 internal immutable PERCENTAGE = 1e6;
    uint256 internal SLIPPAGE = 995000;

    bytes32 internal immutable poolId =
        0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112;

    address public immutable WETH;
    address public immutable RETH;
    address public immutable VAULT;
    address public immutable LP_TOKEN;

    address public immutable AURA_REWARD_POOL;
    address public immutable BAL_TOKEN;
    address public immutable AURA_TOKEN;
    address public immutable EXTRA_REWARD;

    address payable public SWAPPING;

    constructor(
        address payable _controller,
        address payable _swap,
        address _WETH,
        address _RETH,
        address _VAULT,
        address _LP_TOKEN,
        address _AURA_REWARD_POOL,
        address _BAL_TOKEN,
        address _AURA_TOKEN,
        address _EXTRA_REWARD,
        bytes32 _poolId
    ) Strategy(_controller, "Rocket Pool ETH(rETH)") {
        require(_swap != address(0), "ZERO ADDRESS");

        SWAPPING = _swap;
        WETH = _WETH;
        RETH = _RETH;
        VAULT = _VAULT;
        LP_TOKEN = _LP_TOKEN;
        AURA_REWARD_POOL = _AURA_REWARD_POOL;
        BAL_TOKEN = _BAL_TOKEN;
        AURA_TOKEN = _AURA_TOKEN;
        EXTRA_REWARD = _EXTRA_REWARD;
        poolId = _poolId;
    }

    function deposit() public payable override onlyController notAtSameBlock {
        uint256 amount = msg.value;
        require(amount != 0, "zero value");

        IBalancerVault vault = IBalancerVault(VAULT);

        uint256[] memory amountsIn = new uint256[](2);
        amountsIn[0] = 0;
        amountsIn[1] = amount;

        uint256 minimumBPT = getMinLPOutAmount(amount);
        bytes memory userData = abi.encode(
            IBalancerVault.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT,
            amountsIn,
            minimumBPT
        );

        address[] memory assets = new address[](2);
        assets[0] = RETH;
        assets[1] = address(0);

        IBalancerVault.JoinPoolRequest memory joinPoolRequest = IBalancerVault
            .JoinPoolRequest(assets, amountsIn, userData, false);

        vault.joinPool{value: amount}(
            poolId,
            address(this),
            address(this),
            joinPoolRequest
        );

        IERC20 lp = IERC20(LP_TOKEN);
        uint256 minted = lp.balanceOf(address(this));
        require(minted > 0, "mint error");

        lp.approve(AURA_REWARD_POOL, minted);
        uint256 share = IAuraRewardPool(AURA_REWARD_POOL).deposit(
            minted,
            address(this)
        );

        require(share > 0, "mint error");

        latestUpdateTime = block.timestamp;
    }

    function withdraw(
        uint256 _amount
    )
        public
        override
        onlyController
        notAtSameBlock
        returns (uint256 actualAmount)
    {
        actualAmount = _withdraw(_amount, false);
    }

    function instantWithdraw(
        uint256 _amount
    )
        public
        override
        onlyController
        notAtSameBlock
        returns (uint256 actualAmount)
    {
        actualAmount = _withdraw(_amount, true);
    }

    function _withdraw(
        uint256 _amount,
        bool _isInstant
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        uint256 lpOut = getMaxLPOutAmount(_amount);
        lpOut = lpOut < IERC20(AURA_REWARD_POOL).balanceOf(address(this))
            ? lpOut
            : IERC20(AURA_REWARD_POOL).balanceOf(address(this));

        if (lpOut != 0) {
            IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
            rewardPool.withdrawAndUnwrap(lpOut, true);
        }

        uint256 lpBalance = IERC20(LP_TOKEN).balanceOf(address(this));
        if (lpBalance != 0) {
            IBalancerVault vault = IBalancerVault(VAULT);

            TransferHelper.safeApprove(LP_TOKEN, VAULT, lpBalance);

            bytes memory userData = abi.encode(
                IBalancerVault.ExitKind.EXACT_BPT_IN_FOR_ONE_TOKEN_OUT,
                lpBalance,
                1
            );

            address[] memory assets = new address[](2);
            assets[0] = RETH;
            assets[1] = WETH;

            uint256[] memory minAmountsOut = new uint256[](2);
            minAmountsOut[0] = 0;
            minAmountsOut[1] = getMinTokenOutAmount(lpBalance);

            IBalancerVault.ExitPoolRequest
                memory exitPoolRequest = IBalancerVault.ExitPoolRequest(
                    assets,
                    minAmountsOut,
                    userData,
                    false
                );

            vault.exitPool(
                poolId,
                address(this),
                payable(address(this)),
                exitPoolRequest
            );
        }

        uint256 balance = IERC20(WETH).balanceOf(address(this));
        if (balance != 0) {
            IWETH9(WETH).withdraw(balance);
            actualAmount = address(this).balance;
        }
        if (!_isInstant) {
            sellAllRewards();
        }
        actualAmount = actualAmount > _amount ? _amount : actualAmount;
        TransferHelper.safeTransferETH(controller, address(this).balance);

        latestUpdateTime = block.timestamp;
    }

    function sellAllRewards() internal returns (uint256 actualAmount) {
        uint256 balance = IERC20(BAL_TOKEN).balanceOf(address(this));
        if (balance != 0) {
            TransferHelper.safeApprove(BAL_TOKEN, SWAPPING, balance);
            actualAmount = SwappingAggregator(SWAPPING).swap(
                BAL_TOKEN,
                balance,
                true
            );
        }
        balance = IERC20(AURA_TOKEN).balanceOf(address(this));
        if (balance != 0) {
            TransferHelper.safeApprove(AURA_TOKEN, SWAPPING, balance);
            actualAmount =
                actualAmount +
                SwappingAggregator(SWAPPING).swap(AURA_TOKEN, balance, true);
        }
    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 lpOut = IERC20(AURA_REWARD_POOL).balanceOf(address(this));
        if (lpOut != 0) {
            IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
            rewardPool.withdrawAndUnwrap(lpOut, true);
        }
        uint256 lpBalance = IERC20(LP_TOKEN).balanceOf(address(this));
        if (lpBalance != 0) {
            IBalancerVault vault = IBalancerVault(VAULT);

            TransferHelper.safeApprove(LP_TOKEN, VAULT, lpBalance);

            bytes memory userData = abi.encode(
                IBalancerVault.ExitKind.EXACT_BPT_IN_FOR_ONE_TOKEN_OUT,
                lpBalance,
                1
            );

            address[] memory assets = new address[](2);
            assets[0] = RETH;
            assets[1] = WETH;

            uint256[] memory minAmountsOut = new uint256[](2);
            minAmountsOut[0] = 0;
            minAmountsOut[1] = getMinTokenOutAmount(lpBalance);

            IBalancerVault.ExitPoolRequest
                memory exitPoolRequest = IBalancerVault.ExitPoolRequest(
                    assets,
                    minAmountsOut,
                    userData,
                    false
                );

            vault.exitPool(
                poolId,
                address(this),
                payable(address(this)),
                exitPoolRequest
            );
        }

        uint256 balance = IERC20(WETH).balanceOf(address(this));
        if (balance != 0) {
            IWETH9(WETH).withdraw(balance);
            amount = address(this).balance;
        }

        amount = amount + sellAllRewards();
        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function getExtraRewards() public view returns (uint256 bal, uint256 aura) {
        bal = IAuraRewardPool(AURA_REWARD_POOL).earned(address(this));
        aura = IAuraRewardPool(EXTRA_REWARD).earned(address(this));
    }

    function claimRewards() public {
        IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
        rewardPool.withdrawAndUnwrap(0, true);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        return
            address(this).balance +
            (IERC20(AURA_REWARD_POOL).balanceOf(address(this)) *
                getOnchainLpPrice()) /
            MULTIPLIER;
    }

    function getPendingValue() public override returns (uint256 value) {
        return 0;
    }

    function checkPendingStatus()
        public
        override
        returns (uint256 pending, uint256 executable)
    {
        return (0, 0);
    }

    function getOnchainLpPrice() public view returns (uint256) {
        return IMetaStablePool(LP_TOKEN).getRate();
    }

    function getMinLPOutAmount(uint256 _eAmount) internal returns (uint256) {
        return
            (_eAmount * SLIPPAGE * MULTIPLIER) /
            PERCENTAGE /
            getOnchainLpPrice();
    }

    function getMaxLPOutAmount(uint256 _eAmount) internal returns (uint256) {
        return
            (_eAmount * PERCENTAGE * MULTIPLIER) /
            SLIPPAGE /
            getOnchainLpPrice();
    }

    function getMinTokenOutAmount(
        uint256 _lpAmount
    ) internal returns (uint256) {
        return
            (_lpAmount * SLIPPAGE * getOnchainLpPrice()) /
            PERCENTAGE /
            MULTIPLIER;
    }

    function setSlippage(uint256 _slippage) external onlyGovernance {
        SLIPPAGE = _slippage;
    }

    function setAggregator(address _aggregator) external onlyGovernance {
        SWAPPING = payable(_aggregator);
    }

    receive() external payable {}
}
