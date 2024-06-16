// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IAquaLpToken.sol";

contract MockLpToken is IAquaLpToken {
    constructor() {}

    function mint(uint amount) external override returns (uint) {
        return amount;
    }

    function redeem(uint redeemTokens) external returns (uint) {}

    function redeemUnderlying(uint redeemAmount) external returns (uint) {}

    function exchangeRateCurrent() external override returns (uint) {
        return 2e18;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        return 1e18;
    }
}
