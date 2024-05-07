// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {L2StandardERC20} from "@eth-optimism/contracts/standards/L2StandardERC20.sol";

contract L2Stone is L2StandardERC20 {
    constructor(
        address _l2Bridge,
        address _l1Token
    ) L2StandardERC20(_l2Bridge, _l1Token, "StakeStone Ether", "STONE") {}
}
