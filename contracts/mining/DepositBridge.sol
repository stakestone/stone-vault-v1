// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IStoneVault} from "../interfaces/IStoneVault.sol";
import {IStone} from "../interfaces/IStone.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DepositBridge is ReentrancyGuard {
    address public immutable stone;
    address payable public immutable vault;

    uint16 public immutable dstChainId;

    constructor(address _stone, address payable _vault, uint16 _dstChainId) {
        stone = _stone;
        vault = _vault;

        dstChainId = _dstChainId;
    }

    function bridgeTo(
        uint256 _amount,
        bytes calldata _dstAddress,
        uint256 _gasPaidForCrossChain
    ) public payable nonReentrant returns (uint256 stoneMinted) {
        require(msg.value >= _amount + _gasPaidForCrossChain, "wrong amount");

        IStoneVault stoneVault = IStoneVault(vault);
        stoneMinted = stoneVault.deposit{value: _amount}();

        IStone stoneToken = IStone(stone);
        stoneToken.sendFrom{value: _gasPaidForCrossChain}(
            address(this),
            dstChainId,
            _dstAddress,
            stoneMinted,
            payable(msg.sender),
            address(0),
            bytes("")
        );
    }

    function estimateSendFee(
        uint256 _amount,
        bytes calldata _dstAddress
    ) public view returns (uint nativeFee, uint zroFee) {
        return
            IStone(stone).estimateSendFee(
                dstChainId,
                _dstAddress,
                _amount,
                false,
                bytes("")
            );
    }

    receive() external payable {
        bytes memory stdAddr = abi.encode(msg.sender);

        (uint nativeFee, ) = this.estimateSendFee(msg.value, stdAddr);

        require(msg.value > nativeFee, "too little");

        uint256 amount = msg.value - nativeFee;
        this.bridgeTo{value: amount}(msg.value, stdAddr, nativeFee);
    }
}
