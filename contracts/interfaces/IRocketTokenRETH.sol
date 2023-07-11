// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IRocketTokenRETH {
    function balanceOf(address account) external view returns (uint256);

    function getEthValue(uint256 _rethAmount) external view returns (uint256);

    function getRethValue(uint256 _ethAmount) external view returns (uint256);

    function burn(uint256 _rethAmount) external;
}
