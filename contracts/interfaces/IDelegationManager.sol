// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDelegationManager {
    struct SignatureWithExpiry {
        bytes signature;
        uint256 expiry;
    }

    struct QueuedWithdrawalParams {
        address[] strategies;
        uint256[] shares;
        address withdrawer;
    }

    struct Withdrawal {
        address staker;
        address delegatedTo;
        address withdrawer;
        uint256 nonce;
        uint32 startBlock;
        address[] strategies;
        uint256[] shares;
    }

    function delegateTo(
        address operator,
        SignatureWithExpiry memory approverSignatureAndExpiry,
        bytes32 approverSalt
    ) external;

    function undelegate(
        address staker
    ) external returns (bytes32[] memory withdrawalRoots);

    function queueWithdrawals(
        QueuedWithdrawalParams[] calldata queuedWithdrawalParams
    ) external returns (bytes32[] memory);

    function completeQueuedWithdrawal(
        Withdrawal calldata withdrawal,
        IERC20[] calldata tokens,
        uint256 middlewareTimesIndex,
        bool receiveAsTokens
    ) external;

    function isOperator(address operator) external view returns (bool);
}
