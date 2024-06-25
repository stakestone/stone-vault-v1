// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {StrategyV2} from "../strategies/StrategyV2.sol";
import {StrategyController} from "../strategies/StrategyController.sol";
import {ILido} from "../interfaces/ILido.sol";
import {ILidoWithdrawalQueue} from "../interfaces/ILidoWithdrawalQueue.sol";
import {IWstETH} from "../interfaces/IWstETH.sol";
import {ICollateral} from "../interfaces/ICollateral.sol";

contract SymbioticDepositWstETHStrategy is StrategyV2 {
    address public immutable stETHAddr;
    address public immutable wstETHAddr;
    address public immutable lidoWithdrawalQueue;
    address public immutable collateralAddr;

    event WrapToWstETH(uint256 stETHAmount, uint256 wstETHAmount);
    event UnwrapToStETH(uint256 wstETHAmount, uint256 stETHAmount);
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
        address _wstETHAddr,
        address _lidoWithdrawalQueue,
        address _collateralAddr,
        string memory _name
    ) StrategyV2(_controller, _name) {
        wstETHAddr = _wstETHAddr;
        lidoWithdrawalQueue = _lidoWithdrawalQueue;
        collateralAddr = _collateralAddr;

        stETHAddr = IWstETH(wstETHAddr).stETH();
    }

    function deposit() public payable override onlyController notAtSameBlock {
        require(msg.value != 0, "zero value");

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
        actualAmount = _withdraw(_amount);
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

        latestUpdateTime = block.timestamp;
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        uint256 etherValue = address(this).balance;
        uint256 stETHValue = IERC20(stETHAddr).balanceOf(address(this));
        (, uint256 claimableValue, uint256 pendingValue) = checkPendingAssets();

        value =
            etherValue +
            stETHValue +
            claimableValue +
            pendingValue +
            getWstETHValue();
    }

    function getWstETHValue() public view returns (uint256 value) {
        uint256 wstBalance = IERC20(wstETHAddr).balanceOf(address(this));
        uint256 depositValue = IERC20(collateralAddr).balanceOf(address(this));

        value = IWstETH(wstETHAddr).getStETHByWstETH(wstBalance + depositValue);
    }

    function wrapToWstETH(
        uint256 _ethAmount,
        address _referral
    ) external onlyOwner returns (uint256 amount) {
        require(_ethAmount != 0, "zero");
        require(_ethAmount <= address(this).balance, "exceed balance");

        ILido lido = ILido(stETHAddr);

        uint256 balanceBefore = lido.balanceOf(address(this));

        ILido(stETHAddr).submit{value: _ethAmount}(_referral);

        uint256 stETHAmount = lido.balanceOf(address(this)) - balanceBefore;
        TransferHelper.safeApprove(stETHAddr, wstETHAddr, stETHAmount);

        amount = IWstETH(wstETHAddr).wrap(stETHAmount);

        emit WrapToWstETH(stETHAmount, amount);
    }

    function unwrapToStETH(
        uint256 _wstETHAmount
    ) external onlyOwner returns (uint256 amount) {
        require(_wstETHAmount != 0, "zero");

        amount = IWstETH(wstETHAddr).unwrap(_wstETHAmount);

        emit UnwrapToStETH(_wstETHAmount, amount);
    }

    function depositIntoSymbiotic(
        uint256 _wstETHAmount
    ) external onlyOwner returns (uint256 shares) {
        require(_wstETHAmount != 0, "zero");

        TransferHelper.safeApprove(wstETHAddr, collateralAddr, _wstETHAmount);

        shares = ICollateral(collateralAddr).deposit(
            address(this),
            _wstETHAmount
        );

        require(shares != 0, "mint zero share");

        emit DepositIntoSymbiotic(
            collateralAddr,
            address(this),
            _wstETHAmount,
            shares
        );
    }

    function withdraswFromSymbiotic(
        uint256 _share
    ) external onlyOwner returns (uint256 wstETHAmount) {
        require(_share != 0, "zero");

        wstETHAmount = IWstETH(wstETHAddr).balanceOf(address(this));

        ICollateral(collateralAddr).withdraw(address(this), _share);

        wstETHAmount =
            IWstETH(wstETHAddr).balanceOf(address(this)) -
            wstETHAmount;

        emit WithdrawFromSymbiotic(
            collateralAddr,
            address(this),
            _share,
            wstETHAmount
        );
    }

    function requestToEther(
        uint256 _amount
    ) external onlyOwner returns (uint256 etherAmount) {
        IERC20 token = IERC20(stETHAddr);

        require(_amount != 0, "zero");
        require(_amount <= token.balanceOf(address(this)), "exceed balance");

        token.approve(lidoWithdrawalQueue, _amount);

        ILidoWithdrawalQueue withdrawalQueue = ILidoWithdrawalQueue(
            lidoWithdrawalQueue
        );
        uint256 maxAmountPerRequest = withdrawalQueue
            .MAX_STETH_WITHDRAWAL_AMOUNT();
        uint256 minAmountPerRequest = withdrawalQueue
            .MIN_STETH_WITHDRAWAL_AMOUNT();

        uint256[] memory amounts;
        if (_amount <= maxAmountPerRequest) {
            amounts = new uint256[](1);
            amounts[0] = _amount;
        } else {
            uint256 length = _amount / maxAmountPerRequest + 1;
            uint256 remainder = _amount % maxAmountPerRequest;

            if (remainder >= minAmountPerRequest) {
                amounts = new uint256[](length);
                amounts[length - 1] = remainder;
            } else {
                amounts = new uint256[](length - 1);
            }

            uint256 i;
            for (i; i < length - 1; i++) {
                amounts[i] = maxAmountPerRequest;
            }
        }

        uint256[] memory ids = withdrawalQueue.requestWithdrawals(
            amounts,
            address(this)
        );
        require(ids.length != 0, "Lido request withdrawal error");

        etherAmount = _amount;
    }

    function claimPendingAssets(uint256[] memory _ids) external onlyOwner {
        uint256 length = _ids.length;
        require(length != 0, "invalid length");

        for (uint256 i; i < length; i++) {
            if (_ids[i] == 0) continue;
            ILidoWithdrawalQueue(lidoWithdrawalQueue).claimWithdrawal(_ids[i]);
        }
    }

    function claimAllPendingAssets() external onlyOwner {
        (uint256[] memory ids, , ) = checkPendingAssets();

        uint256 length = ids.length;
        for (uint256 i; i < length; i++) {
            if (ids[i] == 0) continue;
            ILidoWithdrawalQueue(lidoWithdrawalQueue).claimWithdrawal(ids[i]);
        }
    }

    function checkPendingAssets()
        public
        returns (
            uint256[] memory ids,
            uint256 totalClaimable,
            uint256 totalPending
        )
    {
        ILidoWithdrawalQueue queue = ILidoWithdrawalQueue(lidoWithdrawalQueue);

        uint256[] memory allIds = queue.getWithdrawalRequests(address(this));

        if (allIds.length == 0) {
            return (new uint256[](0), 0, 0);
        }

        ids = new uint256[](allIds.length);

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
                ids[j++] = allIds[i];
                totalClaimable = totalClaimable + status.amountOfStETH;
            } else {
                totalPending = totalPending + status.amountOfStETH;
            }
        }

        assembly {
            mstore(ids, j)
        }
    }

    receive() external payable {}
}
