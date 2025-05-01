const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const { ethers } = require('ethers');
const Stone = artifacts.require("Stone");

module.exports = async function (callback) {
    try {
        const from_address = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        const to_address = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        const S_linkId = 340;
        const stone_eth = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");

        const amount = BigNumber(1e15).toString(10);

        const packedData = ethers.utils.solidityPack(["bytes"], ["0x"]);
        let feePart = await stone_eth.estimateSendFee(
            S_linkId,
            to_address,
            amount,
            false,
            packedData
        );
        console.log("Native fee is: ", BigNumber(feePart.nativeFee).toString(10));
        console.log("ZRO fee is: ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone_eth.sendFrom(
            from_address,
            S_linkId,
            to_address,
            amount,
            from_address,
            ZERO_ADDRESS,
            packedData,
            {
                // value: BigNumber(1e16).toString(10), // LayerZero gas fee
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
