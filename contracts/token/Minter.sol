// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {Stone} from "./Stone.sol";

contract Minter {
    address public stone;

    // TODO: governable upgrade
    mapping(address => bool) public keepers;

    modifier onlyKeeper() {
        require(keepers[msg.sender], "not keeper");
        _;
    }

    constructor(address _stone, address[] memory _keepers) {
        stone = _stone;

        for (uint i = 0; i < _keepers.length; i++) {
            keepers[_keepers[i]] = true;
        }
    }

    function mint(address _to, uint256 _amount) external onlyKeeper {
        Stone(stone).mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyKeeper {
        Stone(stone).burn(_from, _amount);
    }
}
