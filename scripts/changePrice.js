
//truffle exec scripts/changePrice.js --network test
const BigNumber = require('bignumber.js');
const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");

const MockToken = artifacts.require("MockToken");
const SwappingAggregator = artifacts.require("SwappingAggregator");
const IStableSwapPool = artifacts.require("IStableSwapPool");
const ISwapRouter = artifacts.require("ISwapRouter");
const IWETH9 = artifacts.require("IWETH9");
module.exports = async function (callback) {
    try {
        const operator = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"; //收账
        const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
        const wETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        //curve没有router，是pool地址；只要买到价格合适，再去存或者取，结算后用trans hash到event.js里查看日志里是否存在uni router / curve pool。注意大小写。
        const UNI_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const stETHUniPool = "0x8f8eaaF88448ba31BdffF6aD8c42830c032C6392";
        const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
        const stETHSlippage = 500000;
        const stETHFee = 10000;

        const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        const rETHUniPool = "0xa4e0faA58465A2D369aa21B3e42d43374c6F9613";
        const rETHCurvePool = "0x0f3159811670c117c372428d4e69ac32325e4d0f";
        const rETHSlippage = 500000;
        const rETHFee = 500;

        const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
        const frxETHUniPool = "0x8a15b2Dc9c4f295DCEbB0E7887DD25980088fDCB";
        const frxETHCurvePool = "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577";
        const frxETHSlippage = 500000;
        const frxETHFee = 500;
        const sfraxETHAddr = "0xac3E018457B222d93114458476f3E3416Abbe38F";

        const rETHBalAuraAddr = "0xDd1fE5AD401D4777cE89959b7fa587e569Bf125D";
        const rETHBalancerAuraStrategy = "0xf60b394638Ecbc2020Ac3E296E04Fd955A3eB460";//deposit rETH+wETH

        const swappingAggregatorAddr = "0x9bB2a4B892A1c3C7E111050916B122646E9F2533";
        const swappingAggregator = await SwappingAggregator.at(swappingAggregatorAddr);
        // 每个交易的token都需要approve
        let token = await MockToken.at(stETHAddr);
        let rtoken = await MockToken.at(rETHAddr);
        let fxtoken = await MockToken.at(frxETHAddr);
        let sftoken = await MockToken.at(sfraxETHAddr);
        let rbatoken = await MockToken.at(rETHBalAuraAddr);
        // await token.approve(UNI_ROUTER, MAX_UINT256);
        // await rtoken.approve(UNI_ROUTER, MAX_UINT256);
        // await fxtoken.approve(UNI_ROUTER, MAX_UINT256);
        // await rbatoken.approve(UNI_ROUTER, MAX_UINT256);

        const wETH = await IWETH9.at(wETHAddr);
        // await wETH.approve(UNI_ROUTER, MAX_UINT256);

        // console.log("weth is : ", wETH);

        // await wETH.deposit({ value: BigNumber(10e18) });
        // console.log("Buy token on Uni.... ");
        // let wETHBalance = BigNumber(await wETH.balanceOf(deployer));
        // console.log("wETHBalance of deployer is :.... ", wETHBalance.toString(10));
        // const router = await ISwapRouter.at(UNI_ROUTER);
        // // Buy token on Uni
        // await wETH.approve(router.address, BigNumber(100000).times(1e18), {
        //     from: deployer
        // });
        // await router.exactInputSingle({
        //     tokenIn: wETHAddr,
        //     tokenOut: rETHAddr, // stETHAddr,frxETHAddr
        //     fee: rETHFee, // rETHFee,stETHFee,frxETHFee
        //     recipient: operator,
        //     deadline: parseInt(Date.now() / 1000 + 100),
        //     amountIn: BigNumber(10e18).toString(10), // Buy amount
        //     amountOutMinimum: 0,
        //     sqrtPriceLimitX96: 0
        // }
        // );
        // // console.log("complete buy on uni");
        // let rETHBalance = BigNumber(await rtoken.balanceOf(deployer));
        // console.log("rETHBalance of deployer after buy is :.... ", rETHBalance.toString(10));
        // let sfETHBalance = BigNumber(await sftoken.balanceOf(deployer));
        // console.log("sfETHBalance of deployer after buy is :.... ", sfETHBalance.toString(10));
        // const taker1 = "0xcd3B766CCDd6AE721141F452C550Ca635964ce71";

        // await token.approve(router.address, BigNumber(100000).times(1e18), {
        //     from: deployer
        // });
        // await rtoken.approve(router.address, BigNumber(100000).times(1e18), {
        //     from: deployer
        // });
        // console.log("approve!");
        // // Sell token on Uni
        // await router.exactInputSingle({
        //     tokenIn: rETHAddr, // stETHAddr,frxETHAddr
        //     tokenOut: wETHAddr,
        //     fee: rETHFee, // rETHFee,stETHFee,frxETHFee
        //     recipient: operator,
        //     deadline: parseInt(Date.now() / 1000 + 100),
        //     amountIn: BigNumber(73e17).toString(10), // Sell amount
        //     amountOutMinimum: 0,
        //     sqrtPriceLimitX96: 0
        // }
        // );

        // console.log("complete sell on uni");
        // stETHBalance = BigNumber(await token.balanceOf(deployer));
        // console.log("stETHBalance of deployer after sell is :.... ", stETHBalance.toString(10));
        // // wETHBalance = BigNumber(await wETH.balanceOf(deployer));
        // console.log("wETHBalance after sell is :.... ", wETHBalance.toString(10));

        // 交易不同的交易对需要更换curve pool地址，也都需要重新approve
        // await token.approve(stETHCurvePool, MAX_UINT256, {
        //     from: taker1
        // });
        // await rtoken.approve(rETHCurvePool, MAX_UINT256, {
        //     from: deployer
        // });
        // await fxtoken.approve(frxETHCurvePool, MAX_UINT256, {
        //     from: deployer
        // });
        // Buy token on Curve
        // const curvePool = await IStableSwapPool.at(stETHCurvePool);
        // const r_curvePool = await IStableSwapPool.at(rETHCurvePool);
        // const fx_curvePool = await IStableSwapPool.at(frxETHCurvePool);
        // console.log("buy/sell token on curve... ")
        // stETH池子：买：0，1，卖1,0
        // frxETH:买：1，0，卖0,1
        // rETH：买：0，1，卖1,0
        // 卖的话，value就不用传值了。。。你传了的话就直接转给合约了。。。
        // await curvePool.exchange(0, 1, BigNumber(1e18).toString(10), 0, {
        //     value: BigNumber(1e18).toString(10),
        //     from: deployer
        // });
        // await r_curvePool.exchange(0, 1, BigNumber(1800e18).toString(10), 0, {
        //     value: BigNumber(1800e18).toString(10),
        //     from: deployer
        // });
        // await fx_curvePool.exchange(1, 0, BigNumber(1e18).toString(10), 0, {
        //     value: BigNumber(1e18).toString(10),
        //     from: deployer
        // });
        // await sf_curvePool.exchange(1, 0, BigNumber(1e18).toString(10), 0, {
        //     from: taker1
        // });

        // sfETHBalance = BigNumber(await sftoken.balanceOf(deployer));
        // console.log("sfETHBalance of deployer after buy is :.... ", sfETHBalance.toString(10));
        // rETHBalance = BigNumber(await rtoken.balanceOf(deployer));
        // console.log("rETHBalance of deployer after buy is :.... ", rETHBalance.toString(10));
        //比较价格
        const number = BigNumber(1e18);

        getUniV3Out = await swappingAggregator.getUniV3Out.call(stETHAddr, number, true);
        console.log("getUniV3Out sell price is : ", BigNumber(getUniV3Out).div(1e18).toString(10));
        getUniV3Out = await swappingAggregator.getUniV3Out.call(stETHAddr, number, false);
        console.log("getUniV3Out buy price is : ", number.div(BigNumber(getUniV3Out)).toString(10));

        getCurveOut = await swappingAggregator.getCurveOut.call(stETHAddr, number, true);
        console.log("getCurveOut sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(stETHAddr, number, false);
        console.log("getCurveOut buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));
        getUniV3Out = await swappingAggregator.getUniV3Out.call(rETHAddr, number, true);
        console.log("getUniV3Out rETHAddr sell price is : ", BigNumber(getUniV3Out).div(1e18).toString(10));
        getUniV3Out = await swappingAggregator.getUniV3Out.call(rETHAddr, number, false);
        console.log("getUniV3Out rETHAddr buy price is : ", number.div(BigNumber(getUniV3Out)).toString(10));

        getCurveOut = await swappingAggregator.getCurveOut.call(rETHAddr, number, true);
        console.log("getCurveOut rETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(rETHAddr, number, false);
        console.log("getCurveOut rETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));

        //it's frx price, now we should multiply frxETH per sfrxETH = 1.058133 frxETH
        getUniV3Out = await swappingAggregator.getUniV3Out.call(frxETHAddr, number, true);
        console.log("getUniV3Out frxETHAddr sell price is : ", BigNumber(getUniV3Out).div(1e18).toString(10));
        getUniV3Out = await swappingAggregator.getUniV3Out.call(frxETHAddr, number, false);
        console.log("getUniV3Out frxETHAddr buy price is : ", number.div(BigNumber(getUniV3Out)).toString(10));

        getCurveOut = await swappingAggregator.getCurveOut.call(frxETHAddr, number, true);
        console.log("getCurveOut frxETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(frxETHAddr, number, false);
        console.log("getCurveOut frxETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));


        const stETHHoldingStrategyAddr = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
        const rETHHoldingStrategyAddr = "0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef";
        const sFraxETHHoldingStrategyAddr = "0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853";

        let stETHBalance = BigNumber(await token.balanceOf(stETHHoldingStrategyAddr));
        console.log("stETHBalance of strategy is :.... ", stETHBalance.toString(10));
        rETHBalance = BigNumber(await rtoken.balanceOf(rETHHoldingStrategyAddr));
        console.log("rETHBalance of strategy is :.... ", rETHBalance.toString(10));
        sfETHBalance = BigNumber(await sftoken.balanceOf(sFraxETHHoldingStrategyAddr));
        console.log("sfETHBalance of strategy is :.... ", sfETHBalance.toString(10));
        let rETHAuraBalance = BigNumber(await rbatoken.balanceOf(rETHBalancerAuraStrategy));
        console.log("rETHAuraBalance of strategy is :.... ", rETHAuraBalance.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}