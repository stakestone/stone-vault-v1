// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ILidoWithdrawalQueue {
    struct WithdrawalRequestStatus {
        /// @notice stETH token amount that was locked on withdrawal queue for this request
        uint256 amountOfStETH;
        /// @notice amount of stETH shares locked on withdrawal queue for this request
        uint256 amountOfShares;
        /// @notice address that can claim or transfer this request
        address owner;
        /// @notice timestamp of when the request was created, in seconds
        uint256 timestamp;
        /// @notice true, if request is finalized
        bool isFinalized;
        /// @notice true, if request is claimed. Request is claimable if (isFinalized && !isClaimed)
        bool isClaimed;
    }

    function MAX_STETH_WITHDRAWAL_AMOUNT() external view returns (uint256);

    function getWithdrawalRequests(
        address _owner
    ) external view returns (uint256[] memory requestsIds);

    function getWithdrawalStatus(
        uint256[] calldata _requestIds
    ) external view returns (WithdrawalRequestStatus[] memory statuses);

    function requestWithdrawals(
        uint256[] calldata _amounts,
        address _owner
    ) external returns (uint256[] memory requestIds);

    function claimWithdrawals(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints
    ) external;

    function claimWithdrawalsTo(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints,
        address _recipient
    ) external;

    function claimWithdrawal(uint256 _requestId) external;
}
