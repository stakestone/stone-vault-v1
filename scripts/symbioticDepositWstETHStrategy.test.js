const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
const ethers = require('ethers');
const assert = require('assert');
const SymbioticDepositWstETHStrategy = artifacts.require("SymbioticDepositWstETHStrategy");
const StoneVault = artifacts.require("StoneVault");
const ILidoWithdrawalQueue = artifacts.require("ILidoWithdrawalQueue");
const IERC20 = artifacts.require("IERC20");

const deployer = "0xc1364ad857462e1b60609d9e56b5e24c5c21a312";
const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const wstETHAddr = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const collateralAddr = "0xC329400492c6ff2438472D4651Ad17389fCb843a";
const limitIncreaser = "0x5721ce64Ee0D772Ce613b62D411350091C544cD0";

module.exports = async function (callback) {
    try {
        await web3.eth.sendTransaction({
            from: "0x648a7ad8a03b1dbbb457a4d30ad6dc05bf4b20e5",
            to: deployer,
            value: BigNumber(5).times(1e18).toString(10)
        });
        await web3.eth.sendTransaction({
            from: "0x648a7ad8a03b1dbbb457a4d30ad6dc05bf4b20e5",
            to: limitIncreaser,
            value: BigNumber(5).times(1e18).toString(10)
        });

        // const provider = ethers.getDefaultProvider("http://localhost:8545");
        const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
        const signer = await provider.getSigner(
            limitIncreaser
        );
        console.log("getSigner success");

        const fn_increaseLimit = "increaseLimit(uint256)";
        const selector_increaseLimit = Abi.encodeFunctionSignature(fn_increaseLimit);
        let encodedParams_increaseLimit = Abi.encodeParameters(
            ["uint256"],
            [
                BigNumber(100000).times(1e18).toString(10)
            ]
        );
        const data_increaseLimit = `${selector_increaseLimit}${encodedParams_increaseLimit.split("0x")[1]}`
        console.log("before");
        const signerAddress = await signer.getAddress();
        console.log(`Signer address: ${signerAddress}`);
        await signer.sendTransaction({
            to: collateralAddr,
            value: 0,
            data: data_increaseLimit
        });
        await sleep(5);

        const symbioticDepositWstETHStrategy = await SymbioticDepositWstETHStrategy.new(
            deployer,
            wstETHAddr,
            lidoWithdrawalQueueAddr,
            collateralAddr,
            "symbioticDepositWstETHStrategy"
        );
        console.log("symbioticDepositWstETHStrategy: ", symbioticDepositWstETHStrategy.address);

        await checkStrategy(symbioticDepositWstETHStrategy.address);

        // Deposit
        console.log("======== Deposit ========")
        await symbioticDepositWstETHStrategy.deposit({
            value: BigNumber(5).times(1e18).toString(10),
            from: deployer
        });

        await checkStrategy(symbioticDepositWstETHStrategy.address);

        // wrapToWstETH
        console.log("======== wrapToWstETH ========")
        result = await symbioticDepositWstETHStrategy.wrapToWstETH.call(
            BigNumber(5).times(1e18).toString(10),
            ZERO_ADDRESS
        );
        console.log("result", result.toString(10));
        // const emittedEvents = result.receipt.rawLogs.map(log => log.topics[0]);
        // console.log("emittedEvents is : ", emittedEvents);

        await checkStrategy(symbioticDepositWstETHStrategy.address);

        // depositIntoSymbiotic
        console.log("======== depositIntoSymbiotic 50 ========")
        await symbioticDepositWstETHStrategy.depositIntoSymbiotic(
            BigNumber(2).times(1e18).toString(10),
        );

        await checkStrategy(symbioticDepositWstETHStrategy.address);


        // depositIntoSymbiotic
        // console.log("======== depositIntoSymbiotic 5 ========")
        // await symbioticDepositWstETHStrategy.depositIntoSymbiotic(
        //     BigNumber(2).times(1e18).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // // withdraswFromSymbiotic
        // console.log("======== depositIntoSymbiotic 20 ========")
        // await symbioticDepositWstETHStrategy.withdraswFromSymbiotic(
        //     BigNumber(2).times(1e18).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // // withdraswFromSymbiotic
        // console.log("======== depositIntoSymbiotic 15 ========")
        // await symbioticDepositWstETHStrategy.withdraswFromSymbiotic(
        //     BigNumber(1).times(1e18).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // // unwrapToStETH
        // console.log("======== unwrapToStETH 15 ========")
        // await symbioticDepositWstETHStrategy.unwrapToStETH(
        //     BigNumber(1).times(1e18).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // // unwrapToStETH
        // console.log("======== unwrapToStETH 10 ========")
        // await symbioticDepositWstETHStrategy.unwrapToStETH(
        //     BigNumber(2).times(1e18).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // // requestToEther
        // console.log("======== requestToEther 10 ========")
        // await symbioticDepositWstETHStrategy.requestToEther(
        //     BigNumber(1).times(1e18).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // // requestToEther
        // console.log("======== requestToEther 20 ========")
        // await symbioticDepositWstETHStrategy.requestToEther(
        //     BigNumber(5).times(1e17).toString(10),
        // );

        // await checkStrategy(symbioticDepositWstETHStrategy.address);

        // assert.strictEqual(1, 2);

        callback();
    } catch (e) {
        callback(e);
    }

    async function checkStrategy(strategyAddr) {
        const strategy = await SymbioticDepositWstETHStrategy.at(strategyAddr);
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const stETH = await IERC20.at(stETHAddr);
        const wstETH = await IERC20.at(wstETHAddr);
        const lidoWithdrawalQueue = await ILidoWithdrawalQueue.at(lidoWithdrawalQueueAddr);

        let currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));

        let ethBalance = await web3.eth.getBalance(strategyAddr);
        console.log("ethBalance: ", BigNumber(ethBalance).div(1e18).toString(10));

        let stETHBalance = await stETH.balanceOf(strategyAddr);
        console.log("stETH Balance: ", BigNumber(stETHBalance).div(1e18).toString(10));

        let wstETHBalance = await wstETH.balanceOf(strategyAddr);
        console.log("wstETH Balance: ", BigNumber(wstETHBalance).div(1e18).toString(10));

        let getAllValue = await strategy.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        let getWstETHValue = await strategy.getWstETHValue.call();
        console.log("getWstETHValue: ", BigNumber(getWstETHValue).div(1e18).toString(10));

        let allids = await lidoWithdrawalQueue.getWithdrawalRequests(strategyAddr);
        allids = allids.map((id) => {
            return id.toNumber();
        })
        console.log("total pending num: ", allids.length);
        console.log("all ids: ", allids);
    }

}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}