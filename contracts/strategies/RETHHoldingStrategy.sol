// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {IRocketDepositPool} from "../interfaces/IRocketDepositPool.sol";
import {IRocketTokenRETH} from "../interfaces/IRocketTokenRETH.sol";

import {Strategy} from "./Strategy.sol";

contract RETHHoldingStrategy is Strategy {
    address public immutable ROCKET_DEPOSIT_POOL =
        0xDD3f50F8A6CafbE9b31a427582963f465E745AF8;

    address public immutable RETH = 0xae78736Cd615f374D3085123A210448E74Fc6393;

    constructor(
        address payable _controller,
        string memory _name
    ) Strategy(_controller, _name) {}

    function deposit() public payable override onlyController {
        uint256 amount = msg.value;
        require(amount != 0, "zero value");

        IRocketDepositPool pool = IRocketDepositPool(ROCKET_DEPOSIT_POOL);
        uint256 max = pool.getMaximumDepositAmount();
        require(amount < max, "exceed max");

        pool.deposit{value: amount}();
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

        rETH.burn(rETHAmount);

        actualAmount = address(this).balance;

        TransferHelper.safeTransferETH(controller, actualAmount);
    }

    function clear()
        public
        override
        onlyController
        returns (uint256 actualAmount)
    {
        IRocketTokenRETH rETH = IRocketTokenRETH(RETH);
        uint256 amount = rETH.balanceOf(address(this));
        rETH.burn(amount);

        actualAmount = address(this).balance;

        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue() + getPendingValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        IRocketTokenRETH rETH = IRocketTokenRETH(RETH);

        value = rETH.getEthValue(rETH.balanceOf(address(this)));
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

    receive() external payable {}
}
