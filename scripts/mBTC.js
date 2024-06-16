const BigNumber = require('bignumber.js');
const assert = require('assert');
const MockToken = artifacts.require("MockToken");
const user1 = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
// 部署MockToken合约
const mBTCAddr = "0xB880fd278198bd590252621d4CD071b1842E9Bcd";
const mBTCCarnivalAddr = "0x095957CEB9f317ac1328f0aB3123622401766D71";
const BTCL2StakeStoneCarnival = artifacts.require("BTCL2StakeStoneCarnival");
const truffleAssert = require('truffle-assertions');

module.exports = async function (callback) {
    try {

        let mBTCtoken = await MockToken.at(mBTCAddr);
        let bTCL2StakeStoneCarnival = await BTCL2StakeStoneCarnival.at(mBTCCarnivalAddr);
        // // 查询用户和合约mbtc数量
        // let user1_mBTC = BigNumber(await mBTCtoken.balanceOf(user1));
        // console.log("user1_mBTC is : ", user1_mBTC.toString(10));
        // let carnival_mBTC = BigNumber(await mBTCtoken.balanceOf(mBTCCarnivalAddr));
        // console.log("carnival_mBTC is : ", carnival_mBTC.toString(10));

        // // 为用户授权代币转移
        // // await mBTCtoken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user1 });

        // // 用户进行存款操作
        // // await bTCL2StakeStoneCarnival.deposit(BigNumber(1e12), { from: user1 });

        // // 获取用户存款数量
        // let user1_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user1);
        // console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));

        // assert.strictEqual(await bTCL2StakeStoneCarnival.isExec(), false);

        // await truffleAssert.fails(
        //     bTCL2StakeStoneCarnival.withdrawLP({ from: user1 }),
        //     truffleAssert.ErrorType.REVERT,
        //     "not exec"
        // );

        // user1 withdraw mbtc
        await bTCL2StakeStoneCarnival.withdrawBTC({ from: user1 });
        // 获取用户存款数量
        let user1_deposited_amount1 = await bTCL2StakeStoneCarnival.btcDeposited(user1);
        console.log("user1_deposited_amount1 is : ", user1_deposited_amount1.toString(10));

        let user1_mBTC1 = BigNumber(await mBTCtoken.balanceOf(user1));
        console.log("user1_mBTC1 is : ", user1_mBTC1.toString(10));

        let carnival_mBTC1 = BigNumber(await mBTCtoken.balanceOf(mBTCCarnivalAddr));
        console.log("carnival_mBTC1 is : ", carnival_mBTC1.toString(10));


        callback();
    } catch (e) {
        callback(e);
    }

}