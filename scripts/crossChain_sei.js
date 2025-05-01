const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const { ethers } = require("ethers");
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    //truffle exe scripts/crossChain.js --network eth 
    try {
        const from_adress = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";
        const to_address = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";
        const base_linkId = 184;
        // const sei_linkId = 280;
        const stone_sei = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        // const stone_eth = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");
        const amount = BigNumber(1e13).toString(10);
        const packedData = ethers.utils ? ethers.utils.solidityPack(["bytes"], ["0x"]) : "0x";

        // let feePart = await stone_sei.estimateSendFee(
        //     // sei_linkId,
        //     base_linkId,
        //     to_address,
        //     amount,
        //     false,
        //     ethers.utils.solidityPack(["bytes"], ["0x"])
        // );
        // console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        // console.log("result is : ", BigNumber(feePart.zroFee).toString(10));
        let result = await stone_sei.sendFrom(
            from_adress,
            base_linkId,
            to_address,
            amount,
            from_adress,
            ZERO_ADDRESS,
            packedData,
            {
                value: BigNumber(20e18).toString(),    //layzero gas fee
                // value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_adress
            }
        );
        callback();
    } catch (e) {
        console.error("Error:", e.message); // Log the error message for debugging
        callback(e);
    }
}
