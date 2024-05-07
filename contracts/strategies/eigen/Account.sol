// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {EigenStrategy} from "../EigenStrategy.sol";

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Account is Ownable2Step {
    /**
     * @dev A transaction is invoked on the Account.
     */
    event Invoked(address indexed targetAddress, uint256 value, bytes data);

    address public immutable controller;

    constructor(address _admin) {
        require(_admin != address(0), "invalid admin");

        controller = EigenStrategy(address(this)).controller();
    }

    modifier onlyAuth() {
        require(msg.sender == owner(), "unauth");
        _;
    }

    /**
     * @dev Allows Account contract to receive ETH.
     */
    receive() external payable {}

    function invoke(
        address target,
        uint256 value,
        bytes memory data
    ) public onlyAuth returns (bytes memory result) {
        require(value == 0 || target == controller, "not permit");

        bool success;
        (success, result) = target.call{value: value}(data);
        if (!success) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        emit Invoked(target, value, data);
    }
}
