// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {EigenStrategy} from "../EigenStrategy.sol";
import {SwappingAggregator} from "../SwappingAggregator.sol";

import {IStrategyManager} from "../../interfaces/IStrategyManager.sol";
import {IDelegationManager} from "../../interfaces/IDelegationManager.sol";
import {IEigenStrategy} from "../../interfaces/IEigenStrategy.sol";
import {ILido} from "../../interfaces/ILido.sol";
import {ILidoWithdrawalQueue} from "../../interfaces/ILidoWithdrawalQueue.sol";

contract EigenLSTRestaking is EigenStrategy {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    address public immutable tokenAddr;
    address public immutable strategyManager;
    address public immutable delegationManager;
    address public immutable eigenStrategy;

    address public immutable LidoWithdrawalQueue;
    address payable public immutable SWAPPING;

    address public referral;

    address public eigenOperator;

    bool public buyOnDex;
    bool public sellOnDex;

    bytes32[] public withdrawals;

    mapping(bytes32 => uint256) public withdrawingShares;

    EnumerableSet.Bytes32Set private withdrawalRootsSet;

    event Swap(address from, address to, uint256 sent, uint256 received);
    event DepositIntoStrategy(address strategy, address token, uint256 amount);
    event DelegateTo(address operator);
    event WithdrawalQueued(bytes32 withdrawalRoot);
    event WithdrawalCompleted(
        IDelegationManager.Withdrawal withdrawal,
        bytes32 root
    );
    event SetEigenOperator(address oldOperator, address newOperator);
    event SetWithdrawQueueParams(uint256 length, uint256 amount);
    event SetRouter(bool buyOnDex, bool sellOnDex);
    event SetReferral(address oldAddr, address newAddr);

    constructor(
        address payable _controller,
        address _tokenAddr,
        address _lidoWithdrawalQueue,
        address _strategyManager,
        address _delegationManager,
        address _eigenStrategy,
        address payable _swap,
        string memory _name
    ) EigenStrategy(_controller, _name) {
        require(
            _tokenAddr != address(0) &&
                _lidoWithdrawalQueue != address(0) &&
                _strategyManager != address(0) &&
                _delegationManager != address(0) &&
                _eigenStrategy != address(0) &&
                _swap != address(0),
            "ZERO ADDRESS"
        );

        tokenAddr = _tokenAddr;
        LidoWithdrawalQueue = _lidoWithdrawalQueue;

        strategyManager = _strategyManager;
        delegationManager = _delegationManager;
        eigenStrategy = _eigenStrategy;

        SWAPPING = _swap;
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
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function _withdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");
        require(_amount <= address(this).balance, "not enough");

        actualAmount = _amount;

        TransferHelper.safeTransferETH(controller, actualAmount);

        latestUpdateTime = block.timestamp;
    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 balance = address(this).balance;

        if (balance != 0) {
            TransferHelper.safeTransferETH(controller, balance);
            amount = balance;
        }
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    // TODO need testing
    function getInvestedValue() public override returns (uint256 value) {
        uint256 etherValue = address(this).balance;
        uint256 tokenValue = IERC20(tokenAddr).balanceOf(address(this));
        (, uint256 claimableValue, uint256 pendingValue) = checkPendingAssets();
        uint256 eigenValue = getRestakingValue();
        uint256 unstakingValue = getUnstakingValue();

        value =
            etherValue +
            tokenValue +
            claimableValue +
            pendingValue +
            eigenValue +
            unstakingValue;
    }

    function depositIntoStrategy(
        uint256 _amount
    ) external onlyOwner returns (uint256 shares) {
        TransferHelper.safeApprove(tokenAddr, strategyManager, _amount);

        shares = IStrategyManager(strategyManager).depositIntoStrategy(
            eigenStrategy,
            tokenAddr,
            _amount
        );

        emit DepositIntoStrategy(eigenStrategy, tokenAddr, _amount);
    }

    function delegateTo(
        IDelegationManager.SignatureWithExpiry
            memory _approverSignatureAndExpiry,
        bytes32 _approverSalt
    ) external onlyOwner {
        IDelegationManager(delegationManager).delegateTo(
            eigenOperator,
            _approverSignatureAndExpiry,
            _approverSalt
        );

        emit DelegateTo(eigenOperator);
    }

    function undelegate()
        external
        onlyOwner
        returns (bytes32[] memory withdrawalRoots)
    {
        require(
            IEigenStrategy(eigenStrategy).shares(address(this)) == 0,
            "active shares"
        );

        withdrawalRoots = IDelegationManager(delegationManager).undelegate(
            address(this)
        );
    }

    function queueWithdrawals(
        IDelegationManager.QueuedWithdrawalParams[]
            calldata _queuedWithdrawalParams
    ) external onlyOwner returns (bytes32[] memory withdrawalRoots) {
        require(
            _queuedWithdrawalParams.length == 1 &&
                _queuedWithdrawalParams[0].shares.length == 1 &&
                _queuedWithdrawalParams[0].strategies.length == 1,
            "invalid length"
        );
        withdrawalRoots = IDelegationManager(delegationManager)
            .queueWithdrawals(_queuedWithdrawalParams);

        uint256 length = withdrawalRoots.length;

        require(length == 1, "invalid root length");

        bytes32 root = withdrawalRoots[0];
        withdrawalRootsSet.add(root);
        withdrawingShares[root] = _queuedWithdrawalParams[0].shares[0];

        emit WithdrawalQueued(root);
    }

    function completeQueuedWithdrawal(
        IDelegationManager.Withdrawal calldata _withdrawal,
        IERC20[] calldata _tokens,
        uint256 _middlewareTimesIndex,
        bool _receiveAsTokens
    ) external onlyOwner {
        IDelegationManager(delegationManager).completeQueuedWithdrawal(
            _withdrawal,
            _tokens,
            _middlewareTimesIndex,
            _receiveAsTokens
        );

        bytes32 root = calculateWithdrawalRoot(_withdrawal);
        withdrawingShares[root] = 0;
        withdrawalRootsSet.remove(root);

        emit WithdrawalCompleted(_withdrawal, root);
    }

    function swapToToken(
        uint256 _amount
    ) external onlyOwner returns (uint256 tokenAmount) {
        require(_amount != 0, "zero");
        require(_amount <= address(this).balance, "exceed balance");

        if (!buyOnDex) {
            tokenAmount = ILido(tokenAddr).submit{value: _amount}(referral);
        } else {
            tokenAmount = SwappingAggregator(SWAPPING).swap{value: _amount}(
                tokenAddr,
                _amount,
                false
            );
        }

        emit Swap(address(0), tokenAddr, _amount, tokenAmount);
    }

    function swapToEther(
        uint256 _amount
    ) external onlyOwner returns (uint256 etherAmount) {
        IERC20 token = IERC20(tokenAddr);

        require(_amount != 0, "zero");
        require(_amount <= token.balanceOf(address(this)), "exceed balance");

        if (!sellOnDex) {
            token.approve(LidoWithdrawalQueue, _amount);

            ILidoWithdrawalQueue withdrawalQueue = ILidoWithdrawalQueue(
                LidoWithdrawalQueue
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
        } else {
            TransferHelper.safeApprove(tokenAddr, SWAPPING, _amount);
            etherAmount = SwappingAggregator(SWAPPING).swap(
                tokenAddr,
                _amount,
                true
            );
        }

        emit Swap(tokenAddr, address(0), _amount, etherAmount);
    }

    function setRouter(bool _buyOnDex, bool _sellOnDex) external onlyOwner {
        buyOnDex = _buyOnDex;
        sellOnDex = _sellOnDex;

        emit SetRouter(_buyOnDex, _sellOnDex);
    }

    function setEigenOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "ZERO ADDR");
        require(
            IDelegationManager(delegationManager).isOperator(_operator),
            "not operator"
        );

        emit SetEigenOperator(eigenOperator, _operator);
        eigenOperator = _operator;
    }

    function setReferral(address _referral) external onlyOwner {
        require(_referral != address(0), "ZERO ADDR");

        emit SetReferral(referral, _referral);
        referral = _referral;
    }

    function claimPendingAssets(uint256[] memory _ids) external onlyOwner {
        uint256 length = _ids.length;
        require(length != 0, "invalid length");

        for (uint256 i; i < length; i++) {
            if (_ids[i] == 0) continue;
            ILidoWithdrawalQueue(LidoWithdrawalQueue).claimWithdrawal(_ids[i]);
        }
    }

    function claimAllPendingAssets() external onlyOwner {
        (uint256[] memory ids, , ) = checkPendingAssets();

        uint256 length = ids.length;
        for (uint256 i; i < length; i++) {
            if (ids[i] == 0) continue;
            ILidoWithdrawalQueue(LidoWithdrawalQueue).claimWithdrawal(ids[i]);
        }
    }

    // TODO Gas consumption
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

    function getRestakingValue() public view returns (uint256 value) {
        value = IEigenStrategy(eigenStrategy).userUnderlyingView(address(this));
    }

    function getUnstakingValue() public view returns (uint256 value) {
        uint256 length = withdrawalRootsSet.length();

        uint256 i;
        for (i; i < length; i++) {
            value += IEigenStrategy(eigenStrategy).sharesToUnderlyingView(
                withdrawingShares[withdrawalRootsSet.at(i)]
            );
        }
    }

    function getWithdrawalRoots() public view returns (bytes32[] memory roots) {
        uint256 length = withdrawalRootsSet.length();

        roots = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            roots[i] = withdrawalRootsSet.at(i);
        }
    }

    function calculateWithdrawalRoot(
        IDelegationManager.Withdrawal memory withdrawal
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(withdrawal));
    }

    receive() external payable {}
}
