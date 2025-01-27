// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IUnwrapTokenV1ETH {
    struct WithdrawRequest {
        address recipient; // user who withdraw
        uint256 wbethAmount; //WBETH
        uint256 ethAmount; //ETH
        uint256 triggerTime; //user trigger time
        uint256 claimTime; //user claim time
        bool allocated; //is it allocated
    }

    function lockTime() external view returns (uint256);

    function getUserWithdrawRequests(
        address _recipient
    ) external view returns (WithdrawRequest[] memory);

    function getWithdrawRequests(
        uint256 _startIndex
    ) external view returns (WithdrawRequest[] memory);

    function claimWithdraw(uint256 _index) external;

    // testing
    function getNeedRechargeEthAmount() external view returns (uint256);

    function allocate(uint256 _maxAllocateNum) external returns (uint256);

    function rechargeFromRechargeAddress() external payable;

    function startAllocatedEthIndex() external view returns (uint256);

    function nextIndex() external view returns (uint256);

    function rechargeAddress() external view returns (address);

    function operatorAddress() external view returns (address);
}
