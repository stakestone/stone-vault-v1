// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IRocketDepositPool {
    function deposit() external payable;

    function getMaximumDepositAmount() external view returns (uint256);
}
