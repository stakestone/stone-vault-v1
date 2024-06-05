// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IAquaLpToken {

    function mint(uint amount) external;

    function redeem(uint redeemTokens) external returns (uint);

    function redeemUnderlying(uint redeemAmount) external;

    function repay(uint borrwAmount, uint lendingAmount) external;

    function exchangeRateCurrent() external returns (uint);
}