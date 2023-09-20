const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
var ethers = require('ethers');

const Stone = artifacts.require("Stone");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";


module.exports = async function (callback) {
    try {
        //goerli
        // const stone = await Stone.at("0x18df04C3B4704aCa415246daD2441464593d38f4");
        // // 10181
        // await stone.sendFrom(
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     10181,
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     BigNumber(1e16).toString(10),
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
        //     "0x",
        //     {
        //         value: BigNumber(1e17).toString(10),    //layzero gas fee
        //         from: "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"
        //     }
        // );

        //mantle testnet
        const stone = await Stone.at("0x1aFd76746861B6051a049487895d7793CECC3FD6");
        await stone.sendFrom(
            "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
            10121,
            "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
            BigNumber(1e16).toString(10),
            "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92",
            ZERO_ADDRESS,
            ethers.utils.solidityPack(["bytes"], ["0x"]),
            {
                value: BigNumber(8e17).toString(10),    //layzero gas fee
                from: "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"
            }
        );

        // await stone.transferOwnership("0xc772FAf13E8fC346e7b1678F5f2084F884c56F92");
        // owner = await stone.owner();
        // console.log("owner: ", owner);

        callback();
    } catch (e) {
        callback(e);
    }
}
