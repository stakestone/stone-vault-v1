const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;

const Stone = artifacts.require("Stone");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";


module.exports = async function (callback) {
    try {
        // const stone = await Stone.at("0x18df04C3B4704aCa415246daD2441464593d38f4");
        // let enable = await stone.enable();
        // console.log("enable: ", enable);
        // const quota = await stone.getQuota.call();

        // const DAY_INTERVAL = await stone.DAY_INTERVAL();
        // console.log("DAY_INTERVAL: ", BigNumber(DAY_INTERVAL).toString(10));

        // console.log("quota: ", BigNumber(quota).div(1e18).toString(10));

        // let owner = await stone.owner();
        // console.log("owner: ", owner);
        // mantle testnet
        const stone1 = await Stone.at("0x1aFd76746861B6051a049487895d7793CECC3FD6");
        let enable1 = await stone1.enable();
        console.log("enable: ", enable1);
        // // 10181
        // await stone.setEnableFor(
        //     10181,
        //     true,
        //     "0x1aFd76746861B6051a049487895d7793CECC3FD6",
        //     {
        //         value: BigNumber(1e17).toString(10),    //layzero gas fee
        //         from: "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"
        //     }
        // );

        // await stone.transferOwnership("0xc772FAf13E8fC346e7b1678F5f2084F884c56F92");
        // owner = await stone.owner();
        // console.log("owner: ", owner);

        callback();
    } catch (e) {
        callback(e);
    }
}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}