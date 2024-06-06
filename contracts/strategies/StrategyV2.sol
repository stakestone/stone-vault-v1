// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {StrategyController} from "../strategies/StrategyController.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

abstract contract StrategyV2 is Ownable2Step {
    address payable public immutable controller;

    uint256 public latestUpdateTime;
    uint256 public bufferTime;

    string public name;

    modifier notAtSameBlock() {
        require(
            latestUpdateTime + bufferTime <= block.timestamp,
            "at the same block"
        );
        latestUpdateTime = block.timestamp;
        _;
    }

    constructor(address payable _controller, string memory _name) {
        require(_controller != address(0), "ZERO ADDRESS");

        controller = _controller;
        name = _name;
    }

    modifier onlyController() {
        require(controller == msg.sender, "not controller");
        _;
    }

    function deposit() public payable virtual onlyController notAtSameBlock {}

    function withdraw(
        uint256 _amount
    )
        public
        virtual
        onlyController
        notAtSameBlock
        returns (uint256 actualAmount)
    {}

    function instantWithdraw(
        uint256 _amount
    )
        public
        virtual
        onlyController
        notAtSameBlock
        returns (uint256 actualAmount)
    {}

    function clear() public virtual onlyController returns (uint256 amount) {}

    function getAllValue() public virtual returns (uint256 value) {}

    function getPendingValue() public virtual returns (uint256 value) {}

    function getInvestedValue() public virtual returns (uint256 value) {}

    function setBufferTime(uint256 _time) external onlyOwner {
        bufferTime = _time;
    }
}
