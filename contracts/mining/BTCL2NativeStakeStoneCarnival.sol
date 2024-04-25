// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

interface IVault {
    function deposit() external payable returns (uint256 mintAmount);
}

contract BTCL2NativeStakeStoneCarnival is Ownable2Step {
    uint256 public immutable lockPeriod = 60 days;
    uint256 public immutable startTime;
    uint256 public immutable minAllowed;

    address public vaultAddr;
    address public lpAddr;

    uint256 public totalBTCDeposited;
    uint256 public finalLpAmount;

    bool public depositPaused;
    bool public isExec;
    bool public terminated;

    mapping(address => uint256) public btcDeposited;
    mapping(address => bool) public isWithdrawn;

    event BTCDeposited(address user, uint256 amount);
    event LPWithdrawn(address user, uint256 amount, uint256 withAmount);
    event DepositMade(uint256 btcAmount, uint256 lpAmount);
    event BTCWithdrawn(uint256 amount);
    event DepositPause(uint256 totalStone);
    event Terminate(uint256 timestamp);
    event VaultSet(address vaultAddr, address lpAddr);

    constructor(uint256 _minAllowed) {
        startTime = block.timestamp;
        minAllowed = _minAllowed;
    }

    modifier DepositNotPaused() {
        require(!depositPaused, "deposit paused");
        _;
    }

    modifier DepositPaused() {
        require(depositPaused, "deposit not paused");
        _;
    }

    modifier OnlyTerminated() {
        require(terminated, "not terminated");
        _;
    }

    modifier NotTerminated() {
        require(!terminated, " terminated");
        _;
    }

    function deposit() external payable DepositNotPaused {
        require(msg.value > 0, "zero value");

        _depositStone(msg.sender, msg.value);
    }

    function depositFor(address _user) external payable DepositNotPaused {
        require(msg.value > 0, "zero value");

        _depositStone(_user, msg.value);
    }

    function _depositStone(address _user, uint256 _amount) internal {
        require(_amount + btcDeposited[_user] >= minAllowed, "not allowed");

        btcDeposited[_user] += _amount;
        totalBTCDeposited += _amount;

        emit BTCDeposited(_user, _amount);
    }

    function withdrawLP() external OnlyTerminated {
        require(isExec, "not exec");
        require(!isWithdrawn[msg.sender], "already withdrawn");

        uint256 deposited = btcDeposited[msg.sender];

        uint256 lpAmountWith = (deposited * finalLpAmount) / totalBTCDeposited;

        require(lpAmountWith != 0, "zero amount");

        isWithdrawn[msg.sender] = true;

        TransferHelper.safeTransfer(lpAddr, msg.sender, lpAmountWith);

        emit LPWithdrawn(msg.sender, btcDeposited[msg.sender], lpAmountWith);
    }

    function withdrawBTC() external OnlyTerminated {
        require(!isExec, "already exec");
        require(!isWithdrawn[msg.sender], "already withdrawn");

        uint256 deposited = btcDeposited[msg.sender];
        require(deposited != 0, "not deposit");

        isWithdrawn[msg.sender] = true;

        TransferHelper.safeTransferETH(msg.sender, deposited);

        emit BTCWithdrawn(deposited);
    }

    function terminate() external NotTerminated {
        require(block.timestamp >= startTime + lockPeriod, "cannot terminate");

        depositPaused = true;
        terminated = true;

        emit Terminate(block.timestamp);
    }

    function forceTerminate() external onlyOwner DepositPaused {
        depositPaused = true;
        terminated = true;

        emit Terminate(block.timestamp);
    }

    function pauseDeposit() external onlyOwner DepositNotPaused {
        depositPaused = true;

        emit DepositPause(totalBTCDeposited);
    }

    function setAddrs(address _vaultAddr, address _lpAddr) external onlyOwner {
        require(!isExec, "already exec");

        vaultAddr = _vaultAddr;
        lpAddr = _lpAddr;

        emit VaultSet(vaultAddr, lpAddr);
    }

    function makeDeposit()
        external
        onlyOwner
        DepositPaused
        NotTerminated
        returns (uint256 mintAmount)
    {
        require(!isExec, "already exec");
        require(
            vaultAddr != address(0) && lpAddr != address(0),
            "vault not set"
        );

        uint256 amount = address(this).balance;

        mintAmount = IVault(vaultAddr).deposit{value: amount}();
        finalLpAmount = mintAmount;

        isExec = true;

        emit DepositMade(amount, mintAmount);
    }
}
