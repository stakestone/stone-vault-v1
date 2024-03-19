// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {Strategy} from "../Strategy.sol";
import {Account} from "./Account.sol";

import {IEigenPodManager} from "../../interfaces/IEigenPodManager.sol";
import {IEigenPod} from "../../interfaces/IEigenPod.sol";
import {IDelayedWithdrawalRouter} from "../../interfaces/IDelayedWithdrawalRouter.sol";

contract EigenNativeRestakingStrategy is Strategy {
    uint256 public immutable ETHER_PER_NODE = 32 ether;

    uint256 public pendingNodeAmount;
    uint256 public activeNodeAmount;
    uint256 public withdrawingNodeAmount;

    mapping(address => address) public eigenPodOwners;

    address[] public eigenPods;

    address public eigenPodManager;
    address public immutable delayedWithdrawalRouter;
    address public immutable batchDeposit;

    event SetNewEigenPodManager(address olAddr, address newAddr);
    event EigenPodCreated(address owner, address eigenPod);

    constructor(
        address payable _controller,
        address _eigenPodManager,
        address _batchDeposit,
        address _delayedWithdrawalRouter,
        string memory _name
    ) Strategy(_controller, _name) {
        eigenPodManager = _eigenPodManager;
        batchDeposit = _batchDeposit;
        delayedWithdrawalRouter = _delayedWithdrawalRouter;
    }

    function deposit() public payable override onlyController notAtSameBlock {
        uint256 amount = msg.value;
        require(amount != 0, "zero value");

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
        value = getInvestedValue() + address(this).balance;
    }

    function getInvestedValue() public override returns (uint256 value) {
        value =
            (pendingNodeAmount + activeNodeAmount + withdrawingNodeAmount) *
            ETHER_PER_NODE;
    }

    function getEigenPodsValue() public returns (uint256 value) {
        for (uint256 i; i < eigenPods.length; i++) {
            value += address(eigenPods[i]).balance;
        }
    }

    function createEigenPod() external returns (address owner, address pod) {
        Account podOwner = new Account(governance);

        bool success;
        (success, ) = address(podOwner).call{value: 0}(
            abi.encodeCall(podOwner.acceptOwnership, ())
        );
        if (!success) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        bytes memory result = podOwner.invoke(
            eigenPodManager,
            0,
            abi.encodeCall(IEigenPodManager.createPod, ())
        );

        owner = address(podOwner);
        pod = bytesToAddress(result);

        emit EigenPodCreated(owner, pod);

        eigenPods.push(pod);
        eigenPodOwners[pod] = owner;
    }

    function stakeToNodeOperators(
        uint256 _nodeAmount,
        address _eigenPod,
        bytes memory _rawData
    ) external onlyGovernance {
        address podOwner = eigenPodOwners[_eigenPod];
        require(podOwner != address(0), "EigenPod not exist");

        uint256 totalEtherAmount = ETHER_PER_NODE * _nodeAmount;
        TransferHelper.safeTransferETH(podOwner, totalEtherAmount);

        Account account = Account(payable(podOwner));
        account.invoke(batchDeposit, totalEtherAmount, _rawData);

        pendingNodeAmount += _nodeAmount;
    }

    function finalizePendingNode(uint256 _nodeAmount) external onlyGovernance {
        pendingNodeAmount -= _nodeAmount;
        activeNodeAmount += _nodeAmount;
    }

    function unstakeFromNodeOperators(
        uint256 _nodeAmount
    ) external onlyGovernance {
        activeNodeAmount -= _nodeAmount;
        withdrawingNodeAmount += _nodeAmount;
    }

    function unstakeFromEigenPod(address _eigenPod) external onlyGovernance {
        address podOwner = eigenPodOwners[_eigenPod];
        require(podOwner != address(0), "EigenPod not exist");

        Account account = Account(payable(podOwner));
        account.invoke(
            _eigenPod,
            0,
            abi.encodeCall(IEigenPod.withdrawBeforeRestaking, ())
        );
    }

    function finalizeWithdrawingNode(
        uint256 _nodeAmount,
        address _eigenPod
    ) external onlyGovernance {
        address podOwner = eigenPodOwners[_eigenPod];
        require(podOwner != address(0), "EigenPod not exist");

        Account account = Account(payable(podOwner));
        account.invoke(
            delayedWithdrawalRouter,
            0,
            abi.encodeCall(
                IDelayedWithdrawalRouter.claimDelayedWithdrawals,
                (type(uint256).max)
            )
        );
        account.invoke(address(this), podOwner.balance, "");

        withdrawingNodeAmount -= _nodeAmount;
    }

    function verifyAndProcessWithdrawals(
        address _eigenPod,
        uint64 _oracleTimestamp,
        IEigenPod.StateRootProof calldata _stateRootProof,
        IEigenPod.WithdrawalProof[] calldata _withdrawalProofs,
        bytes[] calldata _validatorFieldsProofs,
        bytes32[][] calldata _validatorFields,
        bytes32[][] calldata _withdrawalFields
    ) external onlyGovernance {
        address podOwner = eigenPodOwners[_eigenPod];
        require(podOwner != address(0), "EigenPod not exist");

        Account account = Account(payable(podOwner));
        account.invoke(
            _eigenPod,
            0,
            abi.encodeCall(
                IEigenPod.verifyAndProcessWithdrawals,
                (
                    _oracleTimestamp,
                    _stateRootProof,
                    _withdrawalProofs,
                    _validatorFieldsProofs,
                    _validatorFields,
                    _withdrawalFields
                )
            )
        );
    }

    function verifyWithdrawalCredentials(
        address _eigenPod,
        uint64 _oracleTimestamp,
        IEigenPod.StateRootProof calldata _stateRootProof,
        uint40[] calldata _validatorIndices,
        bytes[] calldata _validatorFieldsProofs,
        bytes32[][] calldata _validatorFields
    ) external onlyGovernance {
        address podOwner = eigenPodOwners[_eigenPod];
        require(podOwner != address(0), "EigenPod not exist");

        Account account = Account(payable(podOwner));
        account.invoke(
            _eigenPod,
            0,
            abi.encodeCall(
                IEigenPod.verifyWithdrawalCredentials,
                (
                    _oracleTimestamp,
                    _stateRootProof,
                    _validatorIndices,
                    _validatorFieldsProofs,
                    _validatorFields
                )
            )
        );
    }

    function forceUpdateNodeAmount(
        uint256 _pendingNodeAmount,
        uint256 _activeNodeAmount,
        uint256 _withdrawingNodeAmount
    ) external onlyGovernance {
        pendingNodeAmount = _pendingNodeAmount;
        activeNodeAmount = _activeNodeAmount;
        withdrawingNodeAmount = _withdrawingNodeAmount;
    }

    function getEigenPods(
        uint256 _start,
        uint256 _limit
    ) external view returns (address[] memory pods) {
        uint256 length = eigenPods.length;
        require(_start + _limit < length, "out of bounds");

        pods = new address[](length);
        for (uint256 i; i < _limit; i++) {
            pods[i] = eigenPods[_start + i];
        }
    }

    function getEigenPodsLength() external view returns (uint256 length) {
        return eigenPods.length;
    }

    function setNewEigenPodManager(
        address _eigenPodManager
    ) external onlyGovernance {
        require(_eigenPodManager != address(0), "Invalid address");

        emit SetNewEigenPodManager(eigenPodManager, _eigenPodManager);

        eigenPodManager = _eigenPodManager;
    }

    function bytesToAddress(
        bytes memory data
    ) internal pure returns (address addr) {
        assembly {
            addr := mload(add(data, 32))
        }
    }

    receive() external payable {}
}
