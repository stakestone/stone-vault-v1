// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IFrxETHMinter} from "../interfaces/IFrxETHMinter.sol";
import {ISfrxETH} from "../interfaces/ISfrxETH.sol";

import {Strategy} from "./Strategy.sol";
import {SwappingAggregator} from "./SwappingAggregator.sol";

contract SFraxETHHoldingStrategy is Strategy {
    address public immutable FRXETH =
        0x5E8422345238F34275888049021821E8E08CAa1f;
    address public immutable FRXETH_MINTER =
        0xbAFA44EFE7901E04E39Dad13167D089C559c1138;
    address public immutable SFRXETH =
        0xac3E018457B222d93114458476f3E3416Abbe38F;
    address payable public immutable SWAPPING;

    bool public buyOnDex;
    bool public sellOnDex;

    constructor(
        address payable _controller,
        address payable _swap,
        string memory _name
    ) Strategy(_controller, _name) {
        require(_swap != address(0), "ZERO ADDRESS");

        SWAPPING = _swap;
    }

    function deposit() public payable override onlyController {
        uint256 amount = msg.value;
        require(amount != 0, "zero value");

        if (!buyOnDex) {
            IFrxETHMinter(FRXETH_MINTER).submitAndDeposit{value: amount}(
                address(this)
            );
        } else {
            SwappingAggregator(SWAPPING).swap{value: amount}(
                FRXETH,
                amount,
                false
            );

            uint256 balance = IERC20(FRXETH).balanceOf(address(this));

            TransferHelper.safeApprove(FRXETH, SFRXETH, balance);

            ISfrxETH(SFRXETH).deposit(balance, address(this));
        }
    }

    function withdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function instantWithdraw(
        uint256 _amount
    ) public override onlyController returns (uint256 actualAmount) {
        actualAmount = _withdraw(_amount);
    }

    function _withdraw(
        uint256 _amount
    ) internal returns (uint256 actualAmount) {
        require(_amount != 0, "zero value");

        ISfrxETH sfrxETH = ISfrxETH(SFRXETH);

        uint256 convertedShares = sfrxETH.convertToShares(_amount);
        uint256 balance = ISfrxETH(SFRXETH).balanceOf(address(this));

        uint256 shares = convertedShares < balance ? convertedShares : balance;
        uint256 assets = sfrxETH.redeem(shares, address(this), address(this));

        if (assets != 0) {
            TransferHelper.safeApprove(FRXETH, SWAPPING, assets);
            actualAmount = SwappingAggregator(SWAPPING).swap(
                FRXETH,
                assets,
                true
            );
        }
        TransferHelper.safeTransferETH(controller, address(this).balance);
    }

    function clear() public override onlyController returns (uint256 amount) {
        uint256 max = ISfrxETH(SFRXETH).maxRedeem(address(this));

        if (max != 0) {
            amount = _withdraw(max);
        }
    }

    function getAllValue() public override returns (uint256 value) {
        value = getInvestedValue() + getPendingValue();
    }

    function getInvestedValue() public override returns (uint256 value) {
        value = ISfrxETH(SFRXETH).maxRedeem(address(this));
    }

    function getPendingValue() public override returns (uint256 value) {
        return 0;
    }

    function checkPendingStatus()
        public
        view
        override
        returns (uint256 pending, uint256 executable)
    {
        return (0, 0);
    }

    function setRouter(
        bool _buyOnDex,
        bool _sellOnDex
    ) external onlyGovernance {
        buyOnDex = _buyOnDex;
        sellOnDex = _sellOnDex;
    }

    receive() external payable {}
}
