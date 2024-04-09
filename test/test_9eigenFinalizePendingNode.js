//truffle exec test/test_9eigenFinalizePendingNode.js --network goerli
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');
const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");
const Web3 = require('web3');

const eigenpodManagerAddr = "0xa286b84c96af280a49fe1f40b9627c2a2827df41";
const strategyControllerAddr = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";   //自己的地址
const batchDepositAddr = "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c";
const name = "ETH";
const eigenNativeRestakingStrategyAddr = "0xcA31C24c4c4304bB48D761F8Adb099E1bDe21C48";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
module.exports = async function (callback) {
    try {
        const eigenPodAddress = "0x4FA79bC58c927b95CEFfB53E679086A685ac187a";
        const eigenNativeRestakingStrategy = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);
        // let value_bef = BigNumber(await eigenNativeRestakingStrategy.getInvestedValue.call());
        // console.log("value_bef is : ", value_bef.toString(10));

        // await eigenNativeRestakingStrategy.finalizePendingNode(1,
        //     { from: deployer }
        // );
        // console.log("finalizePendingNode ");
        // let value_aft = BigNumber(await eigenNativeRestakingStrategy.getInvestedValue.call());
        // console.log("value_aft is : ", value_aft.toString(10));

        // assert.strictEqual(value_aft.minus(value_bef), BigNumber(32).times(1e18));
        let activeNode = BigNumber(await eigenNativeRestakingStrategy.activeNodeAmount());
        console.log("activeNode is : ", activeNode.toString(10));
        let pendingNodeAmount = BigNumber(await eigenNativeRestakingStrategy.pendingNodeAmount());
        console.log("pendingNodeAmount is : ", pendingNodeAmount.toString(10));
        let withdrawingNodeAmount = BigNumber(await eigenNativeRestakingStrategy.withdrawingNodeAmount());
        console.log("withdrawingNodeAmount is : ", withdrawingNodeAmount.toString(10));
        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};