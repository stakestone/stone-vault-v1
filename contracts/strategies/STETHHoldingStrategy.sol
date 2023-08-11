// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Strategy} from "../strategies/Strategy.sol";
import {StrategyController} from "../strategies/StrategyController.sol";
import {SwappingAggregator} from "./SwappingAggregator.sol";
import {ILido} from "../interfaces/ILido.sol";
import {ILidoWithdrawalQueue} from "../interfaces/ILidoWithdrawalQueue.sol";
import {IStableSwap} from "../interfaces/IStableSwap.sol";

contract STETHHoldingStrategy is Strategy {
    address public immutable STETH;

    address payable public immutable SWAPPING;

    address public immutable LidoWithdrawalQueue;

    constructor(
        address payable _controller,
        string memory _name,
        address _stETH,
        address _lidoWithdrawalQueue,
        address payable _swap
    ) Strategy(_controller, _name) {
        require(
            _stETH != address(0) &&
                _lidoWithdrawalQueue != address(0) &&
                _swap != address(0),
            "ZERO ADDRESS"
        );

        STETH = _stETH;
        LidoWithdrawalQueue = _lidoWithdrawalQueue;
        SWAPPING = _swap;
    }

    function deposit() public payable override onlyController {
        uint256 amount = msg.value;
        require(amount != 0, "zero value");

        ILido(STETH).submit{value: amount}(address(0));
    }

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        ILido lido = ILido(STETH);
        ILidoWithdrawalQueue withdrawalQueue = ILidoWithdrawalQueue(
            LidoWithdrawalQueue
        );

        lido.approve(LidoWithdrawalQueue, _amount);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;
        uint256[] memory ids = withdrawalQueue.requestWithdrawals(
            amounts,
            address(this)
        );

        require(ids.length != 0, "Lido request withdrawal error");

        actualAmount = _amount;

        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function instantWithdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        _amount = _amount < IERC20(STETH).balanceOf(address(this))
            ? _amount
            : IERC20(STETH).balanceOf(address(this));

        TransferHelper.safeApprove(STETH, SWAPPING, _amount);

        actualAmount = SwappingAggregator(SWAPPING).swap(STETH, _amount);

        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 balance = IERC20(STETH).balanceOf(address(this));

        TransferHelper.safeApprove(STETH, SWAPPING, balance);
        amount = SwappingAggregator(SWAPPING).swap(STETH, balance);

        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue() + getPendingValue() + getClaimableValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        value = IERC20(STETH).balanceOf(address(this));
    }

    function getPendingValue() public override returns (uint256 value) {
        (, , value) = checkPendingAssets();
    }

    function getClaimableValue() public returns (uint256 value) {
        (, value, ) = checkPendingAssets();
    }

    function checkPendingStatus()
        public
        override
        returns (uint256 pending, uint256 executable)
    {
        (, executable, pending) = checkPendingAssets();
    }

    function claimAllPendingAssets() external {
        (uint256[] memory ids, , ) = checkPendingAssets();

        uint256 length = ids.length;
        for (uint256 i; i < length; i++) {
            if (ids[i] == 0) continue;
            ILidoWithdrawalQueue(LidoWithdrawalQueue).claimWithdrawal(ids[i]);
        }

        TransferHelper.safeTransferETH(
            StrategyController(controller).assetsVault(),
            address(this).balance
        );
    }

    function checkPendingAssets()
        public
        returns (
            uint256[] memory ids,
            uint256 totalClaimable,
            uint256 totalPending
        )
    {
        ILidoWithdrawalQueue queue = ILidoWithdrawalQueue(LidoWithdrawalQueue);

        uint256[] memory allIds = queue.getWithdrawalRequests(address(this));

        if (allIds.length == 0) {
            return (new uint256[](0), 0, 0);
        }

        ILidoWithdrawalQueue.WithdrawalRequestStatus[] memory statuses = queue
            .getWithdrawalStatus(allIds);

        uint256 j;
        uint256 length = statuses.length;
        for (uint256 i; i < length; i++) {
            ILidoWithdrawalQueue.WithdrawalRequestStatus
                memory status = statuses[i];
            if (status.isClaimed) {
                continue;
            }
            if (status.isFinalized) {
                ids[j] = allIds[i];
                j += 1;
                totalClaimable = totalClaimable + status.amountOfStETH;
            } else {
                totalPending = totalPending + status.amountOfStETH;
            }
        }
    }

    receive() external payable {}
}
