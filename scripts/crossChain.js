const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
var ethers = require('ethers');

const Stone = artifacts.require("Stone");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";


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
        const stone = await Stone.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");
        let feePart = await stone.estimateSendFee(
            101,
            "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
            BigNumber(1e14).toString(10),
            false,
            ethers.utils.solidityPack(["bytes"], ["0x"])
        );
        console.log("result is : ", BigNumber(feePart.nativeFee).toString(10));
        console.log("result is : ", BigNumber(feePart.zroFee).toString(10));

        // //eth to manta , linkID 217
        // const stone = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");
        // let result = await stone.sendFrom(
        //     "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
        //     217,
        //     "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
        //     BigNumber(5e14).toString(10),
        //     "0xa9B3cBcF3668e819bd35ba308dECb640DF143394",
        //     ZERO_ADDRESS,
        //     ethers.utils.solidityPack(["bytes"], ["0x"]),
        //     {
        //         value: BigNumber(3e15).toString(10),    //layzero gas fee
        //         from: "0xa9B3cBcF3668e819bd35ba308dECb640DF143394"
        //     }
        // );
        // console.log("result is : ", result);
        // // await stone.transferOwnership("0xc772FAf13E8fC346e7b1678F5f2084F884c56F92");
        // // owner = await stone.owner();
        // // console.log("owner: ", owner);

        callback();
    } catch (e) {
        callback(e);
    }
}
