// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IStableSwap {
    function lp_token() external view returns (address);

    function coins(uint256 i) external view returns (address);

    function get_dy(
        int128 i,
        int128 j,
        uint256 dx
    ) external view returns (uint256);

    function get_dy(
        uint256 i,
        uint256 j,
        uint256 dx
    ) external view returns (uint256);

    function fee() external view returns (uint256);

    function admin_fee() external view returns (uint256);

    function calc_withdraw_one_coin(
        uint256 _token_amount,
        int128 i
    ) external view returns (uint256);

    function calc_token_amount(
        uint256[2] memory,
        bool
    ) external view returns (uint256);

    function remove_liquidity_imbalance(
        uint256[2] memory _amounts,
        uint256 _max_burn_amount
    ) external returns (uint256);

    function remove_liquidity_one_coin(
        uint256 _token_amount,
        int128 i,
        uint256 _min_amount
    ) external returns (uint256);

    function add_liquidity(
        uint256[2] memory amounts,
        uint256 min_mint_amount
    ) external payable returns (uint256);

    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external payable returns (uint256);

    function exchange(
        uint256 i,
        uint256 j,
        uint256 dx,
        uint256 min_dy
    ) external payable returns (uint256);
}
