// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract MockSwappingAggregator {
    constructor() {}

    function swap(
        address _token,
        uint256 _amount,
        bool _isSell
    ) external payable returns (uint256) {
        if (!_isSell) {
            TransferHelper.safeTransfer(_token, msg.sender, _amount);
        } else {
            TransferHelper.safeTransferETH(msg.sender, _amount);
        }
        return _amount;
    }
        receive() external payable {}

}