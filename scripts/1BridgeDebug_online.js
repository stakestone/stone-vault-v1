const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');
const Stone = artifacts.require("Stone");
const taker1 = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";

async function main(callback) {
    try {
        const from_address = taker1;
        const to_address = taker1;
        const ETH_linkId = 101;

        // 获取合约实例
        const stone_scroll = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");

        const amount = BigNumber(1e14);
        console.log("taker1 stone balance is : ", amount.toString(10));
        const packedData = ethers.utils.solidityPack(["bytes"], ["0x"]);

        // // 估算手续费
        // let feePart = await stone_scroll.estimateSendFee(
        //     ETH_linkId,
        //     to_address,
        //     amount,
        //     false,
        //     packedData
        // );

        // console.log("Native fee is: ", new BigNumber(feePart.nativeFee).toString(10));
        // console.log("ZRO fee is: ", new BigNumber(feePart.zroFee).toString(10));

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
                // value: new BigNumber(feePart.nativeFee).toString(10), // LayerZero gas fee
                value: BigNumber(1e12),
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
