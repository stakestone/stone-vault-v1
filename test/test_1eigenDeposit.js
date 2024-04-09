//truffle exec test/test_1eigenDeposit.js --network goerli
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");

const eigenpodManagerAddr = "0xa286b84c96af280a49fe1f40b9627c2a2827df41";
const strategyControllerAddr = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";   //自己的地址
const batchDepositAddr = "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c";
const name = "ETH";
const eigenNativeRestakingStrategyAddr = "0xcA31C24c4c4304bB48D761F8Adb099E1bDe21C48";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";

module.exports = async function (callback) {
    //钱存没存进去，可以查infostone的接口看是否有pending的
    try {
        const agenStrategy = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);

        const transaction = await agenStrategy.deposit({
            value: web3.utils.toWei('32', 'ether'), // 转账的数量，32 ETH
            from: strategyControllerAddr
        });

        console.log('Transaction hash:', transaction.tx);
        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};