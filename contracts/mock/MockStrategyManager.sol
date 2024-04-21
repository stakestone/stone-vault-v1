// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IStrategyManager.sol";

contract MockStrategyManager is IStrategyManager {
    function depositIntoStrategy(
        address strategy,
        address token,
        uint256 amount
    ) external returns (uint256 shares) {
        shares = amount;
    }
}
