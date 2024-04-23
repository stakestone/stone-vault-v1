// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

// 定义 SwappingAggregator 接口
interface ISwappingAggregator_mock {
    function swap(address _token, uint256 _amount, bool _isSell) external returns (uint256);
}