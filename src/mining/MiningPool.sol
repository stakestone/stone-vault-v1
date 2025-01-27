// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMiningPoolTokenAdapter} from "../interfaces/IMiningPoolTokenAdapter.sol";

import {StoneNFT} from "./StoneNFT.sol";

contract MiningPool is ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private tokens;

    mapping(address => mapping(address => uint256)) public stakedAmount; // user=>token=>amount

    mapping(address => uint256) public stakeTime;
    mapping(address => uint256) public updateTime;
    mapping(address => uint256) public currentPendingPoints;

    mapping(address => NFTDetail[]) public pendingNFT;

    mapping(address => address) public tokenAdapters;

    uint256 public cycle;
    uint256 public totalPoints;
    uint256 public globalUpdateTime;

    uint256 public terminateTime;

    address public nft;
    address public governance;

    struct NFTDetail {
        uint256 points;
        uint256 startTime;
        uint256 endTime;
    }

    modifier onlyGovernance() {
        require(governance == msg.sender, "not governace");
        _;
    }

    event TransferGovernance(address oldAddr, address newAddr);
    event Terminated(uint256 time, uint256 points);

    constructor(uint256 _cycle) {
        governance = msg.sender;
        cycle = _cycle;

        globalUpdateTime = block.timestamp;
    }

    function stake(address _token, uint256 _amount) external {
        _stakeFor(msg.sender, _token, _amount);
    }

    function stakeFor(address _user, address _token, uint256 _amount) external {
        _stakeFor(_user, _token, _amount);
    }

    function _stakeFor(
        address _user,
        address _token,
        uint256 _amount
    ) internal nonReentrant {
        require(tokens.contains(_token), "unsupported token");

        updateReward(_user, false);

        TransferHelper.safeTransferFrom(_token, _user, address(this), _amount);

        stakedAmount[_user][_token] = stakedAmount[_user][_token] + _amount;
    }

    function unstake(address _token, uint256 _amount) external nonReentrant {
        require(_amount > 0, "unstake zero");
        require(stakedAmount[msg.sender][_token] >= _amount, "exceed balance");

        updateReward(msg.sender, false);

        stakedAmount[msg.sender][_token] =
            stakedAmount[msg.sender][_token] -
            _amount;

        TransferHelper.safeTransfer(_token, msg.sender, _amount);
    }

    function claim() external nonReentrant {
        require(nft != address(0), "invalid nft");

        updateReward(msg.sender, true);

        uint256 length = pendingNFT[msg.sender].length;

        require(length > 0, "no claimable");

        for (uint i; i < length; i++) {
            NFTDetail memory detail = pendingNFT[msg.sender][i];

            StoneNFT(nft).mint(
                msg.sender,
                detail.points,
                detail.startTime,
                detail.endTime
            );
        }

        delete pendingNFT[msg.sender];
    }

    function updateGlobal() internal {
        uint256 value = getAllValue();
        uint256 interval = block.timestamp - globalUpdateTime;

        if (value != 0 && interval != 0) {
            totalPoints += value * interval;
        }

        globalUpdateTime = block.timestamp;
    }

    function updateReward(address _user, bool _isClaim) internal {
        updateGlobal();

        uint256 current = block.timestamp;
        if (terminateTime != 0) {
            current = terminateTime;
        }

        if (stakeTime[_user] == 0 && !_isClaim) {
            stakeTime[_user] = current;
            updateTime[_user] = current;
            return;
        }

        uint256 previous = stakeTime[_user];
        uint256 acc = (current - previous) / cycle;
        uint256 remainder = (current - previous) % cycle;
        uint256 value = getAllPositionValue(_user);

        if (acc > 0) {
            stakeTime[_user] = current - remainder;

            for (uint256 i; i < acc; i++) {
                uint256 points;
                if (i == 0) {
                    points =
                        (previous + cycle - updateTime[_user]) *
                        value +
                        currentPendingPoints[_user];
                    currentPendingPoints[_user] = 0;
                } else {
                    points = cycle * value;
                }
                pendingNFT[_user].push(
                    NFTDetail(
                        points,
                        stakeTime[_user] - (i + 1) * cycle,
                        stakeTime[_user] - (i * cycle)
                    )
                );
            }
            if (current > stakeTime[_user]) {
                currentPendingPoints[_user] =
                    value *
                    (current - stakeTime[_user]);
            }
        } else {
            currentPendingPoints[_user] +=
                value *
                (current - updateTime[_user]);
        }

        updateTime[_user] = current;

        if (!checkPosition(_user)) {
            stakeTime[_user] = 0;
            updateTime[_user] = 0;

            totalPoints = totalPoints - currentPendingPoints[_user];
            currentPendingPoints[_user] = 0;
        }
    }

    function earned(address _user) public view returns (uint256 amount) {
        amount = pendingNFT[_user].length;

        uint256 previous = stakeTime[_user];

        if (previous != 0) {
            uint256 current = block.timestamp;
            if (terminateTime > 0) {
                current = terminateTime;
            }
            uint256 acc = (current - previous) / cycle;
            amount += acc;
        }
    }

    function getPendingNFTLength(
        address _user
    ) public view returns (uint256 amount) {
        amount = pendingNFT[_user].length;
    }

    function getAllValue() public view returns (uint256 value) {
        uint256 length = tokens.length();
        for (uint256 i; i < length; i++) {
            address token = tokens.at(i);
            uint256 amount = IERC20(token).balanceOf(address(this));
            if (amount > 0) {
                value += IMiningPoolTokenAdapter(tokenAdapters[token])
                    .getStoneValue(amount);
            }
        }
    }

    function getAllPositionValue(
        address _user
    ) public view returns (uint256 value) {
        uint256 length = tokens.length();
        for (uint256 i; i < length; i++) {
            address token = tokens.at(i);
            uint256 amount = stakedAmount[_user][token];
            if (amount > 0) {
                value += IMiningPoolTokenAdapter(tokenAdapters[token])
                    .getStoneValue(amount);
            }
        }
    }

    function getAllPoolTokens() public view returns (address[] memory list) {
        uint256 len = tokens.length();

        list = new address[](len);

        for (uint256 i; i < len; i++) {
            list[i] = tokens.at(i);
        }
    }

    function checkPosition(address _user) public view returns (bool) {
        for (uint256 i; i < tokens.length(); i++) {
            if (stakedAmount[_user][tokens.at(i)] > 0) {
                return true;
            }
        }
    }

    function setSupportedTokens(
        address[] memory _tokens,
        address[] memory _adapters,
        bool[] memory _flags
    ) external onlyGovernance {
        uint256 length = _tokens.length;
        require(
            _flags.length == length && _adapters.length == length,
            "invalid length"
        );

        for (uint256 i; i < length; i++) {
            address token = _tokens[i];
            if (_flags[i]) {
                tokens.add(token);
                tokenAdapters[token] = _adapters[i];
            } else {
                tokens.remove(token);
                tokenAdapters[token] = address(0);
            }
        }
    }

    function setNFT(address _nft) external onlyGovernance {
        require(nft == address(0), "already set");

        nft = _nft;
    }

    function terminate(address _nft) external onlyGovernance {
        terminateTime = block.timestamp;
        updateGlobal();

        emit Terminated(terminateTime, totalPoints);
    }

    function setNewGovernance(address _governance) external onlyGovernance {
        emit TransferGovernance(governance, _governance);

        governance = _governance;
    }
}
