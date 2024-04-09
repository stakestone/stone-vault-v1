// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Minter} from "../token/Minter.sol";

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract MockVault{
        address public immutable minter;
                address public immutable btcAddr;

   constructor(
        address _minter,
            address _btcAddr
    ) {
        require(
            _minter != address(0) && _btcAddr != address(0)
        );

        minter = _minter;
        btcAddr = _btcAddr;

    }

    function deposit(uint256 _amount) external returns (uint256 mintAmount)
    {
        uint256 amount = _amount;
           TransferHelper.safeTransferFrom(
            btcAddr,
            msg.sender,
            address(this),
            amount
        );

        mintAmount = amount/2;
        Minter(minter).mint(msg.sender, mintAmount);

    }
}