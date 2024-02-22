// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {EigenNativeRestakingStrategy} from "./EigenNativeRestakingStrategy.sol";

contract Account {
    /**
     * @dev A transaction is invoked on the Account.
     */
    event Invoked(address indexed targetAddress, uint256 value, bytes data);

    address public owner;
    address public admin;
    address public eigenPod;

    constructor(address _admin) {
        owner = msg.sender;
        admin = _admin;
    }

    modifier onlyAuth() {
        require(msg.sender == owner || msg.sender == admin, "unauth");
        _;
    }

    function transferAdmin(address _admin) public {
        require(msg.sender == admin, "not admin");
        admin = _admin;
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
            payable(owner)
        );

        require(
            value == 0 || target == owner || target == strategy.batchDeposit(),
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
