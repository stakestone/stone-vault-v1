// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IStoneVault {
    function deposit() external payable returns (uint256 mintAmount);

    function requestWithdraw(uint256 _shares) external;

    function instantWithdraw(
        uint256 _amount,
        uint256 _shares
    ) external returns (uint256 actualWithdrawn);

    function cancelWithdraw(uint256 _shares) external;

    function rollToNextRound() external;
}
