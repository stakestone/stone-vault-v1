// truffle compile
// truffle exec scripts/getStrategies.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
// const MockNullStrategy = artifacts.require("MockNullStrategy");
const StrategyController = artifacts.require("StrategyController");

module.exports = async function (callback) {
    try {

        const strategyController = await StrategyController.at("0x52Df50Fb1de14c3D2b239eE59e3997b946934443");
        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        console.log("strategy length is : ", strategies[0].length);
        // // const stoneVault = await StoneVault.at("");
        // let strategy1 = strategies[0][0];
        // console.log("strategy1 is : ", strategies[0][0]);
        // let strategy2 = strategies[0][1];
        // console.log("strategy2 is : ", strategies[0][1]);
        // let strategy3 = strategies[0][2];
        // console.log("strategy3 is : ", strategies[0][2]);
        // let strategy4 = strategies[0][3];
        // console.log("strategy4 is : ", strategies[0][3]);

        // console.log("strategy1's portion is : ", strategies[1][0].toString(10));
        // console.log("strategy2's portion is : ", strategies[1][1].toString(10));
        // console.log("strategy3's portion is : ", strategies[1][2].toString(10));
        // console.log("strategy4's portion is : ", strategies[1][3].toString(10));

        // let strategy_vaule = BigNumber(await strategyController.getStrategyValue.call(strategies[0][0]));
        // console.log("strategy_vaule is : ", strategy_vaule.toString(10));
        // let strategy_validvaule = BigNumber(await strategyController.getStrategyValidValue.call(strategies[0][0]));
        // console.log("strategy_validvaule is : ", strategy_validvaule.toString(10));

        // let assetsVaultAddress = "0xD682C2b9814FB096c843984Da9810916CB2206e0";
        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount:", assetsVaultBalance.toString());
        // let price = await stoneVault.currentSharePrice.call();
        // console.log("current share price is : ", price.toString());
        callback();
    } catch (e) {
        callback(e);
    }

}