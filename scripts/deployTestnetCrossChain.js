const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');

const fs = require('fs');
const path = require("path");
const DepositBridge = artifacts.require("DepositBridge");
const data = require("../test.json");
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
//部署前记得先重新编译
module.exports = async function (callback) {
    try {
        const stone = "0x1Aff5cd754f271b80b7598d4aA77a4F16363c515";
        const vault = "0x19d2b3c75d249fb38dfab17c7aa2326351b64d4b";
        const dstChainId = 10221;
        let depositBridge;
        let depositBridgeAddr;
        if (data.hasOwnProperty("depositBridgeAddr") && data.depositBridgeAddr != "") {
            depositBridgeAddr = data.depositBridgeAddr;
            depositBridge = await DepositBridge.at(depositBridgeAddr);
            console.log("depositBridge: ", depositBridge.address);
        } else {
            depositBridge = await DepositBridge.new(stone, vault, dstChainId);
            console.log("depositBridge addr is : ", depositBridge.address);
            depositBridgeAddr = depositBridge.address;
            data.depositBridgeAddr = depositBridge.address;

            writeData(data);
        }

        callback();
    } catch (e) {
        callback(e);
    }

    function writeData(data) {
        fs.writeFileSync(path.resolve(__dirname, './test.json'),
            JSON.stringify(data, null, 4),
            {
                flag: 'w'
            },
        )
    }
}