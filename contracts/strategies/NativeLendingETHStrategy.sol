// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Strategy} from "../strategies/Strategy.sol";
import {StrategyController} from "../strategies/StrategyController.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";
import {IAquaLpToken} from "../interfaces/IAquaLpToken.sol";

contract NativeLendingETHStrategy is Strategy {

    address public immutable LPTOKEN;
    IWETH9 private constant WETH = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    event Invoked(address indexed targetAddress, uint256 value, bytes data);

    constructor(
        address payable _controller,
        string memory _name,
        address _lptoken
    ) Strategy(_controller, _name) {
        require(
            _lptoken != address(0),
            "ZERO ADDRESS"
        );
        LPTOKEN = _lptoken;
    }

    function deposit() public payable override onlyController notAtSameBlock {
        latestUpdateTime = block.timestamp;

        uint256 amount = msg.value;
        require(amount != 0, "zero value");

        WETH.deposit{value: amount}();
        WETH.approve(LPTOKEN, amount);

        IAquaLpToken(LPTOKEN).mint(amount);
    }

    function withdraw(
        uint256 _amount
    )
        public
        override
        onlyController
        notAtSameBlock
        returns (uint256 actualAmount)
    {
        actualAmount = _withdraw(_amount);
    }

    function instantWithdraw(
        uint256 _amount
    )
        public
        override
        onlyController
        notAtSameBlock
        returns (uint256 actualAmount)
    {
        actualAmount = _withdraw(_amount);
    }

    function _withdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        latestUpdateTime = block.timestamp;
        actualAmount = _amount;

        IAquaLpToken(LPTOKEN).redeemUnderlying(_amount);
        TransferHelper.safeTransferETH(controller, actualAmount);

    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 balance = IERC20(LPTOKEN).balanceOf(address(this));

        if (balance != 0) {
            IAquaLpToken(LPTOKEN).redeem(balance);
            TransferHelper.safeTransferETH(controller, address(this).balance);
        }
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        value = 
            IERC20(LPTOKEN).balanceOf(address(this)) *
            IAquaLpToken(LPTOKEN).exchangeRateCurrent()
            / 1e18
            + address(this).balance;
    }

    function invoke(
        address target,
        bytes memory data
    ) external payable onlyGovernance returns (bytes memory result) {
        bool success;
        (success, result) = target.call{value: msg.value}(data);
        if (!success) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        emit Invoked(target, msg.value, data);
    }

    receive() external payable {}
}
