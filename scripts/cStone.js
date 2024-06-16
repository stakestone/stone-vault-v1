const BigNumber = require('bignumber.js');
const assert = require('assert');
const MockToken = artifacts.require("MockToken");
const user1 = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
// 部署MockToken合约
const cStone = "0x4d831e22F062b5327dFdB15f0b6a5dF20E2E3dD0";
const StoneCarnival = artifacts.require("StoneCarnival");
const truffleAssert = require('truffle-assertions');
const Stone = artifacts.require("Stone");
const stoneETHAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
module.exports = async function (callback) {
    try {

        let stoneCarnival = await StoneCarnival.at(cStone);
        // let terminate = await stoneCarnival.terminated();
        // console.log("terminated is : ", terminate);
        let stoneETH = await Stone.at(stoneETHAddr);
        // 查询用户和合约stone数量
        let stone_Carnival = BigNumber(await stoneETH.balanceOf(cStone));
        console.log("stone_Carnival is : ", stone_Carnival.toString(10));
        let stone_user1 = BigNumber(await stoneETH.balanceOf(user1));
        console.log("stone_user1 is : ", stone_user1.toString(10));
        await stoneCarnival.withdrawStone({ from: user1 });
        // 查询用户和合约stone数量
        stone_Carnival = BigNumber(await stoneETH.balanceOf(cStone));
        console.log("stone_Carnival 1 is : ", stone_Carnival.toString(10));
        stone_user1 = BigNumber(await stoneETH.balanceOf(user1));
        console.log("stone_user1 1 is : ", stone_user1.toString(10));


        callback();
    } catch (e) {
        callback(e);
    }

}