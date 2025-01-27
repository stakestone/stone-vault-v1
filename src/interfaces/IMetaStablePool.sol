// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IMetaStablePool {
    function getRate() external view returns (uint256);
}
