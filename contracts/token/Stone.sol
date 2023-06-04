// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Stone is ERC20 {
    address public minter;

    constructor(address _minter) ERC20("Stone", "Stone") {
        minter = _minter;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "NM");
        _;
    }

    function mint(address _to, uint256 _amount) external onlyMinter {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyMinter {
        _burn(_from, _amount);
    }
}
