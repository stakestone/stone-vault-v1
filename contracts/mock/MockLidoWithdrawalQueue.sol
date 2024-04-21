// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "../interfaces/ILidoWithdrawalQueue.sol";

contract MockLidoWithdrawalQueue is ILidoWithdrawalQueue {
    function MAX_STETH_WITHDRAWAL_AMOUNT()
        external
        view
        returns (uint256 amount)
    {
        return 1000000; //mock返回100万
    }

    function getWithdrawalRequests(
        address _owner
    ) external view returns (uint256[] memory requestsIds) {
        return new uint256[](0);
    }

    function getWithdrawalStatus(
        uint256[] calldata _requestIds
    ) external view returns (WithdrawalRequestStatus[] memory statuses) {
        return new WithdrawalRequestStatus[](0);
    }

    function requestWithdrawals(
        uint256[] calldata _amounts,
        address _owner
    ) external returns (uint256[] memory requestIds) {
        return new uint256[](0);
    }

    function claimWithdrawals(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints
    ) external {}

    function claimWithdrawalsTo(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints,
        address _recipient
    ) external {}

    function claimWithdrawal(uint256 _requestId) external {}
}
