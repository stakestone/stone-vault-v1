// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IAuraRewardPool {
    function withdrawAndUnwrap(
        uint256 amount,
        bool claim
    ) external returns (bool);
}
