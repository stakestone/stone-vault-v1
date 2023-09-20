// truffle compile
// truffle exec scripts/deployment.js --network goerli
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");

const StrategyController = artifacts.require("StrategyController");

module.exports = async function (callback) {
    try {
        const strategyController = await StrategyController.at("0x6D45Ea56aF312b0e9489C16918d49682983ECe3a");
        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        console.log("strategy length is : ", strategies[0].length);

        let strategy1 = strategies[0][0];
        console.log("strategy1 is : ", strategies[0][0]);

        let interest = BigNumber(2e17);

        let strategy_vaule = BigNumber(await strategyController.getStrategyValue.call(strategy1));
        console.log("strategy_vaule1 is : ", strategy_vaule.toString(10));

        await web3.eth.sendTransaction({
            from: deployer,
            to: strategy1,
            value: interest.toString(10)
        })
        let strategy_vaule2 = BigNumber(await strategyController.getStrategyValidValue.call(strategy1));
        console.log("strategy_vaule2 is : ", strategy_vaule2.toString(10));
        callback();
    } catch (e) {
        callback(e);
    }

}