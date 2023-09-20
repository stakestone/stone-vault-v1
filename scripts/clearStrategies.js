// truffle compile
// truffle exec scripts/clearStrategies.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
// const MockNullStrategy = artifacts.require("MockNullStrategy");
const StrategyController = artifacts.require("StrategyController");

module.exports = async function (callback) {
    try {
        const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";

        const vault = "0xD682C2b9814FB096c843984Da9810916CB2206e0";
        const stoneVault = await StoneVault.at(vault);
        const stETHHoldingStrategyAddr = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
        const rETHHoldingStrategyAddr = "0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef";
        const sFraxETHHoldingStrategyAddr = "0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853";
        const rETHBalancerAuraStrategy = "0xf60b394638Ecbc2020Ac3E296E04Fd955A3eB460";

        //check asset vault balance
        let assetsVaultAddress = "0x7f60E63e40e5065E5A48a77010169dE269fc8aB7";
        let assetsVaultBalance = BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        console.log("assetsVault ether amount:", assetsVaultBalance.toString());

        // await stoneVault.clearStrategy(rETHBalancerAuraStrategy, {
        //     from: deployer
        // });

        // let assetsVaultBalance1 = BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        // console.log("assetsVault1 ether amount:", assetsVaultBalance1.toString());

        // let amount = assetsVaultBalance1.minus(assetsVaultBalance);
        // console.log("after clear st strategy , the asset vault increase : ", amount.toString(10));
        await stoneVault.destroyStrategy(rETHHoldingStrategyAddr, {
            from: deployer
        });

        callback();
    } catch (e) {
        callback(e);
    }

}