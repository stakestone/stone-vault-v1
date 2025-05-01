const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        // //eth to scroll 
        // //fee part
        const from_address = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        const to_address = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        const linea_linkId = 183;
        const stone_manta = await Stone.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");
        // const stone_zircuit = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");

        const amount = BigNumber(2e13).toString(10);
        const packedData = ethers.utils ? ethers.utils.solidityPack(["bytes"], ["0x"]) : "0x";

        // // let feePart = await stone_scroll.estimateSendFee(
        let feePart = await stone_manta.estimateSendFee(
            linea_linkId,
            // eth_linkId,
            to_address,
            amount,
            false,
            ethers.utils.solidityPack(["bytes"], ["0x"])
        );
        console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone_manta.sendFrom(
            from_address,
            linea_linkId,
            to_address,
            amount,
            from_address,
            ZERO_ADDRESS,
            packedData,
            {
                // value: BigNumber(9e15).toString(),    //layzero gas fee
                value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_address
            }
        );
        callback();
    } catch (e) {
        console.error("Error:", e.message); // Log the error message for debugging

        callback(e);
    }
}
