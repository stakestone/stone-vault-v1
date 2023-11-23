// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {IRocketDepositPool} from "../interfaces/IRocketDepositPool.sol";
import {IRocketTokenRETH} from "../interfaces/IRocketTokenRETH.sol";

import {Strategy} from "./Strategy.sol";
import {SwappingAggregator} from "./SwappingAggregator.sol";

contract RETHHoldingStrategy is Strategy {
    address public immutable ROCKET_DEPOSIT_POOL =
        0xDD3f50F8A6CafbE9b31a427582963f465E745AF8;

    address public immutable RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;

    address payable public immutable SWAPPING;

    bool public buyOnDex;
    bool public sellOnDex;

    constructor(
        address payable _controller,
        address payable _swap,
        string memory _name
    ) Strategy(_controller, _name) {
        require(_swap != address(0), "ZERO ADDRESS");

        SWAPPING = _swap;
    }

    function deposit() public payable override onlyController {
        uint256 amount = msg.value;
        require(amount != 0, "zero value");

        if (!buyOnDex) {
            IRocketDepositPool pool = IRocketDepositPool(ROCKET_DEPOSIT_POOL);
            uint256 max = pool.getMaximumDepositAmount();
            require(amount < max, "exceed max");

            pool.deposit{value: amount}();
        } else {
            SwappingAggregator(SWAPPING).swap{value: amount}(
                RETH,
                amount,
                false
            );
        }

        latestUpdateTime = block.timestamp;
    }

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function instantWithdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function _withdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        IRocketTokenRETH rETH = IRocketTokenRETH(RETH);

        uint256 rETHAmount = rETH.getRethValue(_amount) <
            IRocketTokenRETH(RETH).balanceOf(address(this))
            ? rETH.getRethValue(_amount)
            : IRocketTokenRETH(RETH).balanceOf(address(this));

        if (rETHAmount == 0) {
            return 0;
        }

        if (!sellOnDex) {
            rETH.burn(rETHAmount);
        } else {
            TransferHelper.safeApprove(RETH, SWAPPING, rETHAmount);
            SwappingAggregator(SWAPPING).swap(RETH, rETHAmount, true);
        }

        actualAmount = address(this).balance;
        TransferHelper.safeTransferETH(controller, actualAmount);

        latestUpdateTime = block.timestamp;
    }

    function clear()
        public
        override
        onlyController
        returns (uint256 actualAmount)
    {
        IRocketTokenRETH rETH = IRocketTokenRETH(RETH);
        uint256 amount = rETH.balanceOf(address(this));

        if (amount == 0) {
            return 0;
        }

        if (!sellOnDex) {
            rETH.burn(amount);
        } else {
            TransferHelper.safeApprove(RETH, SWAPPING, amount);
            SwappingAggregator(SWAPPING).swap(RETH, amount, true);
        }

        actualAmount = address(this).balance;
        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue() + getPendingValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        IRocketTokenRETH rETH = IRocketTokenRETH(RETH);

        value =
            rETH.getEthValue(rETH.balanceOf(address(this))) +
            address(this).balance;
    }

    function getPendingValue() public override returns (uint256 value) {
        return 0;
    }

    function checkPendingStatus()
        public
        override
        returns (uint256 pending, uint256 executable)
    {
        return (0, 0);
    }

    function setRouter(
        bool _buyOnDex,
        bool _sellOnDex
    ) external onlyGovernance {
        buyOnDex = _buyOnDex;
        sellOnDex = _sellOnDex;
    }

    receive() external payable {}
}
