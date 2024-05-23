// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IStableSwap} from "../interfaces/IStableSwap.sol";

contract Migration is Ownable2Step, IStableSwap {
    address public immutable STETH;
    address public immutable aggregator;
    address public immutable strategy;

    modifier onlyAggregator() {
        require(aggregator == msg.sender, "not aggregator");
        _;
    }

    constructor(address _token, address _aggregator, address _strategy) {
        STETH = _token;
        aggregator = _aggregator;
        strategy = _strategy;
    }

    function coins(uint256 i) external view override returns (address) {
        return i == 0 ? 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE : STETH;
    }

    function get_dy(
        uint256 i,
        uint256 j,
        uint256 dx
    ) external view override returns (uint256) {
        require(i == 1 && j == 0, "invalid op");

        return dx;
    }

    function exchange(
        uint256 i,
        uint256 j,
        uint256 dx,
        uint256 min_dy
    ) external payable override onlyAggregator returns (uint256) {
        require(i == 1 && j == 0, "invalid op");
        require(dx > 0, "invalid amount");

        TransferHelper.safeTransferFrom(STETH, msg.sender, strategy, dx);

        return dx;
    }

    function calc_token_amount(
        uint256[2] memory,
        bool
    ) external view override returns (uint256) {
        revert("Not Support");
    }

    function fee() external view override returns (uint256) {
        revert("Not Support");
    }

    function admin_fee() external view override returns (uint256) {
        revert("Not Support");
    }

    function calc_withdraw_one_coin(
        uint256 _token_amount,
        int128 i
    ) external view override returns (uint256) {
        revert("Not Support");
    }

    function lp_token() external view override returns (address) {
        revert("Not Support");
    }

    function get_dy(
        int128 i,
        int128 j,
        uint256 dx
    ) external view override returns (uint256) {
        revert("Not Support");
    }

    function remove_liquidity_imbalance(
        uint256[2] memory _amounts,
        uint256 _max_burn_amount
    ) external override returns (uint256) {
        revert("Not Support");
    }

    function remove_liquidity_one_coin(
        uint256 _token_amount,
        int128 i,
        uint256 _min_amount
    ) external override returns (uint256) {
        revert("Not Support");
    }

    function add_liquidity(
        uint256[2] memory amounts,
        uint256 min_mint_amount
    ) external payable override returns (uint256) {
        revert("Not Support");
    }

    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 min_dy
    ) external payable override returns (uint256) {
        revert("Not Support");
    }
}
