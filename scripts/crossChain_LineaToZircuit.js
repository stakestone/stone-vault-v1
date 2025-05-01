const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        const from_address = "0xB30d1f7FBbfc689d8B1aD61B108665AF12Ec18D7";
        const to_address = "0xB30d1f7FBbfc689d8B1aD61B108665AF12Ec18D7";
        const zircuit_linkId = 303;
        // const mode_linkId = 260;

        // const stone_manta = await Stone.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");
        const stone_linea = await Stone.at("0x93F4d0ab6a8B4271f4a28Db399b5E30612D21116");

        const amount = BigNumber(4e12).toString(10);
        const packedData = ethers.utils ? ethers.utils.solidityPack(["bytes"], ["0x"]) : "0x";

        // // let feePart = await stone_scroll.estimateSendFee(
        let feePart = await stone_linea.estimateSendFee(
            zircuit_linkId,
            to_address,
            amount,
            false,
            ethers.utils.solidityPack(["bytes"], ["0x"])
        );
        console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone_linea.sendFrom(
            from_address,
            zircuit_linkId,
            to_address,
            amount,
            from_address,
            ZERO_ADDRESS,
            packedData,
            {
                value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_address
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
