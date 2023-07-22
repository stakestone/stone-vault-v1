// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IWstETH {
    function getWstETHByStETH(
        uint256 _stETHAmount
    ) external view returns (uint256);
}
