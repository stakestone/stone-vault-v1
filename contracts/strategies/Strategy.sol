// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

abstract contract Strategy {
    using SafeMath for uint256;

    address payable public controller;

    modifier onlyController() {
        require(controller == msg.sender, "not controller");
        _;
    }

    function deposit() public payable virtual onlyController {}

    function withdraw(
        uint256 _amount
    ) public virtual onlyController returns (uint256 actualAmount) {}

    function instantWithdraw(
        uint256 _amount
    ) public virtual onlyController returns (uint256 actualAmount) {}

    function clear() public virtual onlyController returns (uint256 amount) {}

    function destroy() public virtual onlyController {}

    function execPendingRequest(
        uint256 _amount
    ) public virtual returns (uint256 amount) {}

    function getAllValue() public view virtual returns (uint256 value) {}

    function getPendingValue() public view virtual returns (uint256 value) {}

    function getInvestedValue() public view virtual returns (uint256 value) {}

    function checkPendingStatus()
        public
        view
        virtual
        returns (uint256 pending, uint256 executable)
    {}
}
