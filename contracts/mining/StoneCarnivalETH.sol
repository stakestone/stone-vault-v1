// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IStoneVault} from "../interfaces/IStoneVault.sol";

import {StoneCarnival} from "./StoneCarnival.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract StoneCarnivalETH is Ownable2Step, ReentrancyGuard {
    address public immutable stoneAddr;
    address public immutable stoneVaultAddr;
    address public immutable stoneCarvivalAddr;
    uint256 public immutable minEtherAllowed;

    uint256 public round;

    mapping(address => mapping(uint256 => uint256)) public etherDeposited;
    mapping(address => mapping(uint256 => bool)) public cStoneClaimedByRound;
    mapping(uint256 => uint256) public etherDepositedByRound;
    mapping(uint256 => uint256) public cStoneReceivedByRound;

    event EtherDeposited(address _user, uint256 _amount, uint256 round);
    event CStoneClaimed(address _user, uint256 _amount);
    event DepositMade(
        uint256 _ethAmount,
        uint256 _stoneAmount,
        uint256 _cStoneAmount,
        uint256 _round
    );

    constructor(
        address _stoneAddr,
        address _stoneVaultAddr,
        address _stoneCarvivalAddr,
        uint256 _minEtherAllowed
    ) {
        stoneAddr = _stoneAddr;

        stoneVaultAddr = _stoneVaultAddr;
        stoneCarvivalAddr = _stoneCarvivalAddr;
        minEtherAllowed = _minEtherAllowed;
    }

    function depositETH() external payable {
        _depositETH(msg.sender, msg.value);
    }

    function _depositETH(address _user, uint256 _amount) internal nonReentrant {
        require(_amount >= minEtherAllowed, "not allowed");

        etherDeposited[_user][round] += _amount;

        emit EtherDeposited(_user, _amount, round);
    }

    function claimCStoneByRound(
        uint256[] memory rounds
    ) public returns (uint256 claimed) {
        uint256 i;
        uint256 len = rounds.length;

        for (i; i < len; i++) {
            uint256 r = rounds[i];
            require(r < round, "invalid round");

            if (!cStoneClaimedByRound[msg.sender][r]) {
                uint256 cStoneAmount = (etherDeposited[msg.sender][r] *
                    cStoneReceivedByRound[r]) / etherDepositedByRound[r];
                claimed += cStoneAmount;

                cStoneClaimedByRound[msg.sender][r] = true;
            }
        }

        TransferHelper.safeTransfer(stoneCarvivalAddr, msg.sender, claimed);

        emit CStoneClaimed(msg.sender, claimed);
    }

    function makeDeposit() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance != 0, "no balance");

        uint256 stoneReceived = IStoneVault(payable(stoneVaultAddr)).deposit{
            value: balance
        }();

        TransferHelper.safeApprove(stoneAddr, stoneCarvivalAddr, stoneReceived);

        uint256 cStoneReceived = StoneCarnival(payable(stoneCarvivalAddr))
            .depositStone(stoneReceived);

        etherDepositedByRound[round] = balance;
        cStoneReceivedByRound[round] = stoneReceived;

        emit DepositMade(balance, stoneReceived, cStoneReceived, round);

        round++;
    }

    function makeDepositAndRoll() public onlyOwner {
        makeDeposit();
        IStoneVault(payable(stoneVaultAddr)).rollToNextRound();
    }
}
