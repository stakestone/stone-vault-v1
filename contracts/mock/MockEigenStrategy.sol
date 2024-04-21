// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../strategies/EigenStrategy.sol";
contract MockEigenStrategy is EigenStrategy {
    constructor(
        address payable _controller,
        string memory _name
    ) public EigenStrategy(_controller, name) {}
}
