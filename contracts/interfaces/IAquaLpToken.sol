// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IAquaLpToken {

    function mint(uint mintAmount) external returns (uint);

    function redeem(uint redeemTokens) external returns (uint);

    function redeemUnderlying(uint redeemAmount) external returns (uint);

    function exchangeRateCurrent() external returns (uint);
}