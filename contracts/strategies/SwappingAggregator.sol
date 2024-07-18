// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IQuoter} from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStableSwap} from "../interfaces/IStableSwap.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";

contract SwappingAggregator is ReentrancyGuard {
    uint256 internal constant MULTIPLIER = 1e18;
    uint256 internal constant ONE_HUNDRED_PERCENT = 1e6;

    address internal immutable QUOTER =
        0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;
    address internal immutable ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;

    address internal immutable WETH9;

    address internal immutable CURVE_ETH =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    mapping(address => address) public uniV3Pools; // token => pool
    mapping(address => address) public curvePools;
    mapping(address => uint8) public curvePoolType; // 0 - stableswap; 1 - two crypto swap
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
        uint8[] memory _curvePoolTypes,
        uint256[] memory _slippages,
        uint24[] memory _fees
    ) {
        uint256 length = _tokens.length;
        require(
            length == _uniPools.length &&
                length == _curvePools.length &&
                length == _curvePoolTypes.length,
            "invalid length"
        );

        require(_wETH != address(0), "ZERO ADDRESS");

        for (uint256 i; i < length; i++) {
            require(
                _tokens[i] != address(0) &&
                    _uniPools[i] != address(0) &&
                    _curvePools[i] != address(0),
                "ZERO ADDRESS"
            );

            uniV3Pools[_tokens[i]] = _uniPools[i];
            curvePools[_tokens[i]] = _curvePools[i];
            curvePoolType[_curvePools[i]] = _curvePoolTypes[i];
            slippage[_tokens[i]] = _slippages[i];
            fees[_tokens[i]] = _fees[i];
        }

        governance = msg.sender;

        WETH9 = _wETH;
    }

    function swap(
        address _token,
        uint256 _amount,
        bool _isSell
    ) external payable returns (uint256 amount) {
        if (
            uniV3Pools[_token] == address(0) && curvePools[_token] == address(0)
        ) {
            return 0;
        }

        (DEX_TYPE dex, uint256 expected) = getBestRouter(
            _token,
            _amount,
            _isSell
        );
        if (!_isSell) {
            require(
                _amount == msg.value && msg.value != 0 && expected != 0,
                "wrong value"
            );
        }
        if (dex == DEX_TYPE.UNISWAPV3) {
            amount = swapOnUniV3(_token, _amount, _isSell);
        } else {
            amount = swapOnCurve(_token, _amount, _isSell);
        }
    }

    function swapOnUniV3(
        address _token,
        uint256 _amount,
        bool _isSell
    ) internal nonReentrant returns (uint256 amount) {
        uint256 minReceived = calMinimumReceivedAmount(
            _amount,
            slippage[_token]
        );

        address pool = uniV3Pools[_token];
        if (_isSell) {
            TransferHelper.safeTransferFrom(
                _token,
                msg.sender,
                address(this),
                _amount
            );
            TransferHelper.safeApprove(_token, ROUTER, _amount);

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

            amount = ISwapRouter(ROUTER).exactInputSingle(params);

            IWETH9(WETH9).withdraw(amount);

            TransferHelper.safeTransferETH(msg.sender, address(this).balance);
        } else {
            IWETH9(WETH9).deposit{value: msg.value}();

            TransferHelper.safeApprove(
                WETH9,
                ROUTER,
                IWETH9(WETH9).balanceOf(address(this))
            );

            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: WETH9,
                    tokenOut: _token,
                    fee: fees[_token],
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: _amount,
                    amountOutMinimum: minReceived,
                    sqrtPriceLimitX96: 0
                });

            amount = ISwapRouter(ROUTER).exactInputSingle(params);

            TransferHelper.safeTransfer(
                _token,
                msg.sender,
                IERC20(_token).balanceOf(address(this))
            );
        }
    }

    function swapOnCurve(
        address _token,
        uint256 _amount,
        bool _isSell
    ) internal nonReentrant returns (uint256 amount) {
        uint256 minReceived = calMinimumReceivedAmount(
            _amount,
            slippage[_token]
        );

        address pool = curvePools[_token];
        (uint256 e, uint256 t, bool wrapped) = getCurveCoinIndex(_token);

        uint8 poolType = curvePoolType[pool];

        if (_isSell) {
            TransferHelper.safeTransferFrom(
                _token,
                msg.sender,
                address(this),
                _amount
            );
            TransferHelper.safeApprove(_token, pool, _amount);

            if (poolType == 0) {
                amount = IStableSwap(pool).exchange(
                    int128(int256(t)),
                    int128(int256(e)),
                    _amount,
                    minReceived
                );
            } else {
                amount = IStableSwap(pool).exchange(t, e, _amount, minReceived);
            }

            if (wrapped) {
                IWETH9 weth = IWETH9(WETH9);
                weth.withdraw(weth.balanceOf(address(this)));
            }

            TransferHelper.safeTransferETH(msg.sender, address(this).balance);
        } else {
            if (poolType == 0) {
                if (!wrapped) {
                    amount = IStableSwap(pool).exchange{value: _amount}(
                        int128(int256(e)),
                        int128(int256(t)),
                        _amount,
                        minReceived
                    );
                } else {
                    IWETH9 weth = IWETH9(WETH9);
                    weth.deposit{value: _amount}();
                    weth.approve(pool, _amount);

                    amount = IStableSwap(pool).exchange(
                        int128(int256(e)),
                        int128(int256(t)),
                        _amount,
                        minReceived
                    );
                }
            } else {
                if (!wrapped) {
                    amount = IStableSwap(pool).exchange{value: _amount}(
                        e,
                        t,
                        _amount,
                        minReceived
                    );
                } else {
                    IWETH9 weth = IWETH9(WETH9);
                    weth.deposit{value: _amount}();
                    weth.approve(pool, _amount);

                    amount = IStableSwap(pool).exchange(
                        e,
                        t,
                        _amount,
                        minReceived
                    );
                }
            }

            TransferHelper.safeTransfer(
                _token,
                msg.sender,
                IERC20(_token).balanceOf(address(this))
            );
        }
    }

    function getBestRouter(
        address _token,
        uint256 _amount,
        bool _isSell
    ) public returns (DEX_TYPE dex, uint256 out) {
        uint256 uniV3Out = getUniV3Out(_token, _amount, _isSell);
        uint256 curveOut = getCurveOut(_token, _amount, _isSell);

        return
            uniV3Out > curveOut
                ? (DEX_TYPE.UNISWAPV3, uniV3Out)
                : (DEX_TYPE.CURVE, curveOut);
    }

    function getUniV3Out(
        address _token,
        uint256 _amount,
        bool _isSell
    ) public returns (uint256 out) {
        if (uniV3Pools[_token] == address(0)) {
            return 0;
        }

        if (_isSell) {
            out = IQuoter(QUOTER).quoteExactInputSingle(
                _token,
                WETH9,
                fees[_token],
                _amount,
                0
            );
        } else {
            out = IQuoter(QUOTER).quoteExactInputSingle(
                WETH9,
                _token,
                fees[_token],
                _amount,
                0
            );
        }
    }

    function getCurveOut(
        address _token,
        uint256 _amount,
        bool _isSell
    ) public returns (uint256 out) {
        address poolAddr = curvePools[_token];

        if (poolAddr == address(0)) {
            return 0;
        }

        (uint256 e, uint256 t, ) = getCurveCoinIndex(_token);

        IStableSwap pool = IStableSwap(poolAddr);
        uint8 poolType = curvePoolType[poolAddr];
        if (_isSell) {
            if (poolType == 0) {
                out = pool.get_dy(
                    int128(int256(t)),
                    int128(int256(e)),
                    _amount
                );
            } else {
                out = pool.get_dy(t, e, _amount);
            }
        } else {
            if (poolType == 0) {
                out = pool.get_dy(
                    int128(int256(e)),
                    int128(int256(t)),
                    _amount
                );
            } else {
                out = pool.get_dy(e, t, _amount);
            }
        }
    }

    function getCurveCoinIndex(
        address _token
    ) public view returns (uint256 i, uint256 j, bool wrapped) {
        // i for Ether, j for another token
        IStableSwap pool = IStableSwap(curvePools[_token]);

        if (pool.coins(0) == WETH9 || pool.coins(1) == WETH9) {
            wrapped = true;
        }

        if (pool.coins(0) == CURVE_ETH || pool.coins(0) == WETH9) {
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

    function setUniRouter(
        address _token,
        address _uniPool,
        uint256 _slippage,
        uint24 _fee
    ) external onlyGovernance {
        require(_token != address(0), "ZERO ADDRESS");

        uniV3Pools[_token] = _uniPool;
        slippage[_token] = _slippage;
        fees[_token] = _fee;
    }

    function setCurveRouter(
        address _token,
        address _curvePool,
        uint8 _curvePoolType,
        uint256 _slippage
    ) external onlyGovernance {
        require(_token != address(0), "ZERO ADDRESS");

        curvePools[_token] = _curvePool;
        curvePoolType[_curvePool] = _curvePoolType;
        slippage[_token] = _slippage;
    }

    function setNewGovernance(address _governance) external onlyGovernance {
        emit TransferGovernance(governance, _governance);

        governance = _governance;
    }

    receive() external payable {}
}
