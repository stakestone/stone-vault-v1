const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');
const Stone = artifacts.require("Stone");

module.exports = async function (callback) {
    try {
        const from_address = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        const to_address = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        const eth_linkId = 101;
        const stone_son = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");

        const amount = BigNumber(1e11).toString(10);

        const packedData = ethers.utils.solidityPack(["bytes"], ["0x"]);

        let feePart = await stone_son.estimateSendFee(
            eth_linkId,
            to_address,
            amount,
            false,
            packedData
        );

        console.log("Native fee is: ", BigNumber(feePart.nativeFee).toString(10));
        console.log("ZRO fee is: ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone_son.sendFrom(
            from_address,
            eth_linkId,
            to_address,
            amount,
            from_address,
            ZERO_ADDRESS,
            packedData,
            {
                value: BigNumber(feePart.nativeFee).toString(10), // LayerZero gas fee
                from: from_address
            }
        );

        console.log("Transaction result: ", result);
        callback();
    } catch (e) {
        console.error("Error:", e.message); // Log the error message for debugging
        callback(e);
    }
};
