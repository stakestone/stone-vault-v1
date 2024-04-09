const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        //fee part
        const from_adress = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
        const to_address = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
        const eth_linkId = 101;
        const stone_metis = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        const amount = BigNumber(3e13).toString(10);
        let feePart = await stone_metis.estimateSendFee(
            eth_linkId,
            to_address,
            amount,
            false,
            ethers.utils.solidityPack(["bytes"], ["0x"])
        );
        console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone_metis.sendFrom(
            from_adress,
            eth_linkId,
            to_address,
            amount,
            from_adress,
            ZERO_ADDRESS,
            ethers.utils.solidityPack(
                ["bytes"],
                ["0x"]),
            {
                // value: BigNumber(1e18).toString(),    //layzero gas fee
                value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_adress
            }
        );
        console.log("result is : ", result);

        callback();
    } catch (e) {
        callback(e);
    }
}
