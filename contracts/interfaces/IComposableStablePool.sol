// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IComposableStablePool {
    function getRate() external view returns (uint256);

    function getTokenRate(address token) external view returns (uint256);
}
