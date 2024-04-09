const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        // //eth to scroll 
        // //fee part
        const to_address = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
        // const from_adress = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
        // const eth_linkId = 101;
        // const scroll_linkId = 214;
        // const metis_linkId = 151;
        // const stone_eth = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");
        const stone_scroll = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");

        // const amount = BigNumber(2e14).toString(10);
        // // let feePart = await stone_scroll.estimateSendFee(
        // let feePart = await stone_eth.estimateSendFee(
        //     scroll_linkId,
        //     // eth_linkId,
        //     to_address,
        //     amount,
        //     false,
        //     ethers.utils.solidityPack(["bytes"], ["0x"])
        // );
        // console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        // console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        // let result = await stone_eth.sendFrom(
        //     from_adress,
        //     scroll_linkId,
        //     to_address,
        //     amount,
        //     from_adress,
        //     ZERO_ADDRESS,
        //     ethers.utils.solidityPack(
        //         ["bytes"],
        //         ["0x"]),
        //     {
        //         // value: BigNumber(1e18).toString(),    //layzero gas fee
        //         value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
        //         from: from_adress
        //     }
        // );
        let user_stone = BigNumber(await stone_scroll.balanceOf(to_address));
        console.log("result is : ", user_stone.toString(10));


        callback();
    } catch (e) {
        callback(e);
    }
}
