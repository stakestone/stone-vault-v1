// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;
import "../interfaces/ISwappingAggregator_mock.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// 模拟 SwappingAggregator 合约
contract MockSwappingAggregator is ISwappingAggregator_mock {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // 定义 WETH 合约地址
    address public immutable WETH;

    // 在构造函数中接收 WETH 合约地址
    constructor(address _weth) {
       WETH = _weth;
    }

    // 实现 swap 函数
    function swap(address _token, uint256 _amount, bool _isSell) external override returns (uint256) {
        // 假设兑换比例为 1:1
        uint256 tokenAmount = _amount.div(1);
        if (!_isSell) {
            IERC20(_token).safeTransfer(msg.sender, tokenAmount);
            payable(msg.sender).transfer(_amount);
        }

        return tokenAmount;
   
    }
}
