// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {Strategy} from "../strategies/Strategy.sol";
import {StrategyController} from "../strategies/StrategyController.sol";

contract MockNullStrategy is Strategy {
    using SafeMath for uint256;

    constructor(
        address payable _controller,
        string memory _name
    ) Strategy(_controller, _name) {}

    function deposit() public payable override onlyController {}

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        StrategyController strategyController = StrategyController(controller);

        TransferHelper.safeTransferETH(address(strategyController), _amount);

        actualAmount = _amount;
    }

    function instantWithdraw(
        uint256 _amount
    ) public virtual override onlyController returns (uint256 actualAmount) {
        actualAmount = withdraw(_amount);
    }

    function clear() public override onlyController returns (uint256 amount) {
        amount = withdraw(address(this).balance);
    }

    function getAllValue() public view override returns (uint256 value) {
        return address(this).balance;
    }

    function getInvestedValue() public view override returns (uint256 value) {
        return address(this).balance;
    }

    receive() external payable {}
}
