// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../strategies/EigenStrategy.sol";
import "../interfaces/IEigenStrategy.sol";

contract MockEigenStrategy is EigenStrategy, IEigenStrategy {
    uint256 private _mockValue; // 用于存储模拟的返回值

    constructor(address payable _controller, string memory _name) EigenStrategy(_controller, _name) {}

    function setUserUnderlyingViewMockValue(uint256 value) external {
        _mockValue = value;
    }

    function userUnderlyingView(address user) external view override returns (uint256) {
        // 返回存储的模拟值
        return _mockValue;
    }
}
