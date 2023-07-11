// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface ILido {
    function submit(address _referral) external payable returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);
}
