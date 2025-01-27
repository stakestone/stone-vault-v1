// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ICollateral {
    function deposit(
        address recipient,
        uint256 amount
    ) external returns (uint256);

    function withdraw(address recipient, uint256 amount) external;
}
