// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MiningPool is ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint256;

    EnumerableSet.AddressSet private tokens;

    mapping(address => mapping(address => uint256)) public stakedAmount; // user=>token=>amount

    mapping(address => uint256) public stakeTime;

    mapping(address => uint256) public earned;

    uint256 public cycle;

    address public governance;

    modifier onlyGovernance() {
        require(governance == msg.sender, "not governace");
        _;
    }

    event TransferGovernance(address oldAddr, address newAddr);

    constructor(uint256 _cycle) {
        governance = msg.sender;
        cycle = _cycle;
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

        TransferHelper.safeTransferFrom(_token, _user, address(this), _amount);

        stakedAmount[_user][_token] = stakedAmount[_user][_token].add(_amount);

        updateReward(_user, false);
    }

    function unstake(address _token, uint256 _amount) external nonReentrant {
        require(_amount > 0, "unstake zero");
        require(stakedAmount[msg.sender][_token] >= _amount, "exceed balance");

        stakedAmount[msg.sender][_token] = stakedAmount[msg.sender][_token].sub(
            _amount
        );

        TransferHelper.safeTransfer(_token, msg.sender, _amount);

        updateReward(msg.sender, false);
    }

    function claim() external {
        updateReward(msg.sender, true);

        earned[msg.sender] = 0;
    }

    function migrate(address _token, address _to) external {}

    function updateReward(address _user, bool _isClaim) internal {
        uint256 current = block.timestamp;
        uint256 previous = stakeTime[_user];

        if (stakeTime[_user] == 0 && !_isClaim) {
            stakeTime[_user] = current;
            return;
        }

        uint256 acc = (current - previous) / cycle;
        uint256 remainder = (current - previous) % cycle;

        if (acc > 0) {
            earned[_user] = earned[_user] + acc;
            stakeTime[_user] = current - remainder;
        }

        if (!checkPosition(_user)) {
            stakeTime[_user] = 0;
        }
    }

    function getAllPoolTokens() public view returns (address[] memory list) {
        uint256 len = tokens.length();

        list = new address[](len);

        for (uint256 i = 0; i < len; i++) {
            list[i] = tokens.at(i);
        }
    }

    function checkPosition(address _user) public view returns (bool) {
        for (uint256 i = 0; i < tokens.length(); i++) {
            if (stakedAmount[_user][tokens.at(i)] > 0) {
                return true;
            }
        }
    }

    function setSupportedTokens(
        address[] memory _tokens,
        bool[] memory _flags
    ) external onlyGovernance {
        require(_tokens.length == _flags.length, "invalid length");

        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_flags[i]) {
                tokens.add(_tokens[i]);
            } else {
                tokens.remove(_tokens[i]);
            }
        }
    }

    function setNewGovernance(address _governance) external onlyGovernance {
        emit TransferGovernance(governance, _governance);

        governance = _governance;
    }
}
