//truffle exec test/test_eigenInstantWithdraw.js --network goerli
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const Account = artifacts.require("Account");
const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");

const eigenpodManagerAddr = "0xa286b84c96af280a49fe1f40b9627c2a2827df41";
const strategyControllerAddr = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";   //自己的地址
const batchDepositAddr = "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c";
const name = "ETH";
const eigenNativeRestakingStrategyAddr = "0xcA31C24c4c4304bB48D761F8Adb099E1bDe21C48";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
// active合约没钱没办法立即取款 pass

module.exports = async function (callback) {
    //钱还在infostone,可以立即取款
    try {
        const agen = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);
        strategyControllerBal_1 = BigNumber(await web3.eth.getBalance(strategyControllerAddr));

        const depositAmount = await agen.instantWithdraw(BigNumber(32).times(1e18), { // 转账的数量，32 ETH
            from: strategyControllerAddr
        });
        strategyControllerBal_2 = BigNumber(await web3.eth.getBalance(strategyControllerAddr));
        console.log('depositAmount is :', strategyControllerBal_1.toString(10));
        console.log('depositAmount is :', strategyControllerBal_2.toString(10));

        console.log('depositAmount is :', depositAmount);
        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};