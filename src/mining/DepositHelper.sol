// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IStoneVault} from "../interfaces/IStoneVault.sol";

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DepositHelper is ReentrancyGuard {
    address public immutable stone;
    address payable public immutable vault;

    address public immutable wallet;

    mapping(address => uint256) public stakingBalance0f;

    event DepositTo(
        address indexed srcAddr,
        address indexed dstAddr,
        address indexed wallet,
        uint256 etherAmount,
        uint256 stoneAmount
    );

    constructor(address _stone, address payable _vault, address _wallet) {
        require(_stone != address(0), "zero address");
        require(_vault != address(0), "zero address");
        require(_wallet != address(0), "zero address");

        stone = _stone;
        vault = _vault;
        wallet = _wallet;
    }

    function deposit(
        address _dstAddress
    ) public payable nonReentrant returns (uint256 stoneMinted) {
        require(msg.value > 0, "ZERO Amount");

        IStoneVault stoneVault = IStoneVault(vault);
        stoneMinted = stoneVault.deposit{value: msg.value}();

        TransferHelper.safeTransfer(stone, wallet, stoneMinted);

        stakingBalance0f[msg.sender] += msg.value;

        emit DepositTo(msg.sender, _dstAddress, wallet, msg.value, stoneMinted);
    }
}
