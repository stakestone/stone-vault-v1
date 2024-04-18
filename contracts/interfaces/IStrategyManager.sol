// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IStrategyManager {
    function depositIntoStrategy(
        address strategy,
        address token,
        uint256 amount
    ) external returns (uint256 shares);
}
