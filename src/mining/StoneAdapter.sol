// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IMiningPoolTokenAdapter} from "../interfaces/IMiningPoolTokenAdapter.sol";

contract StoneAdapter is IMiningPoolTokenAdapter {
    function getStoneValue(
        uint256 _amount
    ) external view override returns (uint256 value) {
        value = _amount;
    }
}
