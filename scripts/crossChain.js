const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        // // bsc testnet -> manta testnet
        // const stone = await Stone.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");

        // let result = await stone.sendFrom(
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     10221,
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     BigNumber(1e16).toString(10),
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     ZERO_ADDRESS,
        //     ethers.utils.solidityPack(["bytes"], ["0x"]),
        //     {
        //         value: BigNumber(50e18).toString(10),    //layzero gas fee
        //         from: "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"
        //     }
        // );
        // console.log("result is : ", result);

        // // manta to bsc, 
        // const stone = await Stone.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");
        // let result = await stone.sendFrom(
        //     "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
        //     102,
        //     "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
        //     BigNumber(1e14).toString(10),
        //     "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
        //     ZERO_ADDRESS,
        //     ethers.utils.solidityPack(["bytes"], ["0x"]),
        //     {
        //         value: BigNumber(3e15).toString(10),    //layzero gas fee
        //         from: "0xa9B3cBcF3668e819bd35ba308dECb640DF143394"
        //     }
        // );
        // console.log("result is : ", result);
        //fee part
        const to_address = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
        const from_adress = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
        const stone = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        // const stone = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");

        const amount = BigNumber(2e15).toString(10);
        let feePart = await stone.estimateSendFee(
            // 257,
            102,
            // 101,
            to_address,
            amount,
            false,
            ethers.utils.solidityPack(["bytes"], ["0x"])
        );
        console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        let result = await stone.sendFrom(
            from_adress,
            // 257,
            // 101,
            102,
            to_address,
            amount,
            from_adress,
            ZERO_ADDRESS,
            ethers.utils.solidityPack(
                ["bytes"],
                ["0x"]),
            {
                value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_adress
            }
        );
        console.log("result is : ", result);
        // // await stone.transferOwnership("0xc772FAf13E8fC346e7b1678F5f2084F884c56F92");
        // // owner = await stone.owner();
        // // console.log("owner: ", owner);

        callback();
    } catch (e) {
        callback(e);
    }
}
