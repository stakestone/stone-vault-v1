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

    address public immutable WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public immutable RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;
    address public immutable VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address public immutable LP_TOKEN =
        0x1E19CF2D73a72Ef1332C882F20534B6519Be0276;

    address public immutable AURA_REWARD_POOL =
        0xDd1fE5AD401D4777cE89959b7fa587e569Bf125D;
    address public immutable BAL_TOKEN =
        0xba100000625a3754423978a60c9317c58a424e3D;
    address public immutable AURA_TOKEN =
        0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF;

    address payable public immutable SWAPPING;

    constructor(
        address payable _controller,
        address payable _swap,
        string memory _name
    ) Strategy(_controller, _name) {
        require(_swap != address(0), "ZERO ADDRESS");

        SWAPPING = _swap;
    }

    function deposit() public payable override onlyController {
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
    }

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount, false);
    }

    function instantWithdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
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
            actualAmount = actualAmount + sellAllRewards();
        }
        TransferHelper.safeTransferETH(controller, address(this).balance);
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

    function claimRewards() public {
        IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
        rewardPool.withdrawAndUnwrap(0, true);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        return
            (IERC20(AURA_REWARD_POOL).balanceOf(address(this)) *
                getOnchainLpPrice()) / MULTIPLIER;
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

    receive() external payable {}
}
