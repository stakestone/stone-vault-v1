// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IBalancerVault} from "../interfaces/IBalancerVault.sol";
import {IAuraRewardPool} from "../interfaces/IAuraRewardPool.sol";
import {IComposableStablePool} from "../interfaces/IComposableStablePool.sol";
import {IWstETH} from "../interfaces/IWstETH.sol";
import {IBooster} from "../interfaces/IBooster.sol";

import {Strategy} from "./Strategy.sol";
import {SwappingAggregator} from "./SwappingAggregator.sol";

contract BalancerLPAuraStrategy is Strategy {
    using SafeMath for uint256;

    uint256 internal MULTIPLIER = 1e18;
    uint256 internal PERCENTAGE = 1e6;
    uint256 internal SLIPPAGE = 999000;

    bytes32 internal poolId =
        0x5aee1e99fe86960377de9f88689616916d5dcabe000000000000000000000467;
    uint256 internal auraPoolId = 50;

    address public immutable WSTETH =
        0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    address public immutable VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address public immutable LP_TOKEN =
        0x5aEe1e99fE86960377DE9f88689616916D5DcaBe;
    address public immutable BOOSTER =
        0xA57b8d98dAE62B26Ec3bcC4a365338157060B234;
    address public immutable AURA_REWARD_POOL =
        0xd26948E7a0223700e3C3cdEA21cA2471abCb8d47;
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
        SWAPPING = _swap;
    }

    function deposit() public payable override onlyController {
        uint256 amount = msg.value;
        require(amount > 0, "zero value");

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

        TransferHelper.safeApprove(LP_TOKEN, BOOSTER, lpOut);
        IBooster(BOOSTER).deposit(auraPoolId, lpOut, true);
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
        require(_amount > 0, "zero value");

        uint256 wstETHOut = IWstETH(WSTETH).getWstETHByStETH(_amount);
        uint256 lpOut = getWithdrawLPOutAmount(wstETHOut);

        lpOut = lpOut < IERC20(AURA_REWARD_POOL).balanceOf(address(this))
            ? lpOut
            : IERC20(AURA_REWARD_POOL).balanceOf(address(this));

        IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
        rewardPool.withdrawAndUnwrap(lpOut, true);

        uint256 lpBalance = IERC20(LP_TOKEN).balanceOf(address(this));
        TransferHelper.safeApprove(LP_TOKEN, VAULT, lpBalance);

        IBalancerVault.SingleSwap memory singleSwap;
        singleSwap.poolId = poolId;
        singleSwap.kind = IBalancerVault.SwapKind.GIVEN_OUT;
        singleSwap.assetIn = LP_TOKEN;
        singleSwap.assetOut = WSTETH;
        singleSwap.amount = wstETHOut;

        IBalancerVault.FundManagement memory fundManagement;
        fundManagement.sender = address(this);
        fundManagement.fromInternalBalance = false;
        fundManagement.recipient = payable(address(this));
        fundManagement.toInternalBalance = false;

        IBalancerVault(VAULT).swap(
            singleSwap,
            fundManagement,
            lpBalance,
            block.timestamp
        );

        uint256 balance = IERC20(WSTETH).balanceOf(address(this));
        actualAmount = SwappingAggregator(SWAPPING).swap(WSTETH, balance);

        if (!_isInstant) {
            actualAmount = actualAmount.add(sellAllRewards());
        }
        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function sellAllRewards() internal returns (uint256 actualAmount) {
        uint256 balance = IERC20(BAL_TOKEN).balanceOf(address(this));
        if (balance > 0) {
            TransferHelper.safeApprove(BAL_TOKEN, SWAPPING, balance);
            actualAmount = SwappingAggregator(SWAPPING).swap(
                BAL_TOKEN,
                balance
            );
        }

        balance = IERC20(AURA_TOKEN).balanceOf(address(this));
        if (balance > 0) {
            TransferHelper.safeApprove(AURA_TOKEN, SWAPPING, balance);
            actualAmount = actualAmount.add(
                SwappingAggregator(SWAPPING).swap(AURA_TOKEN, balance)
            );
        }
    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 lpOut = IERC20(AURA_REWARD_POOL).balanceOf(address(this));

        IAuraRewardPool rewardPool = IAuraRewardPool(AURA_REWARD_POOL);
        rewardPool.withdrawAndUnwrap(lpOut, true);

        uint256 lpBalance = IERC20(LP_TOKEN).balanceOf(address(this));
        TransferHelper.safeApprove(LP_TOKEN, VAULT, lpBalance);

        IBalancerVault.SingleSwap memory singleSwap;
        singleSwap.poolId = poolId;
        singleSwap.kind = IBalancerVault.SwapKind.GIVEN_IN;
        singleSwap.assetIn = LP_TOKEN;
        singleSwap.assetOut = WSTETH;
        singleSwap.amount = lpOut;

        IBalancerVault.FundManagement memory fundManagement;
        fundManagement.sender = address(this);
        fundManagement.fromInternalBalance = false;
        fundManagement.recipient = payable(address(this));
        fundManagement.toInternalBalance = false;

        IBalancerVault(VAULT).swap(
            singleSwap,
            fundManagement,
            lpBalance,
            block.timestamp
        );

        uint256 balance = IERC20(WSTETH).balanceOf(address(this));
        amount = SwappingAggregator(SWAPPING).swap(WSTETH, balance);
        amount = amount.add(sellAllRewards());

        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue().add(getPendingValue());
    }

    function getInvestedValue() public override returns (uint256 value) {
        return
            IERC20(AURA_REWARD_POOL)
                .balanceOf(address(this))
                .mul(getOnchainLpPrice())
                .div(MULTIPLIER);
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

    function getOnchainLpPrice() internal returns (uint256) {
        return IComposableStablePool(LP_TOKEN).getRate();
    }

    function getWithdrawLPOutAmount(
        uint256 _eAmount
    ) internal returns (uint256) {
        return
            _eAmount.mul(lpPriceByWstETH).mul(PERCENTAGE).div(MULTIPLIER).div(
                SLIPPAGE
            );
    }

    function getSwapOutAmount(uint256 _amount) internal returns (uint256) {
        return
            _amount.mul(lpPriceByWstETH).mul(SLIPPAGE).div(MULTIPLIER).div(
                PERCENTAGE
            );
    }

    function setLpPrice(uint256 _price) external onlyGovernance {
        lpPriceByWstETH = _price;
    }

    function setSlippage(uint256 _slippage) external onlyGovernance {
        SLIPPAGE = _slippage;
    }

    receive() external payable {}
}
