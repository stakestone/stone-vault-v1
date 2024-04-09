//truffle exec test/test_2eigenPod.js --network goerli
const BigNumber = require('bignumber.js');
const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");

const eigenpodManagerAddr = "0xa286b84c96af280a49fe1f40b9627c2a2827df41";
const strategyControllerAddr = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";   //自己的地址
const batchDepositAddr = "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c";
const name = "ETH";
const eigenNativeRestakingStrategyAddr = "0xcA31C24c4c4304bB48D761F8Adb099E1bDe21C48";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
module.exports = async function (callback) {
    try {

        const eigenNativeRestakingStrategy = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);
        let res = await eigenNativeRestakingStrategy.createEigenPod(
            { from: deployer }
        );
        console.log("res is : ", res);
        // eigenPod  
        callback();
    } catch (e) {
        callback(e);
    }
}

