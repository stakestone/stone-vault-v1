// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IQuoter} from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStableSwap} from "../interfaces/IStableSwap.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";

contract SwappingAggregator {
    uint256 internal constant MULTIPLIER = 1e18;
    uint256 internal constant ONE_HUNDRED_PERCENT = 1e6;

    address internal immutable QUOTER =
        0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;

    address internal immutable WETH9;

    address internal immutable CURVE_ETH =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    mapping(address => address) public uniV3Pools; // token => pool
    mapping(address => address) public curvePools;
    mapping(address => uint256) public slippage;
    mapping(address => uint24) public fees;

    address public governance;

    event SetSlippage(
        address indexed token,
        uint256 oldSlippage,
        uint256 newSlippage
    );
    event TransferGovernance(address oldAddr, address newAddr);

    modifier onlyGovernance() {
        require(governance == msg.sender, "not governace");
        _;
    }

    enum DEX_TYPE {
        UNISWAPV3,
        CURVE
    }

    constructor(
        address _wETH,
        address[] memory _tokens,
        address[] memory _uniPools,
        address[] memory _curvePools,
        uint256[] memory _slippages,
        uint24[] memory _fees
    ) {
        uint256 length = _tokens.length;
        require(
            length == _uniPools.length && _tokens.length == _curvePools.length,
            "invalid length"
        );

        require(_wETH != address(0), "ZERO ADDRESS");

        for (uint256 i = 0; i < length; i++) {
            require(
                _tokens[i] != address(0) &&
                    _uniPools[i] != address(0) &&
                    _curvePools[i] != address(0),
                "ZERO ADDRESS"
            );

            uniV3Pools[_tokens[i]] = _uniPools[i];
            curvePools[_tokens[i]] = _curvePools[i];
            slippage[_tokens[i]] = _slippages[i];
            fees[_tokens[i]] = _fees[i];
        }

        governance = msg.sender;

        WETH9 = _wETH;
    }

    function swap(
        address _token,
        uint256 _amount
    ) external returns (uint256 amount) {
        (DEX_TYPE dex, ) = getBestRouter(_token, _amount);

        if (dex == DEX_TYPE.UNISWAPV3) {
            amount = swapOnUniV3(_token, _amount);
        }

        if (dex == DEX_TYPE.CURVE) {
            amount = swapOnCurve(_token, _amount);
        }

        if (address(this).balance > 0) {
            TransferHelper.safeTransferETH(msg.sender, address(this).balance);
        }
    }

    function swapOnUniV3(
        address _token,
        uint256 _amount
    ) public returns (uint256 amount) {
        uint256 minReceived = calMinimumReceivedAmount(
            _amount,
            slippage[_token]
        );

        address pool = uniV3Pools[_token];
        TransferHelper.safeTransferFrom(
            _token,
            msg.sender,
            address(this),
            _amount
        );
        TransferHelper.safeApprove(_token, pool, _amount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: _token,
                tokenOut: WETH9,
                fee: fees[_token],
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: _amount,
                amountOutMinimum: minReceived,
                sqrtPriceLimitX96: 0
            });

        amount = ISwapRouter(pool).exactInputSingle(params);

        IWETH9(WETH9).withdraw(amount);
    }

    function swapOnCurve(
        address _token,
        uint256 _amount
    ) public returns (uint256 amount) {
        uint256 minReceived = calMinimumReceivedAmount(
            _amount,
            slippage[_token]
        );

        address pool = curvePools[_token];
        TransferHelper.safeTransferFrom(
            _token,
            msg.sender,
            address(this),
            _amount
        );
        TransferHelper.safeApprove(_token, pool, _amount);

        (int128 e, int128 t) = getCurveCoinIndex(_token);

        amount = IStableSwap(pool).exchange(t, e, _amount, minReceived);
    }

    function getBestRouter(
        address _token,
        uint256 _amount
    ) public returns (DEX_TYPE dex, uint256 out) {
        uint256 uniV3Out = getUniV3Out(_token, _amount);
        uint256 curveOut = getCurveOut(_token, _amount);

        require(uniV3Out != 0 || curveOut != 0, "no liquidity");

        return
            uniV3Out > curveOut
                ? (DEX_TYPE.UNISWAPV3, uniV3Out)
                : (DEX_TYPE.CURVE, curveOut);
    }

    function getUniV3Out(
        address _token,
        uint256 _amount
    ) public returns (uint256 out) {
        if (uniV3Pools[_token] == address(0)) {
            return 0;
        }

        out = IQuoter(QUOTER).quoteExactInputSingle(
            _token,
            WETH9,
            fees[_token],
            _amount,
            0
        );
    }

    function getCurveOut(
        address _token,
        uint256 _amount
    ) public returns (uint256 out) {
        if (curvePools[_token] == address(0)) {
            return 0;
        }

        (int128 e, int128 t) = getCurveCoinIndex(_token);

        IStableSwap pool = IStableSwap(curvePools[_token]);
        out = pool.get_dy(t, e, _amount);
    }

    function getCurveCoinIndex(
        address _token
    ) public view returns (int128 i, int128 j) {
        // i for Ether, j for another token
        IStableSwap pool = IStableSwap(curvePools[_token]);

        if (pool.coins(0) == CURVE_ETH) {
            i = 0;
            j = 1;
        } else {
            i = 1;
            j = 0;
        }
    }

    function calMinimumReceivedAmount(
        uint256 _amount,
        uint256 _slippage
    ) internal view returns (uint256 amount) {
        amount = (_amount * _slippage) / ONE_HUNDRED_PERCENT;
    }

    function setSlippage(
        address _token,
        uint256 _slippage
    ) external onlyGovernance {
        emit SetSlippage(_token, slippage[_token], _slippage);

        slippage[_token] = _slippage;
    }

    function setNewGovernance(address _governance) external onlyGovernance {
        emit TransferGovernance(governance, _governance);

        governance = _governance;
    }

    receive() external payable {}
}
