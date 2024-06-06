// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StrategyV2} from "../strategies/StrategyV2.sol";
import {StrategyController} from "../strategies/StrategyController.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";
import {IAquaLpToken} from "../interfaces/IAquaLpToken.sol";

contract NativeLendingETHStrategy is StrategyV2 {
    address public immutable LPTOKEN;
    IWETH9 public immutable WETH;

    event Invoked(address indexed targetAddress, uint256 value, bytes data);

    constructor(
        address payable _controller,
        string memory _name,
        address _lptoken,
        address _weth
    ) StrategyV2(_controller, _name) {
        require(_lptoken != address(0) && _weth != address(0), "ZERO ADDRESS");
        WETH = IWETH9(_weth);
        LPTOKEN = _lptoken;
    }

    // owner functions

    function depositIntoNative(
        uint256 _amount
    ) external onlyOwner returns (uint256 mintAmount) {
        uint256 beforeLPBalance = IAquaLpToken(LPTOKEN).balanceOf(
            address(this)
        );

        WETH.deposit{value: _amount}();
        WETH.approve(LPTOKEN, _amount);
        IAquaLpToken(LPTOKEN).mint(_amount);

        mintAmount =
            IAquaLpToken(LPTOKEN).balanceOf(address(this)) -
            beforeLPBalance;
    }

    function withdrawFromNativeByAmount(
        uint256 _amount
    ) external onlyOwner returns (uint256 withdrawAmount) {
        uint256 beforeBalance = address(this).balance;

        IAquaLpToken(LPTOKEN).redeemUnderlying(_amount);

        WETH.withdraw(_amount);

        withdrawAmount = address(this).balance - beforeBalance;
    }

    function withdrawFromNativeByShare(
        uint256 _share
    ) external onlyOwner returns (uint256 withdrawAmount) {
        uint256 beforeBalance = address(this).balance;

        IAquaLpToken(LPTOKEN).redeem(_share);

        WETH.withdraw(withdrawAmount);

        withdrawAmount = address(this).balance - beforeBalance;
    }

    // public functions

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        value =
            (IERC20(LPTOKEN).balanceOf(address(this)) *
                IAquaLpToken(LPTOKEN).exchangeRateCurrent()) /
            1e18 +
            address(this).balance;
    }

    receive() external payable {}

    // controller functions

    function deposit() public payable override onlyController notAtSameBlock {
        require(msg.value != 0, "zero value");

        latestUpdateTime = block.timestamp;
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

    function clear() public override onlyController returns (uint256 amount) {
        uint256 balance = address(this).balance;

        if (balance != 0) {
            TransferHelper.safeTransferETH(controller, balance);
            amount = balance;
        }
    }

    // internal function

    function _withdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        actualAmount = _amount;

        TransferHelper.safeTransferETH(controller, actualAmount);

        latestUpdateTime = block.timestamp;
    }
}
