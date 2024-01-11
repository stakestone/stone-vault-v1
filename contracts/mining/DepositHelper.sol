// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IStoneVault} from "../interfaces/IStoneVault.sol";

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DepositHelper is ReentrancyGuard {
    address public immutable stone;
    address payable public immutable vault;

    address public immutable wallet;

    event DepositTo(
        address indexed srcAddr,
        address indexed dstAddr,
        uint256 etherAmount,
        uint256 stoneAmount
    );

    constructor(address _stone, address payable _vault, address _wallet) {
        stone = _stone;
        vault = _vault;
        wallet = _wallet;
    }

    function deposit()
        public
        payable
        nonReentrant
        returns (uint256 stoneMinted)
    {
        require(msg.value > 0, "ZERO AMount");

        IStoneVault stoneVault = IStoneVault(vault);
        stoneMinted = stoneVault.deposit{value: msg.value}();

        TransferHelper.safeTransfer(stone, wallet, stoneMinted);

        emit DepositTo(msg.sender, wallet, msg.value, stoneMinted);
    }

    receive() external payable {
        this.deposit{value: msg.value}();
    }
}
