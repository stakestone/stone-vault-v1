// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {StrategyV2} from "../strategies/StrategyV2.sol";
import {StrategyController} from "../strategies/StrategyController.sol";
import {IWBETH} from "../interfaces/IWBETH.sol";
import {IUnwrapTokenV1ETH} from "../interfaces/IUnwrapTokenV1ETH.sol";
import {ICollateral} from "../interfaces/ICollateral.sol";

contract SymbioticDepositWBETHStrategy is StrategyV2 {
    address public immutable wbETHAddr;
    address public immutable unwrapTokenV1ETHAddr;
    address public immutable collateralAddr;

    uint256 internal immutable MULTIPLIER = 1e18;

    event WrapToWBETH(uint256 etherAmount, uint256 wbETHAmount);
    event DepositIntoSymbiotic(
        address indexed collateral,
        address indexed recipient,
        uint256 amount,
        uint256 share
    );
    event WithdrawFromSymbiotic(
        address indexed collateral,
        address indexed recipient,
        uint256 share,
        uint256 amount
    );

    constructor(
        address payable _controller,
        address _wbETHAddr,
        address _unwrapTokenV1ETHAddr,
        address _collateralAddr,
        string memory _name
    ) StrategyV2(_controller, _name) {
        wbETHAddr = _wbETHAddr;
        unwrapTokenV1ETHAddr = _unwrapTokenV1ETHAddr;
        collateralAddr = _collateralAddr;
    }

    function deposit() public payable override onlyController notAtSameBlock {
        require(msg.value != 0, "zero value");

        latestUpdateTime = block.timestamp;
    }

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function instantWithdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 balance = address(this).balance;

        if (balance != 0) {
            TransferHelper.safeTransferETH(controller, balance);
            amount = balance;
        }
    }

    function _withdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        actualAmount = _amount;

        TransferHelper.safeTransferETH(controller, actualAmount);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        uint256 etherValue = address(this).balance;
        (uint256 claimableValue, uint256 pendingValue) = checkPendingAssets();

        value = etherValue + claimableValue + pendingValue + getWBETHValue();
    }

    function getWBETHValue() public view returns (uint256 value) {
        uint256 wbBalance = IERC20(wbETHAddr).balanceOf(address(this));
        uint256 depositValue = IERC20(collateralAddr).balanceOf(address(this));

        value =
            ((wbBalance + depositValue) * IWBETH(wbETHAddr).exchangeRate()) /
            MULTIPLIER;
    }

    function wrapToWBETH(
        uint256 _ethAmount,
        address _referral
    ) external onlyOwner returns (uint256 amount) {
        require(_ethAmount != 0, "zero");
        require(_ethAmount <= address(this).balance, "exceed balance");

        IWBETH wbETH = IWBETH(wbETHAddr);

        uint256 balanceBefore = wbETH.balanceOf(address(this));

        wbETH.deposit{value: _ethAmount}(_referral);

        amount = wbETH.balanceOf(address(this)) - balanceBefore;

        emit WrapToWBETH(_ethAmount, amount);
    }

    function depositIntoSymbiotic(
        uint256 _wbETHAmount
    ) external onlyOwner returns (uint256 shares) {
        require(_wbETHAmount != 0, "zero");

        TransferHelper.safeApprove(wbETHAddr, collateralAddr, _wbETHAmount);

        shares = ICollateral(collateralAddr).deposit(
            address(this),
            _wbETHAmount
        );

        require(shares != 0, "mint zero share");

        emit DepositIntoSymbiotic(
            collateralAddr,
            address(this),
            _wbETHAmount,
            shares
        );
    }

    function withdrawFromSymbiotic(
        uint256 _share
    ) external onlyOwner returns (uint256 wbETHAmount) {
        require(_share != 0, "zero");

        wbETHAmount = IWBETH(wbETHAddr).balanceOf(address(this));

        ICollateral(collateralAddr).withdraw(address(this), _share);

        wbETHAmount = IWBETH(wbETHAddr).balanceOf(address(this)) - wbETHAmount;

        emit WithdrawFromSymbiotic(
            collateralAddr,
            address(this),
            _share,
            wbETHAmount
        );
    }

    function requestToEther(
        uint256 _amount
    ) external onlyOwner returns (uint256 etherAmount) {
        IWBETH wbETH = IWBETH(wbETHAddr);

        require(_amount != 0, "zero");
        require(_amount <= wbETH.balanceOf(address(this)), "exceed balance");

        wbETH.requestWithdrawEth(_amount);

        etherAmount = (_amount * IWBETH(wbETHAddr).exchangeRate()) / MULTIPLIER;
    }

    function claimPendingAssets(uint256 _index) external onlyOwner {
        IUnwrapTokenV1ETH(unwrapTokenV1ETHAddr).claimWithdraw(_index);
    }

    function checkPendingAssets()
        public
        view
        returns (uint256 totalClaimable, uint256 totalPending)
    {
        IUnwrapTokenV1ETH unwrapTokenV1ETH = IUnwrapTokenV1ETH(
            unwrapTokenV1ETHAddr
        );

        IUnwrapTokenV1ETH.WithdrawRequest[]
            memory allRequests = unwrapTokenV1ETH.getUserWithdrawRequests(
                address(this)
            );

        uint256 length = allRequests.length;
        if (length == 0) {
            return (0, 0);
        }

        uint256 lockTime = unwrapTokenV1ETH.lockTime();
        for (uint256 i; i < length; i++) {
            IUnwrapTokenV1ETH.WithdrawRequest memory request = allRequests[i];
            if (request.claimTime != 0) {
                continue;
            }
            if (
                block.timestamp >= request.triggerTime + lockTime &&
                request.allocated
            ) {
                totalClaimable = totalClaimable + request.ethAmount;
            } else {
                totalPending = totalPending + request.ethAmount;
            }
        }
    }

    receive() external payable {}
}
