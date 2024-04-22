// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../interfaces/IDelegationManager.sol";

contract MockDelegationManager is IDelegationManager {
    
    address public lastOperator;
    SignatureWithExpiry public lastApproverSignatureAndExpiry;
    bytes32 public lastApproverSalt;
    bool public _isDelegateToCalled;
    bytes32[] private _undelegateResult;
    address private _lastStaker;
    bool private _isUndelegateCalled;

    function delegateTo(
        address operator,
        SignatureWithExpiry memory approverSignatureAndExpiry,
        bytes32 approverSalt
    ) external override {
       
        lastOperator = operator;
        lastApproverSignatureAndExpiry = approverSignatureAndExpiry;
        lastApproverSalt = approverSalt;
        
        // 设置调用标志为 true
        _isDelegateToCalled = true;
    }

    function isDelegateToCalled() external view returns (bool) {
        return _isDelegateToCalled;
    }

    function undelegate(
        address staker
    ) external override returns (bytes32[] memory withdrawalRoots) {
        _lastStaker = staker;
        _isUndelegateCalled = true;
        return _undelegateResult;
    }
    function setUndelegateResult(bytes32[] memory roots) external {
        _undelegateResult = roots;
    }
    function isUndelegateCalled() external view returns (bool) {
        return _isUndelegateCalled;
    }
    function queueWithdrawals(
        QueuedWithdrawalParams[] calldata queuedWithdrawalParams
    ) external returns (bytes32[] memory) {
        return new bytes32[](0);
    }

    function completeQueuedWithdrawal(
        Withdrawal calldata withdrawal,
        IERC20[] calldata tokens,
        uint256 middlewareTimesIndex,
        bool receiveAsTokens
    ) external {}

    function isOperator(address operator) external view returns (bool) {
        return true;
    }
}
