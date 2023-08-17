// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IMiningPoolTokenAdapter {
    function getStoneValue(
        uint256 _amount
    ) external view returns (uint256 value);
}
