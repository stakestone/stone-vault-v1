// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IStableSwapPool {
    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external payable returns (uint256);
}
