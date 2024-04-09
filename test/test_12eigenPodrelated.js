//truffle exec test/test_12eigenPodrelated.js --network goerli
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const assert = require('assert');

const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");

const eigenpodManagerAddr = "0xa286b84c96af280a49fe1f40b9627c2a2827df41";
const strategyControllerAddr = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";   //自己的地址
const batchDepositAddr = "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c";
const name = "ETH";
const eigenNativeRestakingStrategyAddr = "0xcA31C24c4c4304bB48D761F8Adb099E1bDe21C48";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
const eigenPod = "0xCD040cDc8f5ec149B8470e7FC1347e344B302374";
const podOwner = "0x17b8aA377a7B334F9E54dbC9Ee1D7BC55723B058";
// const newEigenpodManagerAddr = "0x693385E040a9b038f6e87bc49a34D5645EAf66e5";
module.exports = async function (callback) {
    try {
        const agenStrategy = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);
        // let count = await agenStrategy.getEigenPodsLength(
        //     {
        //         from: deployer
        //     });
        // console.log("count is : ", count);
        // await agenStrategy.setNewEigenPodManager(eigenpodManagerAddr,
        //     {
        //         from: deployer
        //     });
        // let interest = BigNumber(2e16);
        // await web3.eth.sendTransaction({
        //     from: deployer,
        //     to: eigenNativeRestakingStrategyAddr,
        //     value: interest.toString(10)
        // })
        // let investedValue = await agenStrategy.getInvestedValue.call({
        //     from: deployer
        // });
        // console.log("investedValue is : ", investedValue.toString(10));

        // let allValue = await agenStrategy.getAllValue.call({
        //     from: deployer
        // });
        // console.log("getAllValue is : ", allValue.toString(10));
        // // assert.strictEqual(BigNumber(investedValue).plus(interest), BigNumber(allValue));
        let eigenPodsValue = await agenStrategy.getEigenPodsValue.call({
            from: deployer
        });
        console.log("eigenPodsValue is : ", BigNumber(eigenPodsValue).toString(10));
        // // assert.strictEqual(BigNumber(eigenPodsValue).toString(10), );

        // let pods = await agenStrategy.getEigenPods(0, 1, { from: deployer })
        // console.log("pods is : ", pods);
        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};