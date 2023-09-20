// truffle compile
// truffle exec scripts/setRouter.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
// const MockNullStrategy = artifacts.require("MockNullStrategy");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const RETHHoldingStrategy = artifacts.require("RETHHoldingStrategy");
const BalancerLPAuraStrategy = artifacts.require("BalancerLPAuraStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");
const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";

module.exports = async function (callback) {
    try {

        const stETHHoldingStrategy = await STETHHoldingStrategy.at("0xF97C478f34E1dBA7E399b973f4b720bA5885290b");
        const gover = await stETHHoldingStrategy.governance();

        console.log(".......st: ", gover);
        // await stETHHoldingStrategy.setRouter(0, 0);
        console.log(".......st");
        const rETHHoldingStrategy = await RETHHoldingStrategy.at("0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef");
        console.log(".......st");
        // await rETHHoldingStrategy.setRouter(1, 0);
        console.log(".......st");
        const sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.at("0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853");
        // await sFraxETHHoldingStrategy.setRouter(0, 0);

        let st_buyOnDex = await stETHHoldingStrategy.buyOnDex();
        let st_sellOnDex = await stETHHoldingStrategy.sellOnDex();
        let r_buyOnDex = await rETHHoldingStrategy.buyOnDex();
        let r_sellOnDex = await rETHHoldingStrategy.sellOnDex();

        let sF_buyOnDex = await sFraxETHHoldingStrategy.buyOnDex();
        let sF_sellOnDex = await sFraxETHHoldingStrategy.sellOnDex();

        console.log("st_buyOnDex is : ", st_buyOnDex.toString(10));
        console.log("st_sellOnDex is : ", st_sellOnDex.toString(10));

        console.log("r_buyOnDex is : ", r_buyOnDex.toString(10));
        console.log("r_sellOnDex is : ", r_sellOnDex.toString(10));

        console.log("sF_buyOnDex is : ", sF_buyOnDex.toString(10));
        console.log("sF_sellOnDex is : ", sF_sellOnDex.toString(10));

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