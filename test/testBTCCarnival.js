const BTCL2StakeStoneCarnival = artifacts.require("BTCL2StakeStoneCarnival");
const MockToken = artifacts.require("MockToken");
const BigNumber = require('bignumber.js');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const IERC20 = artifacts.require("IERC20");

contract("test BTC carnival", async ([deployer, user1, user2, user3, vaultAddr]) => {

    let bTCL2StakeStoneCarnival, mBTCAddr, mBTCToken, minAllowed, lpToken, lpAddr;

    beforeEach(async () => {
        minAllowed = new BigNumber(25e14);

        // 部署MockToken合约
        const TOKEN1 = {
            "name": "mBTCToken",
            "symbol": "mBTC",
            "supply": "10000000000000000000000",
        }
        const TOKEN2 = {
            "name": "lpToken",
            "symbol": "lpToken",
            "supply": "10000000000000000000000",
        }
        mBTCToken = await MockToken.new(TOKEN1.name, TOKEN1.symbol, { gas: "1000000", gasPrice: "7000000000" });
        lpToken = await MockToken.new(TOKEN2.name, TOKEN2.symbol, { gas: "1000000", gasPrice: "7000000000" });

        // 向不同账户分发测试代币
        await mBTCToken.mint(deployer, BigNumber(TOKEN1.supply).div(BigNumber(4)));
        await mBTCToken.mint(user1, BigNumber(TOKEN1.supply).div(BigNumber(4)));
        await mBTCToken.mint(user2, BigNumber(TOKEN1.supply).div(BigNumber(4)));
        await mBTCToken.mint(user3, BigNumber(TOKEN1.supply).div(BigNumber(4)));

        mBTCAddr = mBTCToken.address;
        lpAddr = lpToken.address;

    });

    // it("test1_user1 deposit mBTC", async () => {
    //     // 部署BTCL2StakeStoneCarnival合约
    //     bTCL2StakeStoneCarnival = await BTCL2StakeStoneCarnival.new(mBTCAddr, minAllowed);
    //     let mBTCCarnivalAddr = bTCL2StakeStoneCarnival.address;
    //     // 查询用户和合约mbtc数量
    //     let user1_mBTC = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC is : ", user1_mBTC.toString(10));
    //     let carnival_mBTC = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC is : ", carnival_mBTC.toString(10));

    //     // 为用户授权代币转移
    //     await mBTCToken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user1 });

    //     // 用户进行存款操作
    //     await bTCL2StakeStoneCarnival.deposit(minAllowed, { from: user1 });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    //     assert.strictEqual(user1_deposited_amount.toString(10), BigNumber(minAllowed).toString(10));

    //     // 查询存款后用户和合约mbtc数量
    //     let user1_mBTC1 = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC1 is : ", user1_mBTC1.toString(10));
    //     let carnival_mBTC1 = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC1 is : ", carnival_mBTC1.toString(10));

    //     assert.strictEqual(user1_mBTC.minus(user1_mBTC1).toString(10), BigNumber(minAllowed).toString(10));
    //     assert.strictEqual(user1_mBTC.minus(user1_mBTC1).toString(10), carnival_mBTC1.minus(carnival_mBTC).toString(10));

    // });

    // it("test2_user1 deposit twice and user2 deposit once mBTC", async () => {
    //     // 部署BTCL2StakeStoneCarnival合约
    //     bTCL2StakeStoneCarnival = await BTCL2StakeStoneCarnival.new(mBTCAddr, minAllowed);
    //     let mBTCCarnivalAddr = bTCL2StakeStoneCarnival.address;
    //     // 查询用户和合约mbtc数量
    //     let user1_mBTC = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC is : ", user1_mBTC.toString(10));
    //     let user2_mBTC = BigNumber(await mBTCToken.balanceOf(user2));
    //     console.log("user2_mBTC is : ", user2_mBTC.toString(10));

    //     let carnival_mBTC = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC is : ", carnival_mBTC.toString(10));

    //     // 为用户授权代币转移
    //     await mBTCToken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user1 });
    //     await mBTCToken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user2 });

    //     // 用户进行存款操作
    //     await bTCL2StakeStoneCarnival.deposit(minAllowed, { from: user1 });
    //     await bTCL2StakeStoneCarnival.deposit(minAllowed, { from: user1 });
    //     await bTCL2StakeStoneCarnival.deposit(user2_mBTC, { from: user2 });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    //     let user2_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user2);
    //     console.log("user2_deposited_amount is : ", user2_deposited_amount.toString(10));

    //     assert.strictEqual(user1_deposited_amount.toString(10), BigNumber(minAllowed).times(2).toString(10));
    //     assert.strictEqual(user2_deposited_amount.toString(10), user2_mBTC.toString(10));

    //     // 查询存款后用户和合约mbtc数量
    //     let user1_mBTC1 = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC1 is : ", user1_mBTC1.toString(10));
    //     let user2_mBTC1 = BigNumber(await mBTCToken.balanceOf(user2));
    //     console.log("user2_mBTC1 is : ", user2_mBTC1.toString(10));
    //     let carnival_mBTC1 = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC1 is : ", carnival_mBTC1.toString(10));

    //     assert.strictEqual(user1_mBTC.minus(user1_mBTC1).toString(10), BigNumber(minAllowed).times(2).toString(10));
    //     assert.strictEqual(user2_mBTC.minus(user2_mBTC1).toString(10), user2_mBTC.toString(10));

    //     assert.strictEqual(BigNumber(minAllowed).times(2).plus(user2_mBTC).toString(10), carnival_mBTC1.minus(carnival_mBTC).toString(10));
    //     // check totalBTCDeposited
    //     assert.strictEqual(BigNumber(await bTCL2StakeStoneCarnival.totalBTCDeposited()).toString(10), carnival_mBTC1.toString(10));

    // });

    // it("test3_user1 deposit for user3_force terminate_user3 withdraw mBTC", async () => {
    //     // 部署BTCL2StakeStoneCarnival合约
    //     bTCL2StakeStoneCarnival = await BTCL2StakeStoneCarnival.new(mBTCAddr, minAllowed);
    //     let mBTCCarnivalAddr = bTCL2StakeStoneCarnival.address;
    //     // 查询用户和合约mbtc数量
    //     let user1_mBTC = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC is : ", user1_mBTC.toString(10));
    //     let user3_mBTC = BigNumber(await mBTCToken.balanceOf(user3));
    //     console.log("user3_mBTC is : ", user3_mBTC.toString(10));
    //     let carnival_mBTC = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC is : ", carnival_mBTC.toString(10));

    //     // 为用户授权代币转移
    //     await mBTCToken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user1 });

    //     // 用户进行存款操作
    //     await bTCL2StakeStoneCarnival.depositFor(user3, minAllowed, { from: user1 });

    //     // 获取用户存款数量
    //     let user1_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user1);
    //     console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    //     let user3_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user3);
    //     console.log("user3_deposited_amount is : ", user3_deposited_amount.toString(10));
    //     assert.strictEqual(user1_deposited_amount.toString(10), '0');
    //     assert.strictEqual(user3_deposited_amount.toString(10), BigNumber(minAllowed).toString(10));

    //     // 查询存款后用户和合约mbtc数量
    //     let user1_mBTC1 = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC1 is : ", user1_mBTC1.toString(10));
    //     let carnival_mBTC1 = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC1 is : ", carnival_mBTC1.toString(10));
    //     let user3_mBTC1 = BigNumber(await mBTCToken.balanceOf(user3));
    //     console.log("user3_mBTC1 is : ", user3_mBTC1.toString(10));
    //     assert.strictEqual(user1_mBTC.minus(user1_mBTC1).toString(10), BigNumber(minAllowed).toString(10));
    //     assert.strictEqual(user1_mBTC.minus(user1_mBTC1).toString(10), carnival_mBTC1.minus(carnival_mBTC).toString(10));
    //     assert.strictEqual(user3_mBTC.minus(user3_mBTC1).toString(10), '0');

    //     await truffleAssert.fails(
    //         bTCL2StakeStoneCarnival.forceTerminate({ from: deployer }),
    //         truffleAssert.ErrorType.REVERT,
    //         "deposit not paused"
    //     );
    //     //deposit paused
    //     await bTCL2StakeStoneCarnival.pauseDeposit({ from: deployer });
    //     // force terminate
    //     await bTCL2StakeStoneCarnival.forceTerminate({ from: deployer });
    //     assert.strictEqual(await bTCL2StakeStoneCarnival.depositPaused(), true);
    //     assert.strictEqual(await bTCL2StakeStoneCarnival.terminated(), true);
    //     assert.strictEqual(await bTCL2StakeStoneCarnival.isExec(), false);

    //     // user1 withdraw mbtc
    //     await truffleAssert.fails(
    //         bTCL2StakeStoneCarnival.withdrawBTC({ from: user1 }),
    //         truffleAssert.ErrorType.REVERT,
    //         "not deposit"
    //     );

    //     // user3 withdraw mbtc
    //     await bTCL2StakeStoneCarnival.withdrawBTC({ from: user3 });
    //     // 取款后用户和合约mbtc数量

    //     let user1_mBTC2 = BigNumber(await mBTCToken.balanceOf(user1));
    //     console.log("user1_mBTC2 is : ", user1_mBTC2.toString(10));
    //     let carnival_mBTC2 = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
    //     console.log("carnival_mBTC2 is : ", carnival_mBTC2.toString(10));
    //     let user3_mBTC2 = BigNumber(await mBTCToken.balanceOf(user3));
    //     console.log("user3_mBTC2 is : ", user3_mBTC2.toString(10));
    //     assert.strictEqual(user1_mBTC1.toString(10), user1_mBTC2.toString(10));
    //     assert.strictEqual(carnival_mBTC2.toString(10), '0');
    //     assert.strictEqual(user3_mBTC2.minus(user3_mBTC).toString(10), BigNumber(minAllowed).toString(10));

    // });

    it("test4_user1 deposit twice and user2 deposit once mBTC_pause deposit_set addr_make deposit_fail to withdraw mbtc_withdrawLP", async () => {
        // 部署BTCL2StakeStoneCarnival合约
        bTCL2StakeStoneCarnival = await BTCL2StakeStoneCarnival.new(mBTCAddr, minAllowed);
        let mBTCCarnivalAddr = bTCL2StakeStoneCarnival.address;
        // 查询用户和合约mbtc数量
        let user1_mBTC = BigNumber(await mBTCToken.balanceOf(user1));
        console.log("user1_mBTC is : ", user1_mBTC.toString(10));
        let user2_mBTC = BigNumber(await mBTCToken.balanceOf(user2));
        console.log("user2_mBTC is : ", user2_mBTC.toString(10));

        let carnival_mBTC = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
        console.log("carnival_mBTC is : ", carnival_mBTC.toString(10));

        // 为用户授权代币转移
        await mBTCToken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user1 });
        await mBTCToken.approve(mBTCCarnivalAddr, BigNumber(100000).times(1e18), { from: user2 });

        // 用户进行存款操作
        await bTCL2StakeStoneCarnival.deposit(minAllowed, { from: user1 });
        await bTCL2StakeStoneCarnival.deposit(minAllowed, { from: user1 });
        await bTCL2StakeStoneCarnival.deposit(user2_mBTC, { from: user2 });

        // 获取用户存款数量
        let user1_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user1);
        console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
        let user2_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user2);
        console.log("user2_deposited_amount is : ", user2_deposited_amount.toString(10));

        // 查询存款后用户和合约mbtc数量
        let user1_mBTC1 = BigNumber(await mBTCToken.balanceOf(user1));
        console.log("user1_mBTC1 is : ", user1_mBTC1.toString(10));
        let user2_mBTC1 = BigNumber(await mBTCToken.balanceOf(user2));
        console.log("user2_mBTC1 is : ", user2_mBTC1.toString(10));
        let carnival_mBTC1 = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
        console.log("carnival_mBTC1 is : ", carnival_mBTC1.toString(10));

        // pause deposit
        await bTCL2StakeStoneCarnival.pauseDeposit({ from: deployer });

        // make deposit
        await truffleAssert.fails(
            bTCL2StakeStoneCarnival.makeDeposit({ from: deployer }),
            truffleAssert.ErrorType.REVERT,
            "vault not set"
        );
        await bTCL2StakeStoneCarnival.setAddrs(vaultAddr, lpAddr, { from: deployer });
        await bTCL2StakeStoneCarnival.makeDeposit({ from: deployer });

        // check carnival_mBTC, vaultAddr 和lpAddr
        let carnival_mBTC2 = BigNumber(await mBTCToken.balanceOf(mBTCCarnivalAddr));
        console.log("carnival_mBTC2 is : ", carnival_mBTC2.toString(10));

        let vault_mBTCAmount = mBTCToken.balanceOf(vaultAddr);
        console.log("vault_mBTCAmount is : ", vault_mBTCAmount.toString(10));

        assert.strictEqual(carnival_mBTC2.toString(10), '0');
        assert.strictEqual(vault_mBTCAmount.toString(10), carnival_mBTC1.toString(10));

        // fail to withdraw btc
        await truffleAssert.fails(
            bTCL2StakeStoneCarnival.withdrawBTC({ from: user1 }),
            truffleAssert.ErrorType.REVERT,
            "already exec"
        );
        // withdrawLP
        await bTCL2StakeStoneCarnival.withdrawLP({ from: user1 });
        let lp_user1 = BigNumber(await lpToken.balanceOf(user1));
        await bTCL2StakeStoneCarnival.withdrawLP({ from: user2 });
        let lp_user2 = BigNumber(await lpToken.balanceOf(user2));

        let lpAmount = BigNumber(await lpToken.balanceOf(lpAddr));
        let finalLpAmount = BigNumber(await bTCL2StakeStoneCarnival.finalLpAmount());

        let totalBTCDeposited = BigNumber(await bTCL2StakeStoneCarnival.totalBTCDeposited());
        let mintAmount = BigNumber(await bTCL2StakeStoneCarnival.makeDeposit.call({ from: deployer }));
        let expect_user1_lp = BigNumber(minAllowed).times(2).div(totalBTCDeposited).times(mintAmount);
        let expect_user2_lp = BigNumber(user2_mBTC.div(totalBTCDeposited).times(mintAmount));

        assert.strictEqual(finalLpAmount.toString(10), lpAmount.toString(10));
        assert.strictEqual(lp_user1.toString(10), expect_user1_lp.toString(10));
        assert.strictEqual(lp_user2.toString(10), expect_user2_lp.toString(10));



    });

    it("test5_user1 deposit mBTC_pause deposit_terminate_fail to make deposit_user fail to withdrawLP(not exec)_user withdraw mBTC", async () => {

    });
    it("test6_user1 deposit mBTC_pause deposit_fail to make deposit_set vault_make deposit_terminate_ensure user1 can only withdrawlp once", async () => {

    });

});
