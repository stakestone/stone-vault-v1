// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IEigenStrategy {
    function userUnderlyingView(address user) external view returns (uint256);
}
