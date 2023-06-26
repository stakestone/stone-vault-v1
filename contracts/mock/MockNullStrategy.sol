// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {Strategy} from "../strategies/Strategy.sol";
import {StrategyController} from "../strategies/StrategyController.sol";

contract MockNullStrategy is Strategy {
    using SafeMath for uint256;

    uint256 public totalDeposit;

    constructor(
        address payable _controller,
        string memory _name
    ) Strategy(_controller, _name) {}

    function deposit() public payable override onlyController {
        totalDeposit = totalDeposit.add(msg.value);
    }

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        totalDeposit = totalDeposit.sub(_amount);

        StrategyController strategyController = StrategyController(controller);

        TransferHelper.safeTransferETH(address(strategyController), _amount);

        actualAmount = _amount;
    }

    function instantWithdraw(
        uint256 _amount
    ) public virtual override returns (uint256 actualAmount) {
        actualAmount = withdraw(_amount);
    }

    function clear() public override onlyController returns (uint256 amount) {
        amount = withdraw(totalDeposit);
    }

    function getAllValue() public view override returns (uint256 value) {
        return totalDeposit;
    }

    function getInvestedValue() public view override returns (uint256 value) {
        return totalDeposit;
    }
}
