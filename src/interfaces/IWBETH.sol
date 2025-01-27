// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IWBETH {
    function deposit(address referral) external payable;

    function exchangeRate() external view returns (uint256 _exchangeRate);

    function balanceOf(address account) external view returns (uint256);

    function requestWithdrawEth(uint256 wbethAmount) external;
}
