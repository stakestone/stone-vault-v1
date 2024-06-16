// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStableSwap} from "../interfaces/IStableSwap.sol";

contract Swap is Ownable2Step, ReentrancyGuard, IStableSwap {
    address public immutable STETH;
    address public immutable aggregator;
    address public immutable strategy;
    address public immutable assetVault;

    uint256 public immutable MULTIPLIER = 1e6;
    uint256 public immutable rate = 1000; // 1000 div 1e6, means 0.1%

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public depositAmount;

    event Convert(uint256 tokenAmount, uint256 ethAmount);
    event Deposit(address user, uint256 amount);
    event Withdrawn(address user, uint256 ethAmount, uint256 tokenAmount);

    modifier onlyAggregator() {
        require(aggregator == msg.sender, "not aggregator");
        _;
    }

    modifier onlyPermit() {
        require(whitelist[msg.sender], "not permit");
        _;
    }

    constructor(
        address _token,
        address _aggregator,
        address _strategy,
        address _assetVault
    ) {
        STETH = _token;
        aggregator = _aggregator;
        strategy = _strategy;
        assetVault = _assetVault;
    }

    function deposit() external payable onlyPermit nonReentrant {
        require(msg.value > 0, "wrong amount");

        depositAmount[msg.sender] += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(
        uint256 _amount,
        bool _isEth
    ) external onlyPermit nonReentrant {
        require(_amount > 0, "wrong amount");
        require(_amount <= depositAmount[msg.sender], "exceed deposit amount");

        if (_isEth) {
            require(_amount <= address(this).balance, "exceed vault balance");

            depositAmount[msg.sender] -= _amount;

            TransferHelper.safeTransferETH(msg.sender, _amount);

            emit Withdrawn(msg.sender, _amount, 0);
        } else {
            uint256 tokenAmount = (_amount * rate) / MULTIPLIER + _amount;

            require(
                tokenAmount <= IERC20(STETH).balanceOf(address(this)),
                "exceed vault balance"
            );

            depositAmount[msg.sender] -= _amount;

            TransferHelper.safeTransfer(STETH, msg.sender, tokenAmount);

            emit Withdrawn(msg.sender, 0, tokenAmount);
        }
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

        uint256 discount = (dx * rate) / MULTIPLIER;

        return dx - discount;
    }

    function exchange(
        uint256 i,
        uint256 j,
        uint256 dx,
        uint256 min_dy
    ) external payable override onlyAggregator returns (uint256) {
        require(i == 1 && j == 0, "invalid op");
        require(dx > 0, "invalid amount");

        uint256 ethBalance = address(this).balance;
        uint256 maxTokenSwap = (ethBalance * rate) / MULTIPLIER + ethBalance;

        // 101 stETH == 100 ETH
        if (dx > maxTokenSwap) {
            TransferHelper.safeTransferFrom(
                STETH,
                msg.sender,
                address(this),
                dx
            );

            TransferHelper.safeTransfer(STETH, strategy, dx - maxTokenSwap);
            TransferHelper.safeTransferETH(assetVault, ethBalance);

            emit Convert(maxTokenSwap, ethBalance);
        } else {
            TransferHelper.safeTransferFrom(
                STETH,
                msg.sender,
                address(this),
                dx
            );

            uint256 ethNeed = (dx * MULTIPLIER) / (MULTIPLIER + rate);

            TransferHelper.safeTransferETH(assetVault, ethNeed);

            emit Convert(dx, ethNeed);
        }
    }

    function updateWhitelist(
        address[] memory _users,
        bool[] memory _flags
    ) external onlyOwner {
        require(_users.length == _flags.length, "invalid length");

        uint256 i;
        for (i; i < _users.length; i++) {
            whitelist[_users[i]] = _flags[i];
        }
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

    receive() external payable {}
}
