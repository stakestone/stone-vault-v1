// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {EigenNativeRestakingStrategy} from "./EigenNativeRestakingStrategy.sol";

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Account is Ownable2Step {
    /**
     * @dev A transaction is invoked on the Account.
     */
    event Invoked(address indexed targetAddress, uint256 value, bytes data);

    address public immutable controller;
    address public eigenPod;

    constructor(address _admin) {
        controller = msg.sender;

        transferOwnership(_admin);
    }

    modifier onlyAuth() {
        require(msg.sender == controller || msg.sender == owner(), "unauth");
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
        EigenNativeRestakingStrategy strategy = EigenNativeRestakingStrategy(
            payable(controller)
        );

        require(
            value == 0 ||
                target == controller ||
                target == strategy.batchDeposit(),
            "not permit"
        );

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
