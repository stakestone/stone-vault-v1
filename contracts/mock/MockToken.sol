// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./BEP20.sol";

/**
 * @notice Mock BEP20 tokens used for testing.
 */
contract MockToken is BEP20 {
    mapping(address => bool) public claimed;

    constructor(string memory name, string memory symbol)
        public
        BEP20(name, symbol)
    {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function setDecimals(uint8 _mock_decimals) public {
        _decimals = _mock_decimals;
    }

    function withdraw(uint256) external {}
}
