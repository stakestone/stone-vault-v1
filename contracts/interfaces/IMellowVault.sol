// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IMellowVault {
    struct WithdrawalRequest {
        address to;
        uint256 lpAmount;
        bytes32 tokensHash; // keccak256 hash of the tokens array at the moment of request
        uint256[] minAmounts;
        uint256 deadline;
        uint256 timestamp;
    }

    /// @notice Struct representing the current state used for processing withdrawals.
    struct ProcessWithdrawalsStack {
        address[] tokens;
        uint128[] ratiosX96;
        uint256[] erc20Balances;
        uint256 totalSupply;
        uint256 totalValue;
        uint256 ratiosX96Value;
        uint256 timestamp;
        uint256 feeD9;
        bytes32 tokensHash; // keccak256 hash of the tokens array at the moment of the call
    }

    function calculateStack()
        external
        view
        returns (ProcessWithdrawalsStack memory s);

    function withdrawalRequest(
        address user
    ) external view returns (WithdrawalRequest memory);

    function deposit(
        address to,
        uint256[] memory amounts,
        uint256 minLpAmount,
        uint256 deadline
    ) external returns (uint256[] memory actualAmounts, uint256 lpAmount);

    function emergencyWithdraw(
        uint256[] memory minAmounts,
        uint256 deadline
    ) external returns (uint256[] memory actualAmounts);

    function cancelWithdrawalRequest() external;

    function registerWithdrawal(
        address to,
        uint256 lpAmount,
        uint256[] memory minAmounts,
        uint256 deadline,
        uint256 requestDeadline,
        bool closePrevious
    ) external;

    // test
    function processWithdrawals(
        address[] memory users
    ) external returns (bool[] memory statuses);
}
