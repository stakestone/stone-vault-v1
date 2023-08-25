// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IWstETH {
    function getWstETHByStETH(
        uint256 _stETHAmount
    ) external view returns (uint256);

    function unwrap(uint256 _wstETHAmount) external returns (uint256);
}
