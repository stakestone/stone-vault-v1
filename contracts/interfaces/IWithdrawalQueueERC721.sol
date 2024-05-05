// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IWithdrawalQueueERC721 {
    function prefinalize(uint256[] memory _batches, uint256 _maxShareRate) external returns (uint256 ethToLock, uint256 sharesToBurn);

    function finalize(uint256 _lastRequestIdToBeFinalized, uint256 _maxShareRate) external;
    function getLastFinalizedRequestId() external view returns (uint256) ;
    function getLastRequestId() external view returns (uint256) ;
    function getRoleMember(bytes32 role, uint256 index) external view returns (address);
    function getRoleAdmin(bytes32 role) external view  returns (bytes32);
}
