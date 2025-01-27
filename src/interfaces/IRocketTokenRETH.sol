// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRocketTokenRETH is IERC20 {
    function getEthValue(uint256 _rethAmount) external view returns (uint256);

    function getRethValue(uint256 _ethAmount) external view returns (uint256);

    function burn(uint256 _rethAmount) external;
}
