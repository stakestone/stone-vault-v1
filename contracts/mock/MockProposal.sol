// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Proposal} from "../governance/Proposal.sol";

contract MockProposal is Proposal {
    constructor(address _stoneVault) public Proposal(_stoneVault) {}

    // Proposal(
    //     deadline,
    //     votePeriod
    // )
    // {}
}
