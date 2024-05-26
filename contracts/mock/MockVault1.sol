// SPDX-License-Identifier: MIT

pragma solidity 0.8.21;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Minter} from "../token/Minter.sol";

contract MockVault1 {
    address public immutable minter;

    constructor(address _minter) {
        require(_minter != address(0));
        minter = _minter;
    }
    function deposit() external payable returns (uint256 mintAmount) {
        // Get the deposited amount from the transaction
        uint256 amount = msg.value;
        mintAmount = amount / 2;
        Minter(minter).mint(msg.sender, mintAmount);
    }
}
