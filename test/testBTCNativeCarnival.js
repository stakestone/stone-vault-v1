const BTCL2NativeStakeStoneCarnival = artifacts.require("BTCL2NativeStakeStoneCarnival");
const MockToken = artifacts.require("MockToken");
const MockVault = artifacts.require("MockVault1");
const BigNumber = require('bignumber.js');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const deployer = "0xff34f282b82489bfda789816d7622d3ae8199af6";
const user1 = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
const user2 = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
const TruffleConfig = require('../truffle-config');
const chai = require('chai');
const Minter = artifacts.require("Minter");
const RLP = require('rlp');
const Buffer = require('buffer').Buffer;

contract("test Native BTC carnival", async ([]) => {

    let minAllowed, lpToken, lpAddr, mock_vault, minter, vaultAddr;
    // const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
    // console.log('Gas price:', gasPrice.toString());

    const gasPrice = BigNumber(1e5);
    console.log('Current gas price:', gasPrice); // Output in Gwei
    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const encodedBuffer = Buffer.from(encoded);
        const rs = web3.utils.sha3(encodedBuffer);
        return '0x' + rs.substr(rs.length - 40, 40);
    }
    beforeEach(async () => {
        minAllowed = BigNumber(1e15);

        // 部署MockToken合约
        const TOKEN2 = {
            "name": "lpToken",
            "symbol": "lpToken",
            "supply": "10000000000000000000000",
        }
        lpToken = await MockToken.new(TOKEN2.name, TOKEN2.symbol);
        lpAddr = lpToken.address;
        console.log("lpAddr is :", lpAddr);
        const minterAddr = await getFutureAddr(1);
        console.log("minterAddr: ", minterAddr);

        const mock_vault = await getFutureAddr(1);
        console.log("mock_vault: ", mock_vault);

        minter = await Minter.new(lpAddr, mock_vault);
        console.log("minter: ", minter.address);

        mockVault = await MockVault.new(minter.address);
        vaultAddr = mockVault.address;
        console.log("vaultAddr is :", vaultAddr);
    });

    it("test1_user1 deposit BTC", async () => {
        // 部署bTCL2NativeStakeStoneCarnival合约
        let bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
        console.log("bTCL2NativeStakeStoneCarnival addr is : ", bTCL2NativeStakeStoneCarnival.address);
        let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
        // 查询用户和合约BTC数量
        let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
        console.log("user1_BTC is : ", user1_BTC.toString(10));
        let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
        console.log("carnival_BTC is : ", carnival_BTC.toString(10));

        // 用户进行存款操作
        let tx = await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });

        // 获取用户存款数量
        let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);
        console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
        assert.strictEqual(user1_deposited_amount.toString(10), BigNumber(minAllowed).toString(10));

        // // 查询存款后用户和合约BTC数量
        let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
        console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
        let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
        console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));
        // let gasUsed = tx.receipt.gasUsed;
        // console.log('Gas used:', gasUsed.toString());
        // let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        // chai.assert.isTrue(Math.abs(user1_BTC.minus(user1_BTC1).minus(minAllowed).minus(gas)) < 100, 'Absolute difference should be less than 100');

        assert.strictEqual(minAllowed.toString(10), carnival_BTC1.minus(carnival_BTC).toString(10));

    });

    // it("test2_user1 deposit twice and user2 deposit once BTC", async () => {
    //     // 部署bTCL2NativeStakeStoneCarnival合约
    //     bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
    //     let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
    //     // 查询用户和合约BTC数量
    //     let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC is : ", user1_BTC.toString(10));
    //     let user2_BTC = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC is : ", user2_BTC.toString(10));

    //     let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC is : ", carnival_BTC.toString(10));

    //     // 用户进行存款操作
    //     let tx = await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });
    //     let tx1 = await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });
    //     let tx2 = await bTCL2NativeStakeStoneCarnival.deposit({ from: user2, value: minAllowed });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    //     let user2_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user2);
    //     console.log("user2_deposited_amount is : ", user2_deposited_amount.toString(10));


    //     assert.strictEqual(minAllowed.times(2).toString(10), user1_deposited_amount.toString(10));
    //     assert.strictEqual(minAllowed.toString(10), user2_deposited_amount.toString(10));

    //     // 查询存款后用户和合约BTC数量
    //     let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
    //     let user2_BTC1 = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC1 is : ", user2_BTC1.toString(10));
    //     let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));
    //     // let gasUsed = tx.receipt.gasUsed;
    //     // console.log('Gas used:', gasUsed.toString());
    //     // let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));

    //     // let gasUsed1 = tx1.receipt.gasUsed;
    //     // console.log('Gas used1:', gasUsed1.toString());
    //     // let gas1 = BigNumber(gasPrice).times(BigNumber(gasUsed1));

    //     // let gasUsed2 = tx2.receipt.gasUsed;
    //     // console.log('Gas used2:', gasUsed2.toString());
    //     // let gas2 = BigNumber(gasPrice).times(BigNumber(gasUsed2));
    //     // let diff = BigNumber(Math.abs(user1_BTC.minus(user1_BTC1).minus(minAllowed.times(2)).minus(gas.plus(gas1))));
    //     // console.log("diff is : ", diff.toString(10));
    //     // chai.assert.isTrue(diff < 100, 'Absolute difference should be less than 100');
    //     // let diff1 = BigNumber(Math.abs(user2_BTC.minus(user2_BTC1).minus(minAllowed).minus(gas2)));
    //     // console.log("diff1 is : ", diff1.toString(10));
    //     // chai.assert.isTrue(diff1 < 100, 'Absolute difference should be less than 100');

    //     assert.strictEqual(BigNumber(user1_deposited_amount).plus(user2_deposited_amount).toString(10), carnival_BTC1.minus(carnival_BTC).toString(10));
    //     // check totalBTCDeposited
    //     assert.strictEqual(BigNumber(await bTCL2NativeStakeStoneCarnival.totalBTCDeposited()).toString(10), carnival_BTC1.toString(10));

    // });

    // it("test3_user1 deposit for user2_force terminate_user2 withdraw BTC", async () => {
    //     // 部署bTCL2NativeStakeStoneCarnival合约
    //     let bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
    //     let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
    //     // 查询用户和合约BTC数量
    //     let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC is : ", user1_BTC.toString(10));
    //     let user2_BTC = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC is : ", user2_BTC.toString(10));
    //     let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC is : ", carnival_BTC.toString(10));

    //     // 用户进行存款操作
    //     let tx = await bTCL2NativeStakeStoneCarnival.depositFor(user2, { from: user1, value: minAllowed });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    //     let user2_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user2);
    //     console.log("user2_deposited_amount is : ", user2_deposited_amount.toString(10));
    //     assert.strictEqual(user1_deposited_amount.toString(10), '0');
    //     assert.strictEqual(user2_deposited_amount.toString(10), BigNumber(minAllowed).toString(10));

    //     // 查询存款后用户和合约BTC数量
    //     let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
    //     let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));
    //     let user2_BTC1 = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC1 is : ", user2_BTC1.toString(10));

    //     // let gasUsed = tx.receipt.gasUsed;
    //     // console.log('Gas used:', gasUsed.toString());
    //     // let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     // let diff = BigNumber(Math.abs(user1_BTC.minus(user1_BTC1).minus(minAllowed).minus(gas)));
    //     // console.log("diff is : ", diff.toString(10));
    //     // chai.assert.isTrue(diff < 100, 'Absolute difference should be less than 100');

    //     assert.strictEqual(BigNumber(minAllowed).toString(10), carnival_BTC1.minus(carnival_BTC).toString(10));
    //     assert.strictEqual(user2_BTC.minus(user2_BTC1).toString(10), '0');

    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.forceTerminate({ from: deployer }),
    //         truffleAssert.ErrorType.REVERT,
    //         "deposit not paused"
    //     );
    //     //deposit paused
    //     await bTCL2NativeStakeStoneCarnival.pauseDeposit({ from: deployer });
    //     // force terminate
    //     await bTCL2NativeStakeStoneCarnival.forceTerminate({ from: deployer });
    //     assert.strictEqual(await bTCL2NativeStakeStoneCarnival.depositPaused(), true);
    //     assert.strictEqual(await bTCL2NativeStakeStoneCarnival.terminated(), true);
    //     assert.strictEqual(await bTCL2NativeStakeStoneCarnival.isExec(), false);

    //     //也会消耗gas
    //     // // user1 withdraw BTC
    //     // await truffleAssert.fails(
    //     //     bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user1 }),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "not deposit"
    //     // );

    //     // user2 withdraw BTC
    //     let tx1 = await bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user2 });
    //     // 取款后用户和合约BTC数量

    //     let user1_BTC2 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC2 is : ", user1_BTC2.toString(10));
    //     let carnival_BTC2 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC2 is : ", carnival_BTC2.toString(10));
    //     let user2_BTC2 = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC2 is : ", user2_BTC2.toString(10));
    //     assert.strictEqual(user1_BTC1.toString(10), user1_BTC2.toString(10));
    //     assert.strictEqual(carnival_BTC2.toString(10), '0');

    //     // gasUsed = tx1.receipt.gasUsed;
    //     // console.log('Gas used:', gasUsed.toString());
    //     // gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     // diff = BigNumber(Math.abs(minAllowed.minus(user2_BTC2.minus(user2_BTC)).minus(gas)));
    //     // console.log("diff is : ", diff.toString(10));
    //     // chai.assert.isTrue(diff < 100, 'Absolute difference should be less than 100');

    // });

    // it("test4_user1 deposit twice and user2 deposit once BTC_pause deposit_set addr_make deposit_fail to withdraw BTC_withdrawLP", async () => {

    //     // 部署bTCL2NativeStakeStoneCarnival合约
    //     bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
    //     let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
    //     // 查询用户和合约BTC数量
    //     let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC is : ", user1_BTC.toString(10));
    //     let user2_BTC = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC is : ", user2_BTC.toString(10));

    //     let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC is : ", carnival_BTC.toString(10));

    //     // 用户进行存款操作
    //     await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });
    //     await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });
    //     await bTCL2NativeStakeStoneCarnival.deposit({ from: user2, value: minAllowed });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    //     let user2_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user2);
    //     console.log("user2_deposited_amount is : ", user2_deposited_amount.toString(10));

    //     // 查询存款后用户和合约BTC数量
    //     let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
    //     let user2_BTC1 = BigNumber(await web3.eth.getBalance(user2));
    //     console.log("user2_BTC1 is : ", user2_BTC1.toString(10));
    //     let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));

    //     // pause deposit
    //     await bTCL2NativeStakeStoneCarnival.pauseDeposit({ from: deployer });

    //     // make deposit
    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.makeDeposit({ from: deployer }),
    //         truffleAssert.ErrorType.REVERT,
    //         "vault not set"
    //     );
    //     await bTCL2NativeStakeStoneCarnival.setAddrs(vaultAddr, lpAddr, { from: deployer });

    //     let mintAmount = BigNumber(await bTCL2NativeStakeStoneCarnival.makeDeposit.call({ from: deployer }));

    //     await bTCL2NativeStakeStoneCarnival.makeDeposit({ from: deployer });

    //     console.log("mintAmount is : ", mintAmount.toString(10));
    //     let lp_carnival = BigNumber(await lpToken.balanceOf(bTCL2NativeStakeStoneCarnival.address));
    //     console.log("lp_carnival is : ", lp_carnival.toString(10));

    //     // check carnival_BTC, vaultAddr 和lpAddr
    //     let carnival_BTC2 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC2 is : ", carnival_BTC2.toString(10));

    //     let vault_BTCAmount = await web3.eth.getBalance(vaultAddr);
    //     console.log("vault_BTCAmount is : ", vault_BTCAmount.toString(10));

    //     assert.strictEqual(carnival_BTC2.toString(10), '0');
    //     assert.strictEqual(vault_BTCAmount.toString(10), carnival_BTC1.toString(10));

    //     // fail to withdraw btc
    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user1 }),
    //         truffleAssert.ErrorType.REVERT,
    //         "not terminated"
    //     );
    //     await bTCL2NativeStakeStoneCarnival.forceTerminate({ from: deployer });
    //     // fail to withdraw btc
    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user1 }),
    //         truffleAssert.ErrorType.REVERT,
    //         "already exec"
    //     );
    //     // withdrawLP
    //     let finalLpAmount = BigNumber(await bTCL2NativeStakeStoneCarnival.finalLpAmount());
    //     assert.strictEqual(finalLpAmount.toString(10), mintAmount.toString(10));

    //     await bTCL2NativeStakeStoneCarnival.withdrawLP({ from: user1 });
    //     let lp_user1 = BigNumber(await lpToken.balanceOf(user1));
    //     await bTCL2NativeStakeStoneCarnival.withdrawLP({ from: user2 });
    //     let lp_user2 = BigNumber(await lpToken.balanceOf(user2));

    //     let totalBTCDeposited = BigNumber(await bTCL2NativeStakeStoneCarnival.totalBTCDeposited());
    //     let expect_user1_lp = BigNumber(minAllowed).times(2).div(totalBTCDeposited).times(finalLpAmount);
    //     let expect_user2_lp = BigNumber(minAllowed.div(totalBTCDeposited).times(finalLpAmount));

    //     //2500000000000000.02
    //     assert.strictEqual(lp_user1.toString(10), expect_user1_lp.integerValue().toString(10));
    //     assert.strictEqual(lp_user2.toString(10), expect_user2_lp.integerValue().toString(10));
    //     assert.strictEqual(await bTCL2NativeStakeStoneCarnival.isWithdrawn(user1), true);
    //     assert.strictEqual(await bTCL2NativeStakeStoneCarnival.isWithdrawn(user2), true);

    //     console.log("test 4 pass")

    // });

    // it("test5_user1 deposit BTC_pause deposit_terminate_fail to make deposit_user fail to withdrawLP(not exec)_user withdraw BTC", async () => {
    //     // 部署bTCL2NativeStakeStoneCarnival合约
    //     bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
    //     let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
    //     // 查询用户和合约BTC数量
    //     let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC is : ", user1_BTC.toString(10));
    //     let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC is : ", carnival_BTC.toString(10));

    //     // 用户进行存款操作
    //     let tx = await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);

    //     // 查询存款后用户和合约BTC数量
    //     let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
    //     let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));

    //     // pause deposit
    //     await bTCL2NativeStakeStoneCarnival.pauseDeposit({ from: deployer });
    //     await bTCL2NativeStakeStoneCarnival.forceTerminate({ from: deployer });
    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.makeDeposit({ from: deployer }),
    //         truffleAssert.ErrorType.REVERT,
    //         "terminated"
    //     );
    //     // await truffleAssert.fails(
    //     //     bTCL2NativeStakeStoneCarnival.withdrawLP({ from: user1 }),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "not exec"
    //     // );
    //     let tx1 = await bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user1 });

    //     let user1_BTC2 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC2 is : ", user1_BTC2.toString());
    //     // let gasUsed = tx.receipt.gasUsed;
    //     // console.log('Gas used:', gasUsed.toString());
    //     // let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));

    //     // let gasUsed1 = tx1.receipt.gasUsed;
    //     // console.log('Gas used1:', gasUsed1.toString());
    //     // let gas1 = BigNumber(gasPrice).times(BigNumber(gasUsed1));

    //     // let diff = BigNumber(Math.abs(user1_BTC.minus(user1_BTC2).minus(gas).minus(gas1)));
    //     // console.log("diff is : ", diff.toString(10));
    //     // chai.assert.isTrue(diff < 100, 'Absolute difference should be less than 100');
    //     let carnival_BTC2 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC2 is : ", carnival_BTC2.toString(10));
    //     assert.strictEqual(carnival_BTC2.toString(10), '0');
    // });
    // it("test6_user1 deposit BTC_pause deposit_make deposit_terminate_ensure user1 can only withdrawlp once", async () => {
    //     // 部署bTCL2NativeStakeStoneCarnival合约
    //     bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
    //     let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
    //     // 查询用户和合约BTC数量
    //     let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC is : ", user1_BTC.toString(10));
    //     let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC is : ", carnival_BTC.toString(10));

    //     // 用户进行存款操作
    //     let tx = await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));

    //     // 查询存款后用户和合约BTC数量
    //     let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
    //     let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));

    //     // pause deposit
    //     let deploybal = BigNumber(await web3.eth.getBalance(deployer));
    //     console.log("deploybal is : ", deploybal.toString(10));
    //     await bTCL2NativeStakeStoneCarnival.pauseDeposit({ from: deployer });
    //     let deploybal1 = BigNumber(await web3.eth.getBalance(deployer));
    //     console.log("deploybal1 is : ", deploybal1.toString(10));
    //     await bTCL2NativeStakeStoneCarnival.forceTerminate({ from: deployer });
    //     let deploybal2 = BigNumber(await web3.eth.getBalance(deployer));
    //     console.log("deploybal2 is : ", deploybal2.toString(10));
    //     let tx1 = await bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user1 });

    //     let user1_BTC2 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC2 is : ", user1_BTC2.toString(10));

    //     // let gasUsed = tx.receipt.gasUsed;
    //     // let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     // console.log('Gas used1:', gas.toString());

    //     // let gasUsed1 = tx1.receipt.gasUsed;
    //     // let gas1 = BigNumber(gasPrice).times(BigNumber(gasUsed1));
    //     // console.log('Gas used1:', gas1.toString());

    //     // let diff = BigNumber(Math.abs(user1_BTC.minus(user1_BTC2).minus(gas).minus(gas1)));
    //     // console.log("diff is : ", diff.toString(10));
    //     // chai.assert.isTrue(diff < 100, 'Absolute difference should be less than 100');

    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.withdrawBTC({ from: user1 }),
    //         truffleAssert.ErrorType.REVERT,
    //         "already withdrawn"
    //     );
    // });
    // it("test7_user1 deposit BTC_pause deposit_make deposit twice", async () => {
    //     // 部署bTCL2NativeStakeStoneCarnival合约
    //     bTCL2NativeStakeStoneCarnival = await BTCL2NativeStakeStoneCarnival.new(minAllowed, { from: deployer });
    //     let bTCL2NativeStakeStoneCarnivalAddr = bTCL2NativeStakeStoneCarnival.address;
    //     // 查询用户和合约BTC数量
    //     let user1_BTC = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC is : ", user1_BTC.toString(10));
    //     let carnival_BTC = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC is : ", carnival_BTC.toString(10));

    //     // 用户进行存款操作
    //     await bTCL2NativeStakeStoneCarnival.deposit({ from: user1, value: minAllowed });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2NativeStakeStoneCarnival.btcDeposited(user1);

    //     // 查询存款后用户和合约BTC数量
    //     let user1_BTC1 = BigNumber(await web3.eth.getBalance(user1));
    //     console.log("user1_BTC1 is : ", user1_BTC1.toString(10));
    //     let carnival_BTC1 = BigNumber(await web3.eth.getBalance(bTCL2NativeStakeStoneCarnivalAddr));
    //     console.log("carnival_BTC1 is : ", carnival_BTC1.toString(10));

    //     // pause deposit
    //     await bTCL2NativeStakeStoneCarnival.pauseDeposit({ from: deployer });
    //     await bTCL2NativeStakeStoneCarnival.setAddrs(vaultAddr, lpAddr, { from: deployer });
    //     await bTCL2NativeStakeStoneCarnival.makeDeposit({ from: deployer });
    //     await truffleAssert.fails(
    //         bTCL2NativeStakeStoneCarnival.makeDeposit({ from: deployer }),
    //         truffleAssert.ErrorType.REVERT,
    //         "already exec"
    //     );
    //     await bTCL2NativeStakeStoneCarnival.forceTerminate({ from: deployer });

    //     await bTCL2NativeStakeStoneCarnival.withdrawLP({ from: user1 });
    //     let lp_user1 = BigNumber(await lpToken.balanceOf(user1));
    //     console.log(" user1 lp : ", lp_user1.toString(10));

    // });
});
