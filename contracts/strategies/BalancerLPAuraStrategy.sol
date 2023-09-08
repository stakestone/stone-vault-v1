// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IBalancerVault} from "../interfaces/IBalancerVault.sol";
import {IAuraRewardPool} from "../interfaces/IAuraRewardPool.sol";
import {IComposableStablePool} from "../interfaces/IComposableStablePool.sol";
import {IWstETH} from "../interfaces/IWstETH.sol";
import {IBooster} from "../interfaces/IBooster.sol";

import {Strategy} from "./Strategy.sol";
import {SwappingAggregator} from "./SwappingAggregator.sol";

contract BalancerLPAuraStrategy is Strategy {
    uint256 internal immutable MULTIPLIER = 1e18;
    uint256 internal immutable PERCENTAGE = 1e6;
    uint256 internal SLIPPAGE = 900000;

    bytes32 internal immutable poolId =
        0x42ed016f826165c2e5976fe5bc3df540c5ad0af700000000000000000000058b;
    uint256 internal immutable auraPoolId = 139;

    address public immutable STETH = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address public immutable WSTETH =
        0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    address public immutable VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address public immutable LP_TOKEN =
        0x42ED016F826165C2e5976fe5bC3df540C5aD0Af7;
    address public immutable BOOSTER =
        0xA57b8d98dAE62B26Ec3bcC4a365338157060B234;
    address public immutable AURA_REWARD_POOL =
        0x032B676d5D55e8ECbAe88ebEE0AA10fB5f72F6CB;
    address public immutable BAL_TOKEN =
        0xba100000625a3754423978a60c9317c58a424e3D;
    address public immutable AURA_TOKEN =
        0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF;

    address payable public immutable SWAPPING;

    uint256 public lpPriceByWstETH;

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

        TransferHelper.safeTransferETH(WSTETH, amount);

        uint256 wstETHAmount = IERC20(WSTETH).balanceOf(address(this));

        IBalancerVault.SingleSwap memory singleSwap;
        singleSwap.poolId = poolId;
        singleSwap.kind = IBalancerVault.SwapKind.GIVEN_IN;
        singleSwap.assetIn = WSTETH;
        singleSwap.assetOut = LP_TOKEN;
        singleSwap.amount = wstETHAmount;

        IBalancerVault.FundManagement memory fundManagement;
        fundManagement.sender = address(this);
        fundManagement.fromInternalBalance = false;
        fundManagement.recipient = payable(address(this));
        fundManagement.toInternalBalance = false;

        TransferHelper.safeApprove(WSTETH, VAULT, wstETHAmount);

        uint256 lpOut = IBalancerVault(VAULT).swap(
            singleSwap,
            fundManagement,
            getSwapOutAmount(wstETHAmount),
            block.timestamp
        );

        uint256 lp_balance = IERC20(LP_TOKEN).balanceOf(address(this));
        TransferHelper.safeApprove(LP_TOKEN, BOOSTER, lp_balance);
        IBooster(BOOSTER).deposit(auraPoolId, lp_balance, true);
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

        uint256 wstETHOut = IWstETH(WSTETH).getWstETHByStETH(_amount);
        uint256 lpOut = getWithdrawLPOutAmount(wstETHOut);

        lpOut = lpOut < IERC20(AURA_REWARD_POOL).balanceOf(address(this))
            ? lpOut
            : IERC20(AURA_REWARD_POOL).balanceOf(address(this));

        if (lpOut != 0) {
            IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
            rewardPool.withdrawAndUnwrap(lpOut, true);
        }
        uint256 lpBalance = IERC20(LP_TOKEN).balanceOf(address(this));

        if (lpBalance != 0) {
            TransferHelper.safeApprove(LP_TOKEN, VAULT, lpBalance);

            IBalancerVault.SingleSwap memory singleSwap;
            singleSwap.poolId = poolId;
            singleSwap.kind = IBalancerVault.SwapKind.GIVEN_IN;
            singleSwap.assetIn = LP_TOKEN;
            singleSwap.assetOut = WSTETH;
            singleSwap.amount = lpBalance;

            IBalancerVault.FundManagement memory fundManagement;
            fundManagement.sender = address(this);
            fundManagement.fromInternalBalance = false;
            fundManagement.recipient = payable(address(this));
            fundManagement.toInternalBalance = false;

            IBalancerVault(VAULT).swap(
                singleSwap,
                fundManagement,
                // wstETHOut,
                0,
                block.timestamp
            );
        }

        uint256 balance = IERC20(WSTETH).balanceOf(address(this));
        if (balance != 0) {
            actualAmount = SwappingAggregator(SWAPPING).swap(
                WSTETH,
                balance,
                true
            );
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
            TransferHelper.safeApprove(LP_TOKEN, VAULT, lpBalance);

            IBalancerVault.SingleSwap memory singleSwap;
            singleSwap.poolId = poolId;
            singleSwap.kind = IBalancerVault.SwapKind.GIVEN_IN;
            singleSwap.assetIn = LP_TOKEN;
            singleSwap.assetOut = WSTETH;
            singleSwap.amount = lpBalance;

            IBalancerVault.FundManagement memory fundManagement;
            fundManagement.sender = address(this);
            fundManagement.fromInternalBalance = false;
            fundManagement.recipient = payable(address(this));
            fundManagement.toInternalBalance = false;

            IBalancerVault(VAULT).swap(
                singleSwap,
                fundManagement,
                getSwapOutAmount(lpBalance),
                block.timestamp
            );
        }

        uint256 balance = IERC20(WSTETH).balanceOf(address(this));
        if (balance != 0) {
            IWstETH(WSTETH).unwrap(balance);
        }

        balance = IERC20(STETH).balanceOf(address(this));
        if (balance != 0) {
            amount = SwappingAggregator(SWAPPING).swap(STETH, balance, true);
        }

        amount = amount + sellAllRewards();
        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue() + getPendingValue();
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
        return IComposableStablePool(LP_TOKEN).getRate();
    }

    function getWithdrawLPOutAmount(
        uint256 _eAmount
    ) internal returns (uint256) {
        return
            (_eAmount * lpPriceByWstETH * PERCENTAGE) / MULTIPLIER / SLIPPAGE;
    }

    function getSwapOutAmount(uint256 _amount) internal returns (uint256) {
        return (_amount * lpPriceByWstETH * SLIPPAGE) / MULTIPLIER / PERCENTAGE;
    }

    function setLpPrice(uint256 _price) external onlyGovernance {
        lpPriceByWstETH = _price;
    }

    function setSlippage(uint256 _slippage) external onlyGovernance {
        SLIPPAGE = _slippage;
    }

    receive() external payable {}
}
