// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {Strategy} from "./Strategy.sol";
import {AssetsVault} from "../AssetsVault.sol";

contract StrategyController {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 internal constant ONE_HUNDRED_PERCENT = 1e6;

    address public stoneVault;
    address payable public assetsVault;

    EnumerableSet.AddressSet private strategies;

    mapping(address => uint256) public ratios;

    modifier onlyVault() {
        require(stoneVault == msg.sender, "not vault");
        _;
    }

    constructor(
        address payable _assetsVault,
        address[] memory _strategies,
        uint256[] memory _ratios
    ) {
        stoneVault = msg.sender;
        assetsVault = _assetsVault;

        _initStrategies(_strategies, _ratios);
    }

    function onlyRebaseStrategies() external {
        _rebase(0, 0);
    }

    function forceWithdraw(
        uint256 _amount
    ) external onlyVault returns (uint256 actualAmount) {
        actualAmount = _forceWithdraw(_amount);
    }

    function setStrategies(
        address[] memory _strategies,
        uint256[] memory _ratios
    ) external onlyVault {
        _setStrategies(_strategies, _ratios);
    }

    function addStrategy(address _strategy) external onlyVault {
        require(!strategies.contains(_strategy), "already exist");

        strategies.add(_strategy);
    }

    function rebaseStrategies(
        uint256 _in,
        uint256 _out
    ) external payable onlyVault {
        _rebase(_in, _out);
    }

    function destroyStrategy(address _strategy) external onlyVault {
        _destoryStrategy(_strategy);
    }

    function _rebase(uint256 _in, uint256 _out) internal {
        require(_in == 0 || _out == 0, "only deposit or withdraw");

        if (_in > 0) {
            AssetsVault(assetsVault).withdraw(address(this), _in);
        }
        uint256 total = getAllStrategyValidValue();
        if (total < _out) {
            total = 0;
        } else {
            total = total.add(_in).sub(_out);
        }

        for (uint i = 0; i < strategies.length(); i++) {
            address strategy = strategies.at(i);
            if (ratios[strategy] == 0) {
                _clearStrategy(strategy);
            }
            uint256 newPosition = total.mul(ratios[strategy]).div(
                ONE_HUNDRED_PERCENT
            );
            uint256 position = getStrategyValidValue(strategy);

            if (newPosition > position) {
                _depositToStrategy(strategy, newPosition.sub(position));
            }

            if (newPosition < position) {
                _withdrawFromStrategy(strategy, position.sub(newPosition));
            }
        }
    }

    function _depositToStrategy(address _strategy, uint256 _amount) internal {
        Strategy(_strategy).deposit{value: _amount}();
    }

    function _withdrawFromStrategy(
        address _strategy,
        uint256 _amount
    ) internal {
        Strategy(_strategy).withdraw(_amount);
    }

    function _forceWithdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        for (uint i = 0; i < strategies.length(); i++) {
            address strategy = strategies.at(i);

            uint256 withAmount = _amount.mul(ratios[strategy]).div(
                ONE_HUNDRED_PERCENT
            );

            if (withAmount > 0) {
                actualAmount = Strategy(strategy)
                    .instantWithdraw(withAmount)
                    .add(actualAmount);
            }
        }
    }

    function getStrategyValue(
        address _strategy
    ) public view returns (uint256 _value) {
        return Strategy(_strategy).getAllValue();
    }

    function getStrategyValidValue(
        address _strategy
    ) public view returns (uint256 _value) {
        return Strategy(_strategy).getInvestedValue();
    }

    function getAllStrategiesValue() public view returns (uint256 _value) {
        for (uint i = 0; i < strategies.length(); i++) {
            _value = _value.add(getStrategyValue(strategies.at(i)));
        }
    }

    function getAllStrategyValidValue() public view returns (uint256 _value) {
        for (uint i = 0; i < strategies.length(); i++) {
            _value = _value.add(getStrategyValidValue(strategies.at(i)));
        }
    }

    function getStrategies()
        public
        view
        returns (address[] memory addrs, uint256[] memory portions)
    {
        uint256 length = strategies.length();

        addrs = new address[](length);
        portions = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            address addr = strategies.at(i);
            addrs[i] = addr;
            portions[i] = ratios[addr];
        }
    }

    function _initStrategies(
        address[] memory _strategies,
        uint256[] memory _ratios
    ) internal {
        require(_strategies.length == _ratios.length, "invalid length");

        uint256 totalRatio;
        for (uint i = 0; i < _strategies.length; i++) {
            strategies.add(_strategies[i]);
            ratios[_strategies[i]] = _ratios[i];
            totalRatio = totalRatio.add(_ratios[i]);
        }
        require(totalRatio <= ONE_HUNDRED_PERCENT, "exceed 100%");
    }

    function _setStrategies(
        address[] memory _strategies,
        uint256[] memory _ratios
    ) internal {
        require(_strategies.length == _ratios.length, "invalid length");

        for (uint i = 0; i < strategies.length(); i++) {
            ratios[strategies.at(i)] = 0;
        }
        uint256 totalRatio;
        for (uint i = 0; i < _strategies.length; i++) {
            require(
                Strategy(_strategies[i]).controller() == address(this),
                "controller mismatch"
            );
            strategies.add(_strategies[i]);
            ratios[_strategies[i]] = _ratios[i];
            totalRatio = totalRatio.add(_ratios[i]);
        }
        require(totalRatio <= ONE_HUNDRED_PERCENT, "exceed 100%");
    }

    function _clearStrategy(address _strategy) internal {
        Strategy(_strategy).clear();
    }

    function _destoryStrategy(address _strategy) internal {
        require(_couldDestoryStrategy(_strategy), "still active");

        Strategy(_strategy).destroy();
        strategies.remove(_strategy);
    }

    function _couldDestoryStrategy(
        address _strategy
    ) internal view returns (bool status) {
        return ratios[_strategy] == 0 && Strategy(_strategy).getAllValue() == 0;
    }

    receive() external payable {}
}
