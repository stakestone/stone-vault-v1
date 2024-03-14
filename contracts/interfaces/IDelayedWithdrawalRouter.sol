// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IDelayedWithdrawalRouter {
    function claimDelayedWithdrawals(
        uint256 maxNumberOfDelayedWithdrawalsToClaim
    ) external;
}
