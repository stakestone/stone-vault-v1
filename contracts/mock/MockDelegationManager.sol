// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IDelegationManager.sol";

contract MockDelegationManager is IDelegationManager {
        constructor() {

    }
    function delegateTo(
        address operator,
        SignatureWithExpiry memory approverSignatureAndExpiry,
        bytes32 approverSalt
    ) external {}

    function undelegate(
        address staker
    ) external returns (bytes32[] memory withdrawalRoots) {
        return new bytes32[](0);
    }

    function queueWithdrawals(
        QueuedWithdrawalParams[] calldata queuedWithdrawalParams
    ) external returns (bytes32[] memory) {
        return new bytes32[](0);
    }

    function completeQueuedWithdrawal(
        Withdrawal calldata withdrawal,
        IERC20[] calldata tokens,
        uint256 middlewareTimesIndex,
        bool receiveAsTokens
    ) external {}

    function isOperator(address operator) external view returns (bool) {
        return true;
    }
}
