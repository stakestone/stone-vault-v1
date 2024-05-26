const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        // //eth to scroll 
        // //fee part
        const from_adress = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
        const to_address = "0xC63aAf9ca7e6BD36C85D505bb8B83c55269eb8eD";
        const bnb_linkId = 102;
        const stone_scroll = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        //0.05198
        //0.00013
        const amount = BigNumber(2e13).toString(10);
        const packedData = ethers.utils ? ethers.utils.solidityPack(["bytes"], ["0x"]) : "0x";

        // // let feePart = await stone_scroll.estimateSendFee(
        // let feePart = await stone_manta.estimateSendFee(
        //     scroll_linkId,
        //     // eth_linkId,
        //     to_address,
        //     amount,
        //     false,
        //     ethers.utils.solidityPack(["bytes"], ["0x"])
        // );
        // console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        // console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone_scroll.sendFrom(
            from_adress,
            bnb_linkId,
            to_address,
            amount,
            from_adress,
            ZERO_ADDRESS,
            packedData,
            {
                value: BigNumber(2e15).toString(),    //layzero gas fee
                // value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_adress
            }
        );
        // let user_stone = BigNumber(await stone_scroll.balanceOf(to_address));
        // console.log("result is : ", user_stone.toString(10));


        callback();
    } catch (e) {
        console.error("Error:", e.message); // Log the error message for debugging

        callback(e);
    }
}
