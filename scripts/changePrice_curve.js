
//truffle exec scripts/changePrice.js --network test
const BigNumber = require('bignumber.js');
const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const taker1 = "";
const taker2 = "";

const MockToken = artifacts.require("MockToken");
const SwappingAggregator = artifacts.require("SwappingAggregator");
const IStableSwapPool = artifacts.require("IStableSwapPool");

const ISwapRouter = artifacts.require("ISwapRouter");
const IWETH9 = artifacts.require("IWETH9");
const number = BigNumber(1e18);
//要交易的token的pool设置成0地址，想只从curve交易就把uni的设置成0地址，想只从uni交易就用setCurveRouter把curvePool设置成0地址
module.exports = async function (callback) {
    try {
        const operator = "0x2861b95C3844b41BE0e50bDcbd9ebD12CBAfdd78"; //收账
        const deployer = "0x2861b95C3844b41BE0e50bDcbd9ebD12CBAfdd78";
        const wETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        //curve没有router，是pool地址；只要买到价格合适，再去存或者取，结算后用trans hash到event.js里查看日志里是否存在uni router / curve pool。注意大小写。
        //rETHBalancerAuraStrategy， ETH->rETH-wstETH Balancer LP -> rETH-wstETH Aura LP
        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
        const stETHSlippage = 500000;
        const stETHFee = 10000;

        const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        const rETHCurvePool = "0x0f3159811670c117c372428d4e69ac32325e4d0f";
        const rETHSlippage = 500000;
        const rETHFee = 500;

        const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
        const frxETHCurvePool = "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577";
        const frxETHSlippage = 500000;
        const frxETHFee = 500;
        const sfraxETHAddr = "0xac3E018457B222d93114458476f3E3416Abbe38F";

        const rETHBalAuraAddr = "0xDd1fE5AD401D4777cE89959b7fa587e569Bf125D";
        // const rETHBalancerAuraStrategy = "0xf60b394638Ecbc2020Ac3E296E04Fd955A3eB460";//deposit rETH+wETH
        // console.log("start....");
        // await web3.eth.sendTransaction({ from: taker1, to: deployer, value: "90000000000000000000" });
        // console.log("start....");

        // await web3.eth.sendTransaction({ from: taker2, to: deployer, value: "900000000000000000000" });
        // console.log("start....");

        // await web3.eth.sendTransaction({ from: taker3, to: deployer, value: "900000000000000000000" });
        // console.log("start....");

        // await web3.eth.sendTransaction({ from: taker4, to: deployer, value: "300000000000000000000" });
        // console.log("deposit more....");

        const swappingAggregatorAddr = "0x3F6946b3e7db3bdF4b8d3bA3e78B677DF3Bae64B";
        const swappingAggregator = await SwappingAggregator.at(swappingAggregatorAddr);

        // 每个交易的token都需要approve
        let token = await MockToken.at(stETHAddr);
        let rtoken = await MockToken.at(rETHAddr);
        let fxtoken = await MockToken.at(frxETHAddr);
        let sftoken = await MockToken.at(sfraxETHAddr);
        let rbatoken = await MockToken.at(rETHBalAuraAddr);

        const wETH = await IWETH9.at(wETHAddr);

        console.log("weth is : ", wETH);
        // await wETH.deposit({ value: BigNumber(1000e18) });
        let wETHBalance = BigNumber(await wETH.balanceOf(deployer));
        console.log("wETHBalance of deployer is :.... ", wETHBalance.toString(10));
        let ethBalance = await web3.eth.getBalance(deployer);
        console.log("ethBalance of deployer is :.... ", ethBalance.toString(10));

        let stETHBalance = BigNumber(await token.balanceOf(deployer));
        console.log("stETHBalance of deployer is :.... ", stETHBalance.toString(10));
        //比较价格

        let getCurveOut = await swappingAggregator.getCurveOut.call(stETHAddr, number, true);
        console.log("getCurveOut stETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(stETHAddr, number, false);
        console.log("getCurveOut stETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));

        getCurveOut = await swappingAggregator.getCurveOut.call(rETHAddr, number, true);
        console.log("getCurveOut rETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(rETHAddr, number, false);
        console.log("getCurveOut rETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));

        getCurveOut = await swappingAggregator.getCurveOut.call(frxETHAddr, number, true);
        console.log("getCurveOut frxETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(frxETHAddr, number, false);
        console.log("getCurveOut frxETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));

        stETHBalance = BigNumber(await token.balanceOf(deployer));
        console.log("stETHBalance of deployer before sell is :.... ", stETHBalance.toString(10));
        // wETHBalance = BigNumber(await wETH.balanceOf(deployer));
        // console.log("wETHBalance after sell is :.... ", wETHBalance.toString(10));

        // 交易不同的交易对需要更换curve pool地址，也都需要重新approve
        await token.approve(stETHCurvePool, MAX_UINT256, {
            from: deployer
        });
        await rtoken.approve(rETHCurvePool, MAX_UINT256, {
            from: deployer
        });
        await fxtoken.approve(frxETHCurvePool, MAX_UINT256, {
            from: deployer
        });
        // Buy token on Curve
        const curvePool = await IStableSwapPool.at(stETHCurvePool);
        const r_curvePool = await IStableSwapPool.at(rETHCurvePool);
        const fx_curvePool = await IStableSwapPool.at(frxETHCurvePool);
        console.log("buy/sell token on curve... ")
        // stETH池子：买：0，1，卖1,0
        // frxETH:买：1，0，卖0,1
        // rETH：买：0，1，卖1,0
        // 卖的话，value就不用传值了。。。你传了的话就直接转给合约了。。。
        await wETH.approve(curvePool.address, BigNumber(100000).times(1e18), {
            from: deployer
        });
        await token.approve(curvePool.address, MAX_UINT256, {
            from: deployer
        });
        console.log("stToken approve....")

        await wETH.approve(r_curvePool.address, BigNumber(100000).times(1e18), {
            from: deployer
        });
        await wETH.approve(fx_curvePool.address, BigNumber(100000).times(1e18), {
            from: deployer
        });
        // console.log("before buy stETH....")

        await curvePool.exchange(0, 1, BigNumber(10000e18).toString(10), 0, {
            value: BigNumber(10000e18).toString(10),  //用以太买才需要有这个参数，value永远代表的这笔交易要用多少以太坊
            from: deployer
        });
        // console.log("after buy stETH....")
        // console.log("before sell stETH....")

        // await curvePool.exchange(1, 0, BigNumber(300e18).toString(10), 0, {
        //     from: deployer
        // });
        // console.log("after sell stETH....")
        // await r_curvePool.exchange(0, 1, BigNumber(1e18).toString(10), 0, {
        //     value: BigNumber(1e18).toString(10),
        //     from: deployer
        // });
        // console.log("rtToken....")
        // await fx_curvePool.exchange(1, 0, BigNumber(1e18).toString(10), 0, {
        //     value: BigNumber(1e18).toString(10),
        //     from: deployer
        // });
        // console.log("fxToken....")

        stETHBalance = BigNumber(await token.balanceOf(deployer));
        console.log("stETHBalance of deployer after buy is :.... ", stETHBalance.toString(10));
        // sfETHBalance = BigNumber(await sftoken.balanceOf(deployer));
        // console.log("sfETHBalance of deployer after buy is :.... ", sfETHBalance.toString(10));
        // // 比较价格

        getCurveOut = await swappingAggregator.getCurveOut.call(stETHAddr, number, true);
        console.log("getCurveOut stETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        getCurveOut = await swappingAggregator.getCurveOut.call(stETHAddr, number, false);
        console.log("getCurveOut stETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));
        // //it's frx price, now we should multiply frxETH per sfrxETH = 1.058133 frxETH

        // getCurveOut = await swappingAggregator.getCurveOut.call(frxETHAddr, number, true);
        // console.log("getCurveOut frxETHAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        // getCurveOut = await swappingAggregator.getCurveOut.call(frxETHAddr, number, false);
        // console.log("getCurveOut frxETHAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));


        // getCurveOut = await swappingAggregator.getCurveOut.call(rETHBalAuraAddr, number, true);
        // console.log("getCurveOut rETHBalAuraAddr sell price is : ", BigNumber(getCurveOut).div(1e18).toString(10));
        // getCurveOut = await swappingAggregator.getCurveOut.call(rETHBalAuraAddr, number, false);
        // console.log("getCurveOut rETHBalAuraAddr buy price is : ", number.div(BigNumber(getCurveOut)).toString(10));

        // const stETHHoldingStrategyAddr = "0x1Ba189CBA10Af7fBf28Fc991D3d5Cdd945C21A94";
        // const rETHHoldingStrategyAddr = "0x4cc700Ed0C9D76A8F7c082e4f17b675152B067d9";
        // const sFraxETHHoldingStrategyAddr = "0xd470bc940E3699e9F5fe942373ebfE51E637282D";
        // const rETHBalancerAuraStrategy = "0xEe856F34175064A7469BbEB89ec3717bEE45316F";//deposit rETH+wETH

        // let stETHBalance = BigNumber(await token.balanceOf(stETHHoldingStrategyAddr));
        // console.log("stETHBalance of strategy is :.... ", stETHBalance.toString(10));
        // rETHBalance = BigNumber(await rtoken.balanceOf(rETHHoldingStrategyAddr));
        // console.log("rETHBalance of strategy is :.... ", rETHBalance.toString(10));
        // sfETHBalance = BigNumber(await sftoken.balanceOf(sFraxETHHoldingStrategyAddr));
        // console.log("sfETHBalance of strategy is :.... ", sfETHBalance.toString(10));
        // let rETHAuraBalance = BigNumber(await rbatoken.balanceOf(rETHBalancerAuraStrategy));
        // console.log("rETHAuraBalance of strategy is :.... ", rETHAuraBalance.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}