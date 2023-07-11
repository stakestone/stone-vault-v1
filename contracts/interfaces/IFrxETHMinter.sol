// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IFrxETHMinter {
    function submitAndDeposit(
        address recipient
    ) external payable returns (uint256 shares);
}
