// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IStrategyManager.sol";

contract MockStrategyManager is IStrategyManager {
    address public lastStrategy;
    address public lastToken;
    uint256 public lastAmount;
    uint256 public shares;

    function depositIntoStrategy(
        address strategy,
        address token,
        uint256 amount
    ) external override returns (uint256) {
        lastStrategy = strategy;
        lastToken = token;
        lastAmount = amount;

        // 模拟返回的 shares
        shares = amount * 2; 

        return shares;
    }
}