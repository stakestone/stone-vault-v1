const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const ethers = require('ethers'); // 确保导入 ethers
const Stone = artifacts.require("Stone");
const taker1 = "0x922EB28991c2cbaEBC70e85d238F75d5Ea8B5745";
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7777'));
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
//truffle exe scripts/1BridgeDebug.js --network test
async function main(callback) {
    try {
        // 启用 impersonation
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [taker1],
            id: 1,
        });

        const from_address = taker1;
        const to_address = taker1;
        const ETH_linkId = 101;

        // 获取合约实例
        const stone_scroll = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");

        const amount = BigNumber(await stone_scroll.balanceOf(taker1));
        console.log("taker1 stone balance is : ", amount.toString(10));
        const packedData = ethers.utils.solidityPack(["bytes"], ["0x"]);

        // 估算手续费
        let feePart = await stone_scroll.estimateSendFee(
            ETH_linkId,
            to_address,
            amount,
            false,
            packedData
        );

        console.log("Native fee is: ", new BigNumber(feePart.nativeFee).toString(10));
        console.log("ZRO fee is: ", new BigNumber(feePart.zroFee).toString(10));

        // 调用 sendFrom
        let result = await stone_scroll.sendFrom(
            from_address,
            ETH_linkId,
            to_address,
            amount,
            from_address,
            ZERO_ADDRESS,
            packedData,
            {
                value: new BigNumber(feePart.nativeFee).toString(10), // LayerZero gas fee
                from: from_address
            }
        );

        console.log("Transaction result: ", result);
        callback(); // 确保 Truffle 正确结束脚本
    } catch (e) {
        console.error("An error occurred:", e);
        callback(e); // 结束时传递错误给 Truffle
    }
}

// 捕获未处理的 Promise 异常
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error.message);
});

module.exports = function (callback) {
    main(callback);
};
