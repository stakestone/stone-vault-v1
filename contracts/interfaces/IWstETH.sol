// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IWstETH {
    function stETH() external view returns (address);

    function getWstETHByStETH(
        uint256 _stETHAmount
    ) external view returns (uint256);

    function getStETHByWstETH(
        uint256 _wstETHAmount
    ) external view returns (uint256);

    function wrap(uint256 _stETHAmount) external returns (uint256);

    function unwrap(uint256 _wstETHAmount) external returns (uint256);

    function balanceOf(address account) external view returns (uint256);
}
