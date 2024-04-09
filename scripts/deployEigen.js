// truffle exec scripts/deployEigen.js --network goerli

const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const fs = require('fs');
const path = require("path");
const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");
const data = require("../test.json");
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
const eigenpodManagerAddr = "0xa286b84c96af280a49fe1f40b9627c2a2827df41";
const strategyControllerAddr = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";   //自己的地址
const batchDepositAddr = "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c";
const name = "ETH";
//部署前记得先重新编译
module.exports = async function (callback) {
    try {
        let eigenNativeRestakingStrategyAddr;
        if (data.hasOwnProperty("eigenNativeRestakingStrategyAddr") && data.eigenNativeRestakingStrategyAddr != "") {
            eigenNativeRestakingStrategyAddr = data.eigenNativeRestakingStrategyAddr;
            eigenNativeRestakingStrategy = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);
            console.log("EigenNativeRestakingStrategyAddr: ", EigenNativeRestakingStrategy.address);
        } else {

            eigenNativeRestakingStrategy = await EigenNativeRestakingStrategy.new(strategyControllerAddr, eigenpodManagerAddr, batchDepositAddr, name);
            console.log("eigenNativeRestakingStrategy addr is : ", eigenNativeRestakingStrategy.address);
            eigenNativeRestakingStrategyAddr = eigenNativeRestakingStrategy.address;
            data.eigenNativeRestakingStrategyAddr = eigenNativeRestakingStrategy.address;

            writeData(data);
        }

        callback();
    } catch (e) {
        callback(e);
    }

    function writeData(data) {
        fs.writeFileSync(path.resolve(__dirname, '../test.json'),
            JSON.stringify(data, null, 4),
            {
                flag: 'w'
            },
        )
    }
}