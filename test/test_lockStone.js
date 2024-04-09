const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const RLP = require('rlp');
const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
// const StoneCarnival = artifacts.require("StoneCarnival");
const StoneCarnival = artifacts.require("MockStoneCarnival");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const withdrawFeeRate = 0;
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');
const TruffleConfig = require('../truffle-config');
const truffleAssert = require('truffle-assertions');

function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}
contract("test_StoneCarnival", async ([deployer, feeRecipient, taker3, taker4, taker1, taker2]) => {
    // const PERCENTAGE = BigNumber(1).times(1e4);
    const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
    console.log('Gas price:', gasPrice.toString());
    const ONE_HUNDRED_PERCENT = 1e6;
    const MULTIPLIER = 1e18;
    const minDeposit = BigNumber(1).times(1e17);
    const cap = BigNumber(100000).times(1e18);
    const DECIMALS = 1e18;
    const minStoneAllowed = 1e15;
    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const rs = web3.utils.sha3(encoded);
        return '0x' + rs.substr(rs.length - 40, 40);
    }
    let stoneVault, proposal, minter, assetsVaultAddr, strategyController, strategyAAddr, strategyBAddr, stone, proposalAddr, currentTime, mockNullStrategyA, mockNullStrategyB;

    beforeEach(async () => {

        const minterAddr = await getFutureAddr(1);
        console.log("minterAddr: ", minterAddr);
        const layerzeroEndpoint = "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23";
        stone = await Stone.new(minterAddr, layerzeroEndpoint, cap);
        console.log("stone: ", stone.address);

        const stoneVaultAddr = await getFutureAddr(1);
        console.log("stoneVaultAddr: ", stoneVaultAddr);

        minter = await Minter.new(stone.address, stoneVaultAddr);
        console.log("minter: ", minter.address);

        assetsVaultAddr = await getFutureAddr(2);
        console.log("assetsVaultAddr: ", assetsVaultAddr);

        strategyAAddr = await getFutureAddr(3);
        strategyBAddr = await getFutureAddr(4);
        console.log("strategyAAddr: ", strategyAAddr);
        console.log("strategyBAddr: ", strategyBAddr);
        proposalAddr = await getFutureAddr(1);
        console.log("proposalAddr: ", proposalAddr);
        currentTime = Math.floor(Date.now() / 1000);
        stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            currentTime,
            [strategyAAddr, strategyBAddr],
            [5e5, 5e5]
        );
        console.log("stone address: ", stone.address);
        console.log("stoneVault address: ", stoneVault.address);
        proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);
        strategyController = await StrategyController.at(strategyControllerAddr);
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

    });

    // it("test1_user deposit stone", async () => {

    //     const eth_deposit_amount = BigNumber(20).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker2
    //     });

    //     let stone_deposit = BigNumber(10).times(MULTIPLIER);
    //     await stoneCarnival.depositStone(stone_deposit.toString(), {
    //         from: taker1
    //     });
    //     user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_1 is : ", user1Stone_1.toString(10));
    //     assert.strictEqual(user1Stone_1.toString(), user1Stone.minus(stone_deposit).toString());

    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     assert.strictEqual(stone_stoneCarnival.toString(10), stone_deposit.toString());
    // });

    // it("test4_user deposit stone for other", async () => {

    //     const eth_deposit_amount = BigNumber(20).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker2
    //     });

    //     let stone_deposit = BigNumber(10).times(MULTIPLIER);
    //     await stoneCarnival.depositStoneFor(taker2, stone_deposit.toString(), {
    //         from: taker1
    //     });
    //     user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
    //     assert.strictEqual(user1Stone_2.toString(), user1Stone.minus(stone_deposit).toString());
    //     user2Stone_2 = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_2 is : ", user2Stone_2.toString(10));
    //     assert.strictEqual(user2Stone.toString(), user2Stone_2.toString());

    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     assert.strictEqual(stone_stoneCarnival.toString(10), stone_deposit.toString());

    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));
    //     assert.strictEqual(user1_cStone.toString(10), "0");
    //     user2_cStone = BigNumber(await cSTONE.balanceOf(taker2));
    //     console.log("user2_cStone is : ", user2_cStone.toString(10));
    //     assert.strictEqual(user2_cStone.toString(10), stone_deposit.toString(10));
    // });

    // it("test5_user deposit stone_owner instant withdraw ETH", async () => {

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;

    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_1 is : ", user1Stone_1.toString(10));

    //     const eth_deposit_amount = BigNumber(10).times(1e18);
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(eth_deposit_amount.toString(), {
    //         from: taker1
    //     });

    //     bal_stoneCarnival = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("bal_stoneCarnival is : ", bal_stoneCarnival.toString(10));

    //     stone_stoneCarnival1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival1 is : ", stone_stoneCarnival1.toString(10));
    //     assert.strictEqual(stone_stoneCarnival1.minus(stone_stoneCarnival).toString(10), eth_deposit_amount.toString());

    //     assert.strictEqual(bal_stoneCarnival.toString(10), '0');
    //     user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
    //     //currently share price = 1
    //     assert.strictEqual(user1Stone_2.minus(user1Stone_1).toString(), "0");

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: deployer
    //     });

    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     let request_amount = BigNumber(10).times(MULTIPLIER);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     let balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", balance.toString());
    //     let freezerBalance = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("Before freezerBalance ether amount:", freezerBalance.toString());
    //     let price = await stoneVault.currentSharePrice.call();
    //     console.log("current share price is : ", price.toString());
    //     let tx = await stoneCarnival.withdrawETH(request_amount.times(price).div(1e18).toString(),
    //         {
    //             from: deployer
    //         });
    //     const gasUsed = tx.receipt.gasUsed;
    //     console.log('Gas used:', gasUsed.toString());
    //     let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     let balance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", balance1.toString());
    //     assert.strictEqual(balance.toString(), balance1.toString());

    //     let freezerBalance1 = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("After freezerBalance ether amount:", freezerBalance1.toString());

    //     let stoneVaultBalance = BigNumber(await web3.eth.getBalance(stoneVault.address));
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     let assetsVaultBalance = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), "0");
    //     assert.strictEqual(assetsVaultBalance.toString(), "0");

    //     assert.strictEqual(freezerBalance1.minus(freezerBalance).toString(), request_amount.toString());
    //     stone_stoneCarnival2 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival2 is : ", stone_stoneCarnival2.toString(10));
    //     assert.strictEqual(stone_stoneCarnival2.toString(10), "0");

    //     user1_cStone1 = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone1 is : ", user1_cStone1.toString(10));
    //     assert.strictEqual(user1_cStone.toString(10), user1_cStone1.toString(10));
    // });

    // it("test6_makeRequest_cancelWithdraw", async () => {
    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;

    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_1 is : ", user1Stone_1.toString(10));

    //     const eth_deposit_amount = BigNumber(10).times(1e18);
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(eth_deposit_amount.toString(), {
    //         from: taker1
    //     });

    //     bal_stoneCarnival = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("bal_stoneCarnival is : ", bal_stoneCarnival.toString(10));

    //     stone_stoneCarnival1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival1 is : ", stone_stoneCarnival1.toString(10));
    //     assert.strictEqual(stone_stoneCarnival1.minus(stone_stoneCarnival).toString(10), eth_deposit_amount.toString());

    //     assert.strictEqual(bal_stoneCarnival.toString(10), '0');
    //     user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
    //     //currently share price = 1
    //     assert.strictEqual(user1Stone_2.minus(user1Stone_1).toString(), "0");

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: deployer
    //     });

    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     let request_amount = BigNumber(10).times(MULTIPLIER);
    //     // cancel before rollToNext
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     await stoneCarnival.cancelWithdraw(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await truffleAssert.fails(
    //         stoneCarnival.withdrawETH(request_amount.toString(),
    //             {
    //                 from: deployer
    //             }),
    //         truffleAssert.ErrorType.REVERT,
    //         "exceed withdrawable"
    //     );
    //     // cancel after rollToNext

    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     await truffleAssert.fails(
    //         stoneCarnival.cancelWithdraw(request_amount.toString(),
    //             {
    //                 from: deployer
    //             }),
    //         truffleAssert.ErrorType.REVERT,
    //         "no pending withdraw"
    //     );
    //     await stoneCarnival.withdrawETH(request_amount.toString(),
    //         {
    //             from: deployer
    //         }
    //     );
    //     let freezerBalance = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("After freezerBalance ether amount:", freezerBalance.toString());
    //     assert.strictEqual(freezerBalance.toString(), request_amount.toString());

    // });


    // it("test7_user deposit ETH_owner withdraw ETH_makeDeposit", async () => {

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;

    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_1 is : ", user1Stone_1.toString(10));

    //     const eth_deposit_amount = BigNumber(10).times(1e18);
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(eth_deposit_amount.toString(), {
    //         from: taker1
    //     });

    //     bal_stoneCarnival = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("bal_stoneCarnival is : ", bal_stoneCarnival.toString(10));

    //     stone_stoneCarnival1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival1 is : ", stone_stoneCarnival1.toString(10));
    //     assert.strictEqual(stone_stoneCarnival1.minus(stone_stoneCarnival).toString(10), eth_deposit_amount.toString());

    //     assert.strictEqual(bal_stoneCarnival.toString(10), '0');
    //     user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
    //     //currently share price = 1
    //     assert.strictEqual(user1Stone_2.minus(user1Stone_1).toString(), "0");

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: deployer
    //     });

    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     let request_amount = BigNumber(10).times(MULTIPLIER);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     let balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", balance.toString());
    //     let freezerBalance = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("Before freezerBalance ether amount:", freezerBalance.toString());

    //     await stoneCarnival.withdrawETH(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await truffleAssert.fails(
    //         stoneCarnival.makeDeposit(request_amount.plus(1).toString(),
    //             {
    //                 from: deployer
    //             }),
    //         truffleAssert.ErrorType.REVERT,
    //         "ether not enough"
    //     );
    //     stone_stoneCarnival2 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival2 is : ", stone_stoneCarnival2.toString(10));

    //     let assetsVaultBal = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
    //     console.log("Before makeDeposit_assetVault ether amount:", assetsVaultBal.toString());
    //     let tx = await stoneCarnival.makeDeposit(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     stone_stoneCarnival3 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival3 is : ", stone_stoneCarnival3.toString(10));
    //     assert.strictEqual(stone_stoneCarnival3.minus(stone_stoneCarnival2).toString(), request_amount.toString());

    //     let assetsVaultBal1 = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
    //     console.log("After makeDeposit_assetVault ether amount:", assetsVaultBal1.toString());
    //     assert.strictEqual(assetsVaultBal1.minus(assetsVaultBal).toString(), request_amount.toString());

    // });

    // it("test8_user deposit ETH_user withdrawStone", async () => {

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     const stone_deposit = BigNumber(10).times(1e18);
    //     await stoneVault.deposit({
    //         value: stone_deposit,
    //         from: taker1
    //     });
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(stone_deposit.toString(), {
    //         from: taker1
    //     });

    //     stoneCarnival_stone = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stoneCarnival_stone is : ", stoneCarnival_stone.toString(10));
    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));
    //     user1_stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1_stone is : ", user1_stone.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     await stoneCarnival.forceTerminate({ from: deployer });
    //     let balance = BigNumber(await web3.eth.getBalance(taker1));
    //     let tx = await stoneCarnival.withdrawStone({ from: taker1 });

    //     const gasUsed = tx.receipt.gasUsed;
    //     console.log('Gas used:', gasUsed.toString());
    //     let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     let balance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After withdrae taker1 ether amount:", balance1.toString());
    //     assert.isTrue(Math.abs(balance.minus(balance1).minus(gas)) < 10, 'Absolute difference should be less than 10');

    //     stoneCarnival_stone1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stoneCarnival_stone1 is : ", stoneCarnival_stone1.toString(10));

    //     user1_cStone1 = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone1 is : ", user1_cStone1.toString(10));
    //     user1_stone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1_stone1 is : ", user1_stone1.toString(10));

    //     assert.strictEqual(stoneCarnival_stone.minus(stoneCarnival_stone1).toString(), stone_deposit.toString());
    //     assert.strictEqual(user1_cStone.minus(user1_cStone1).toString(), stone_deposit.toString());
    //     assert.strictEqual(user1_stone1.minus(user1_stone).toString(), stone_deposit.toString());

    // });
    // it("test9_user deposit stone multiple times_owner withdraw ETH multiple times", async () => {
    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;

    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_1 is : ", user1Stone_1.toString(10));

    //     const eth_deposit_amount = BigNumber(30).times(1e18);
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(eth_deposit_amount.div(3).toString(), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(eth_deposit_amount.div(3).toString(), {
    //         from: taker1
    //     });

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: deployer
    //     });

    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     await stoneCarnival.depositStone(eth_deposit_amount.div(3).toString(), {
    //         from: taker1
    //     });
    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     let request_amount = BigNumber(10).times(MULTIPLIER);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     let balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", balance.toString());
    //     let freezerBalance = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("Before freezerBalance ether amount:", freezerBalance.toString());

    //     await stoneCarnival.withdrawETH(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.withdrawETH(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     await stoneCarnival.withdrawETH(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     stone_stoneCarnival2 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival2 is : ", stone_stoneCarnival2.toString(10));

    //     let assetsVaultBal = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
    //     console.log("Before makeDeposit_assetVault ether amount:", assetsVaultBal.toString());
    //     let tx = await stoneCarnival.makeDeposit(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     let tx1 = await stoneCarnival.makeDeposit(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     let tx2 = await stoneCarnival.makeDeposit(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     stone_stoneCarnival3 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival3 is : ", stone_stoneCarnival3.toString(10));
    //     assert.strictEqual(stone_stoneCarnival3.minus(stone_stoneCarnival2).toString(), request_amount.times(3).toString());

    //     let assetsVaultBal1 = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
    //     console.log("After makeDeposit_assetVault ether amount:", assetsVaultBal1.toString());
    //     assert.strictEqual(assetsVaultBal1.minus(assetsVaultBal).toString(), request_amount.times(2).toString());

    // });
    // it("test10_user deposit stone_user withdrawStone", async () => {

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     const stone_deposit = BigNumber(10).times(1e18);
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: stone_deposit,
    //         from: taker1
    //     });

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(stone_deposit.toString(), {
    //         from: taker1
    //     });
    //     stoneCarnival_stone = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stoneCarnival_stone is : ", stoneCarnival_stone.toString(10));
    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));

    //     user1_stone0 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1_stone0 is : ", user1_stone0.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     await stoneCarnival.forceTerminate({ from: deployer });
    //     await stoneCarnival.withdrawStone({ from: taker1 });

    //     stoneCarnival_stone1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stoneCarnival_stone1 is : ", stoneCarnival_stone1.toString(10));

    //     user1_cStone1 = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone1 is : ", user1_cStone1.toString(10));
    //     user1_stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1_stone is : ", user1_stone.toString(10));
    //     assert.strictEqual(stoneCarnival_stone.minus(stoneCarnival_stone1).toString(), stone_deposit.toString());
    //     assert.strictEqual(user1_cStone.minus(user1_cStone1).toString(), stone_deposit.toString());
    //     assert.strictEqual(user1_stone.minus(user1_stone0).toString(), stone_deposit.toString());

    // });
    // it("test11_user deposit stone for multi times_user withdrawStone", async () => {

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     const stone_deposit = BigNumber(10).times(1e18);
    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: stone_deposit.times(3),
    //         from: taker1
    //     });

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(stone_deposit.toString(), {
    //         from: taker1
    //     });
    //     await stoneCarnival.depositStone(stone_deposit.times(2).toString(), {
    //         from: taker1
    //     });
    //     stoneCarnival_stone = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stoneCarnival_stone is : ", stoneCarnival_stone.toString(10));
    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));

    //     user1_stone0 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1_stone0 is : ", user1_stone0.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     await stoneCarnival.forceTerminate({ from: deployer });
    //     await stoneCarnival.withdrawStone({ from: taker1 });

    //     stoneCarnival_stone1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stoneCarnival_stone1 is : ", stoneCarnival_stone1.toString(10));

    //     user1_cStone1 = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone1 is : ", user1_cStone1.toString(10));
    //     user1_stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1_stone is : ", user1_stone.toString(10));
    //     assert.strictEqual(stoneCarnival_stone.minus(stoneCarnival_stone1).toString(), stone_deposit.times(3).toString());
    //     assert.strictEqual(user1_cStone.minus(user1_cStone1).toString(), stone_deposit.times(3).toString());
    //     assert.strictEqual(user1_stone.minus(user1_stone0).toString(), stone_deposit.times(3).toString());

    // });

    // it("test12_user1 deposit stone for user2_user2 withdraw stone", async () => {

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });

    //     await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     const eth_deposit_amount = BigNumber(20).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker2
    //     });

    //     let stone_deposit = BigNumber(10).times(MULTIPLIER);
    //     await stoneCarnival.depositStoneFor(taker2, stone_deposit.toString(), {
    //         from: taker1
    //     });
    //     user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
    //     assert.strictEqual(user1Stone_2.toString(), user1Stone.minus(stone_deposit).toString());
    //     user2Stone_2 = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_2 is : ", user2Stone_2.toString(10));
    //     assert.strictEqual(user2Stone.toString(), user2Stone_2.toString());

    //     stone_stoneCarnival = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("stone_stoneCarnival is : ", stone_stoneCarnival.toString(10));
    //     assert.strictEqual(stone_stoneCarnival.toString(10), stone_deposit.toString());

    //     user1_cStone = BigNumber(await cSTONE.balanceOf(taker1));
    //     console.log("user1_cStone is : ", user1_cStone.toString(10));
    //     assert.strictEqual(user1_cStone.toString(10), "0");
    //     user2_cStone = BigNumber(await cSTONE.balanceOf(taker2));
    //     console.log("user2_cStone is : ", user2_cStone.toString(10));
    //     assert.strictEqual(user2_cStone.toString(10), stone_deposit.toString(10));
    //     let startTime = BigNumber(await stoneCarnival.startTime());
    //     let lockPeriod = BigNumber(await stoneCarnival.lockPeriod());
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneCarnival.advanceTimeInterval(startTime.plus(lockPeriod));
    //     await time.advanceBlock();
    //     await stoneCarnival.terminate({ from: taker1 });
    //     await truffleAssert.fails(
    //         stoneCarnival.withdrawStone({ from: taker1 }),
    //         truffleAssert.ErrorType.REVERT,
    //         "zero amount"
    //     );
    //     await stoneCarnival.withdrawStone({ from: taker2 });
    //     user1Stone_3 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_3 is : ", user1Stone_3.toString(10));
    //     assert.strictEqual(user1Stone_3.toString(10), user1Stone_2.toString(10));
    //     user2Stone_3 = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_3 is : ", user2Stone_3.toString(10));
    //     assert.strictEqual(user2Stone_3.minus(user2Stone_2).toString(), stone_deposit.toString());

    // });
    it("test14_user deposit after the share price is less than 1ETH_user withdraw stone", async () => {

        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker3
        });
        const eth_deposit_amount = BigNumber(10).times(1e18);

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });

        await stoneVault.deposit({
            value: eth_deposit_amount.times(0.5),
            from: taker2
        });
        await stoneVault.deposit({
            value: eth_deposit_amount.times(1.5),
            from: taker3
        });
        // taker4 stone amount
        taker4Stone = eth_deposit_amount.times(0.3);
        await stone.transfer(taker4, taker4Stone, { from: taker1 });

        let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice is : ", sharePrice.toString(10));

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));

        let user3Stone = BigNumber(await stone.balanceOf(taker3));
        console.log("user3Stone is : ", user3Stone.toString(10));

        let user4Stone = BigNumber(await stone.balanceOf(taker4));
        console.log("user4Stone is : ", user4Stone.toString(10));

        await stoneVault.currentSharePrice.call();

        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound();

        // strategyA strategyB loss
        let interest = BigNumber(9e18);
        let interest1 = BigNumber(15e18);
        await mockNullStrategyA.mock_transfer(interest, {
            from: deployer
        })
        await mockNullStrategyB.mock_transfer(interest1, {
            from: deployer
        })
        let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
        console.log("strategyA_value is : ", strategyA_value.toString(10));
        assert.strictEqual(strategyA_value.toString(10), eth_deposit_amount.times(1.5).minus(interest).toString(10));

        let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
        console.log("strategyB_value is : ", strategyB_value.toString(10));
        assert.strictEqual(strategyB_value.toString(10), eth_deposit_amount.times(1.5).minus(interest1).toString(10));

        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice1 is : ", sharePrice.toString(10));
        assert.strictEqual(eth_deposit_amount.times(3).minus(interest).minus(interest1).div(eth_deposit_amount.times(3)).times(MULTIPLIER).integerValue().toString(10), sharePrice.toString(10));

        const stoneCarnival = await StoneCarnival.new(
            stone.address,
            stoneVault.address,
            cap,
            minStoneAllowed
        );
        console.log("stoneCarnival: ", stoneCarnival.address);
        cSTONEAddress = await stoneCarnival.address;
        let cSTONE = await StoneCarnival.at(cSTONEAddress);

        await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker3
        });
        await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker4
        });
        await stoneCarnival.depositStone(user3Stone.toString(), {
            from: taker3
        });
        await stoneCarnival.depositStone(user4Stone.toString(), {
            from: taker4
        });

        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound();

        await stoneCarnival.pauseDeposit({ from: deployer });
        let sharePrice2 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice2 is : ", sharePrice2.toString(10));

        let request_amount = user3Stone.plus(user4Stone);
        await stoneCarnival.makeRequest(request_amount.toString(),
            {
                from: deployer
            });
        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound();

        let balance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", balance.toString());
        let freezerBalance = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
        console.log("Before freezerBalance ether amount:", freezerBalance.toString());
        let withdraw_amount = user3Stone.plus(user4Stone).times(sharePrice2).div(MULTIPLIER);
        let userReceipt = await stoneVault.userReceipts(deployer);
        let withdrawableAmount = BigNumber(userReceipt.withdrawableAmount);
        console.log("withdrawableAmount is :", withdrawableAmount.toString(10));
        await stoneCarnival.withdrawETH(withdraw_amount.toString(),
            {
                from: deployer
            });
        await stoneCarnival.makeDeposit(withdraw_amount.toString(),
            {
                from: deployer
            });
        await stoneCarnival.forceTerminate({ from: deployer });
        await stoneCarnival.withdrawStone({ from: taker3 });
        let taker3_stone = BigNumber(await stone.balanceOf(taker3));
        await stoneCarnival.withdrawStone({ from: taker4 });
        let taker4_stone = BigNumber(await stone.balanceOf(taker4));

        console.log("taker3 stone : ", taker3_stone.toString(10));
        console.log("taker4 stone : ", taker4_stone.toString(10));

    });


    it("test15_user deposit before the share price is less than 1ETH_user withdraw stone", async () => {

        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker3
        });
        const eth_deposit_amount = BigNumber(10).times(1e18);

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });

        await stoneVault.deposit({
            value: eth_deposit_amount.times(0.5),
            from: taker2
        });
        await stoneVault.deposit({
            value: eth_deposit_amount.times(1.5),
            from: taker3
        });
        // taker4 stone amount
        taker4Stone = eth_deposit_amount.times(0.3);
        await stone.transfer(taker4, taker4Stone, { from: taker1 });

        let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice is : ", sharePrice.toString(10));

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));

        let user3Stone = BigNumber(await stone.balanceOf(taker3));
        console.log("user3Stone is : ", user3Stone.toString(10));

        let user4Stone = BigNumber(await stone.balanceOf(taker4));
        console.log("user4Stone is : ", user4Stone.toString(10));

        await stoneVault.currentSharePrice.call();

        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound();

        // strategyA got some interest while strategyB loss all
        let interest = BigNumber(5e18);
        let interest1 = BigNumber(15e18);

        await web3.eth.sendTransaction({
            from: deployer,
            to: strategyAAddr,
            value: interest.toString(10)
        })

        await mockNullStrategyB.mock_transfer(interest1, {
            from: deployer
        })
        let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
        console.log("strategyA_value is : ", strategyA_value.toString(10));
        assert.strictEqual(strategyA_value.toString(10), eth_deposit_amount.times(1.5).plus(interest).toString(10));

        let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
        console.log("strategyB_value is : ", strategyB_value.toString(10));
        assert.strictEqual(strategyB_value.toString(10), "0");

        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice1 is : ", sharePrice.toString(10));
        assert.strictEqual(eth_deposit_amount.times(3).minus(interest1).plus(interest).div(eth_deposit_amount.times(3)).times(MULTIPLIER).integerValue().toString(10), sharePrice.toString(10));
        const stoneCarnival = await StoneCarnival.new(
            stone.address,
            stoneVault.address,
            cap,
            minStoneAllowed
        );
        console.log("stoneCarnival: ", stoneCarnival.address);
        cSTONEAddress = await stoneCarnival.address;
        let cSTONE = await StoneCarnival.at(cSTONEAddress);

        await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker3
        });
        await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker4
        });
        await stoneCarnival.depositStone(user3Stone.toString(), {
            from: taker3
        });
        await stoneCarnival.depositStone(user4Stone.toString(), {
            from: taker4
        });

        // Both strategyA and B got some interest
        let interest3 = BigNumber(0.66e18);
        let interest4 = BigNumber(10e18);

        await web3.eth.sendTransaction({
            from: deployer,
            to: strategyAAddr,
            value: interest3.toString(10)
        })
        await web3.eth.sendTransaction({
            from: deployer,
            to: strategyBAddr,
            value: interest4.toString(10)
        })

        strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
        console.log("strategyA_value is : ", strategyA_value.toString(10));
        assert.strictEqual(strategyA_value.toString(10), eth_deposit_amount.times(1.5).plus(interest).plus(interest3).toString(10));

        strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
        console.log("strategyB_value is : ", strategyB_value.toString(10));
        assert.strictEqual(strategyB_value.toString(10), interest4.toString(10));

        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice2 is : ", sharePrice.toString(10));
        assert.strictEqual(eth_deposit_amount.times(3).minus(interest1).plus(interest).plus(interest3).plus(interest4).div(eth_deposit_amount.times(3)).times(MULTIPLIER).integerValue().toString(10), sharePrice.toString(10));

        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound();

        await stoneCarnival.pauseDeposit({ from: deployer });
        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice3 is : ", sharePrice.toString(10));

        let request_amount = user3Stone.plus(user4Stone);
        await stoneCarnival.makeRequest(request_amount.toString(),
            {
                from: deployer
            });
        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound();

        let balance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", balance.toString());
        let freezerBalance = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
        console.log("Before freezerBalance ether amount:", freezerBalance.toString());
        let withdraw_amount = user3Stone.plus(user4Stone).times(sharePrice).div(MULTIPLIER);
        let userReceipt = await stoneVault.userReceipts(deployer);
        let withdrawableAmount = BigNumber(userReceipt.withdrawableAmount);
        console.log("withdrawableAmount is :", withdrawableAmount.toString(10));
        await stoneCarnival.withdrawETH(withdraw_amount.toString(),
            {
                from: deployer
            });
        await stoneCarnival.makeDeposit(withdraw_amount.toString(),
            {
                from: deployer
            });
        await stoneCarnival.forceTerminate({ from: deployer });
        await stoneCarnival.withdrawStone({ from: taker3 });
        let taker3_stone = BigNumber(await stone.balanceOf(taker3));
        await stoneCarnival.withdrawStone({ from: taker4 });
        let taker4_stone = BigNumber(await stone.balanceOf(taker4));

        console.log("taker3 stone : ", taker3_stone.toString(10));
        console.log("taker4 stone : ", taker4_stone.toString(10));

    });

    // it("test16_user deposit carvival_makeRequest_strategy loss money_makewithdraw_makeDeposit_terminate_user withdraw stone", async () => {

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker3
    //     });
    //     const eth_deposit_amount = BigNumber(20).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(0.5),
    //         from: taker2
    //     });
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(1.5),
    //         from: taker3
    //     });
    //     // taker4 stone amount
    //     taker4Stone = eth_deposit_amount.times(0.7);
    //     await stone.transfer(taker4, taker4Stone, { from: taker1 });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     let user3Stone = BigNumber(await stone.balanceOf(taker3));
    //     console.log("user3Stone is : ", user3Stone.toString(10));

    //     let user4Stone = BigNumber(await stone.balanceOf(taker4));
    //     console.log("user4Stone is : ", user4Stone.toString(10));

    //     await stoneVault.currentSharePrice;

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker3
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker4
    //     });
    //     await stoneCarnival.depositStone(user3Stone.toString(), {
    //         from: taker3
    //     });

    //     await stoneCarnival.depositStone(user4Stone.toString(), {
    //         from: taker4
    //     });
    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     sharePrice = await stoneVault.currentSharePrice.call();
    //     console.log("sharePrice3 is : ", sharePrice.toString(10));

    //     let request_amount = user3Stone.plus(user4Stone);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     // strategyA strategyB loss
    //     let interest = BigNumber(5e18);
    //     let interest1 = BigNumber(15e18);

    //     await mockNullStrategyA.mock_transfer(interest, {
    //         from: deployer
    //     })

    //     await mockNullStrategyB.mock_transfer(interest1, {
    //         from: deployer
    //     })
    //     let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value is : ", strategyA_value.toString(10));

    //     let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value is : ", strategyB_value.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     sharePrice = await stoneVault.currentSharePrice.call();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     let withdraw_amount = user3Stone.plus(user4Stone).times(sharePrice).div(MULTIPLIER).minus(100);
    //     console.log("withdraw_amount is :", withdraw_amount.toString(10));

    //     // let withdraw_amount1 = BigNumber(29333333333333333304);
    //     await stoneCarnival.withdrawETH(withdraw_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await stoneCarnival.makeDeposit(withdraw_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     await stoneCarnival.forceTerminate({ from: deployer });
    //     await stoneCarnival.withdrawStone({ from: taker3 });
    //     let taker3_stone = BigNumber(await stone.balanceOf(taker3));
    //     await stoneCarnival.withdrawStone({ from: taker4 });
    //     let taker4_stone = BigNumber(await stone.balanceOf(taker4));

    //     console.log("taker3 stone : ", taker3_stone.toString(10));
    //     console.log("taker4 stone : ", taker4_stone.toString(10));

    // });

    // it("test17_user deposit carvival_makeRequest_strategy earn money_makewithdraw_makeDeposit_terminate_user withdraw stone", async () => {

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker3
    //     });
    //     const eth_deposit_amount = BigNumber(200).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(1.5),
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(0.004),
    //         from: taker2
    //     });
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker3
    //     });
    //     // taker4 stone amount
    //     taker4Stone = eth_deposit_amount.times(0.7);
    //     await stone.transfer(taker4, taker4Stone, { from: taker1 });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     let user3Stone = BigNumber(await stone.balanceOf(taker3));
    //     console.log("user3Stone is : ", user3Stone.toString(10));

    //     let user4Stone = BigNumber(await stone.balanceOf(taker4));
    //     console.log("user4Stone is : ", user4Stone.toString(10));

    //     await stoneVault.currentSharePrice.call();

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker3
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker4
    //     });
    //     await stoneCarnival.depositStone(user3Stone.toString(), {
    //         from: taker3
    //     });

    //     await stoneCarnival.depositStone(user4Stone.toString(), {
    //         from: taker4
    //     });
    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     sharePrice = await stoneVault.currentSharePrice.call();
    //     console.log("sharePrice3 is : ", sharePrice.toString(10));

    //     let request_amount = user3Stone.plus(user4Stone);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     // strategyA strategyB earn
    //     let interest = BigNumber(5e18);
    //     let interest1 = BigNumber(15e18);

    //     await web3.eth.sendTransaction({
    //         from: deployer,
    //         to: strategyAAddr,
    //         value: interest.toString(10)
    //     })

    //     await web3.eth.sendTransaction({
    //         from: deployer,
    //         to: strategyBAddr,
    //         value: interest1.toString(10)
    //     })

    //     let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value is : ", strategyA_value.toString(10));

    //     let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value is : ", strategyB_value.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     sharePrice = await stoneVault.currentSharePrice.call();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     let userReceipt = await stoneVault.userReceipts(stoneCarnival.address);
    //     let withdrawShares = BigNumber(userReceipt.withdrawShares);

    //     console.log("withdrawShares is :", withdrawShares.toString(10));

    //     let withdrawable_amount = withdrawShares.times(sharePrice).div(MULTIPLIER);
    //     console.log("withdrawable_amount is :", withdrawable_amount.toString(10));

    //     await stoneCarnival.withdrawETH(withdrawable_amount.minus(50).toString(),
    //         {
    //             from: deployer
    //         });
    //     await stoneCarnival.makeDeposit(withdrawable_amount.minus(50).toString(),
    //         {
    //             from: deployer
    //         });
    //     await stoneCarnival.forceTerminate({ from: deployer });
    //     let taker1_stone = BigNumber(await stone.balanceOf(taker1));

    //     let taker2_stone = BigNumber(await stone.balanceOf(taker2));

    //     await stoneCarnival.withdrawStone({ from: taker3 });
    //     let taker3_stone = BigNumber(await stone.balanceOf(taker3));
    //     await stoneCarnival.withdrawStone({ from: taker4 });
    //     let taker4_stone = BigNumber(await stone.balanceOf(taker4));

    //     console.log("taker1 stone : ", taker1_stone.toString(10));
    //     console.log("taker2 stone : ", taker2_stone.toString(10));
    //     console.log("taker3 stone : ", taker3_stone.toString(10));
    //     console.log("taker4 stone : ", taker4_stone.toString(10));

    // });

    // it("test18_user deposit carvival_makeRequest_strategy loss money_stonevault user instant withdraw_makewithdraw_makedeposit_terminate_user withdraw stone", async () => {

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker3
    //     });
    //     const eth_deposit_amount = BigNumber(200).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(1.5),
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(0.004),
    //         from: taker2
    //     });
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker3
    //     });
    //     // taker4 stone amount
    //     taker4Stone = eth_deposit_amount.times(0.7);
    //     await stone.transfer(taker4, taker4Stone, { from: taker1 });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     let user3Stone = BigNumber(await stone.balanceOf(taker3));
    //     console.log("user3Stone is : ", user3Stone.toString(10));

    //     let user4Stone = BigNumber(await stone.balanceOf(taker4));
    //     console.log("user4Stone is : ", user4Stone.toString(10));

    //     await stoneVault.currentSharePrice.call();

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     // cSTONEAddress = await stoneCarnival.address;
    //     // let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(10000).times(MULTIPLIER), {
    //         from: taker3
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(10000).times(MULTIPLIER), {
    //         from: taker4
    //     });
    //     await stoneCarnival.depositStone(user3Stone.toString(), {
    //         from: taker3
    //     });

    //     await stoneCarnival.depositStone(user4Stone.toString(), {
    //         from: taker4
    //     });
    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     sharePrice = await stoneVault.currentSharePrice.call();
    //     console.log("sharePrice2 is : ", sharePrice.toString(10));

    //     let request_amount = user3Stone.plus(user4Stone);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     // strategyA strategyB loss money
    //     let interest = BigNumber(100e18);
    //     let interest1 = BigNumber(108e18);

    //     await mockNullStrategyA.mock_transfer(interest, {
    //         from: deployer
    //     })

    //     await mockNullStrategyB.mock_transfer(interest1, {
    //         from: deployer
    //     })

    //     let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value is : ", strategyA_value.toString(10));

    //     let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value is : ", strategyB_value.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice3 is : ", sharePrice.toString(10));
    //     let expectSharePrice = strategyA_value.plus(strategyB_value).div(user1Stone.plus(user2Stone).plus(user3Stone).plus(user4Stone)).times(MULTIPLIER);
    //     assert.isTrue(Math.abs(sharePrice.minus(expectSharePrice)) < 10, 'Absolute difference should be less than 10');

    //     // taker1 taker2 instant withdraw
    //     let taker1_stone = BigNumber(await stone.balanceOf(taker1));
    //     let balance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before withdraw taker1 ether amount:", balance1.toString());

    //     let tx = await stoneVault.instantWithdraw(0, taker1_stone, { from: taker1 });
    //     const gasUsed = tx.receipt.gasUsed;
    //     let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     console.log('Spent gas:', gas.toString());

    //     let balance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After withdraw taker1 ether amount:", balance2.toString());

    //     let balance3 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("Before withdraw taker2 ether amount:", balance3.toString());

    //     let taker2_stone = BigNumber(await stone.balanceOf(taker2));
    //     await stoneVault.instantWithdraw(0, taker2_stone, { from: taker2 });
    //     let balance4 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("After withdraw taker2 ether amount:", balance4.toString());

    //     let userReceipt = await stoneVault.userReceipts(stoneCarnival.address);
    //     let withdrawShares = BigNumber(userReceipt.withdrawShares);

    //     console.log("withdrawShares is :", withdrawShares.toString(10));
    //     let withdrawableAmountInPast = BigNumber(await stoneVault.withdrawableAmountInPast());
    //     console.log("withdrawableAmountInPast is : ", withdrawableAmountInPast.toString(10));
    //     let withdrawable_amount = withdrawShares.times(sharePrice).div(MULTIPLIER);
    //     console.log("withdrawable_amount is :", withdrawable_amount.toString(10));
    //     // freezer owner withdrawETH
    //     await stoneCarnival.withdrawETH(withdrawable_amount.minus(1000).toString(),
    //         {
    //             from: deployer
    //         });

    //     await stoneCarnival.makeDeposit(withdrawable_amount.minus(1000).toString(),

    //         {
    //             from: deployer
    //         });
    //     await stoneCarnival.forceTerminate({ from: deployer });

    //     taker1_stone = BigNumber(await stone.balanceOf(taker1));
    //     taker2_stone = BigNumber(await stone.balanceOf(taker2));
    //     await stoneCarnival.withdrawStone({ from: taker3 });
    //     let taker3_stone = BigNumber(await stone.balanceOf(taker3));
    //     await stoneCarnival.withdrawStone({ from: taker4 });
    //     let taker4_stone = BigNumber(await stone.balanceOf(taker4));

    //     console.log("taker1 stone : ", taker1_stone.toString(10));

    //     console.log("taker2 stone : ", taker2_stone.toString(10));
    //     console.log("taker3 stone : ", taker3_stone.toString(10));
    //     console.log("taker4 stone : ", taker4_stone.toString(10));
    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice4 is : ", sharePrice.toString(10));
    // });


    // it("test19_user deposit carvival_makeRequest_strategy loss money_terminate_user withdraw stone", async () => {

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker3
    //     });
    //     const eth_deposit_amount = BigNumber(200).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(1.5),
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(0.004),
    //         from: taker2
    //     });
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker3
    //     });
    //     // taker4 stone amount
    //     taker4Stone = eth_deposit_amount.times(0.7);
    //     await stone.transfer(taker4, taker4Stone, { from: taker1 });

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     let user3Stone = BigNumber(await stone.balanceOf(taker3));
    //     console.log("user3Stone is : ", user3Stone.toString(10));

    //     let user4Stone = BigNumber(await stone.balanceOf(taker4));
    //     console.log("user4Stone is : ", user4Stone.toString(10));

    //     await stoneVault.currentSharePrice.call();

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     // cSTONEAddress = await stoneCarnival.address;
    //     // let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     await stone.approve(stoneCarnival.address, BigNumber(10000).times(MULTIPLIER), {
    //         from: taker3
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(10000).times(MULTIPLIER), {
    //         from: taker4
    //     });
    //     await stoneCarnival.depositStone(user3Stone.toString(), {
    //         from: taker3
    //     });

    //     await stoneCarnival.depositStone(user4Stone.toString(), {
    //         from: taker4
    //     });
    //     await stoneCarnival.pauseDeposit({ from: deployer });
    //     sharePrice = await stoneVault.currentSharePrice.call();
    //     console.log("sharePrice2 is : ", sharePrice.toString(10));

    //     let request_amount = user3Stone.plus(user4Stone);
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     // strategyA strategyB loss money
    //     let interest = BigNumber(100e18);
    //     let interest1 = BigNumber(108e18);

    //     await mockNullStrategyA.mock_transfer(interest, {
    //         from: deployer
    //     })

    //     await mockNullStrategyB.mock_transfer(interest1, {
    //         from: deployer
    //     })

    //     let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value is : ", strategyA_value.toString(10));

    //     let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value is : ", strategyB_value.toString(10));

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice3 is : ", sharePrice.toString(10));
    //     let expectSharePrice = strategyA_value.plus(strategyB_value).div(user1Stone.plus(user2Stone).plus(user3Stone).plus(user4Stone)).times(MULTIPLIER);
    //     assert.isTrue(Math.abs(sharePrice.minus(expectSharePrice)) < 10, 'Absolute difference should be less than 10');

    //     await stoneCarnival.forceTerminate({ from: deployer });

    //     taker1_stone = BigNumber(await stone.balanceOf(taker1));
    //     taker2_stone = BigNumber(await stone.balanceOf(taker2));
    //     await truffleAssert.fails(
    //         stoneCarnival.withdrawStone({
    //             from: taker3,
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "zero amount"
    //     );
    //     await truffleAssert.fails(
    //         stoneCarnival.withdrawStone({
    //             from: taker4,
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "zero amount"
    //     );

    // });


    // it("test20_check value", async () => {

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker3
    //     });

    //     const stoneCarnival = await StoneCarnival.new(
    //         stone.address,
    //         stoneVault.address,
    //         cap,
    //         minStoneAllowed
    //     );
    //     console.log("stoneCarnival: ", stoneCarnival.address);
    //     const eth_deposit_amount = BigNumber(200).times(1e18);

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(1.5),
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.times(0.4),
    //         from: taker2
    //     });
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker3
    //     });

    //     let price = await stoneVault.currentSharePrice.call();
    //     console.log("current share price is : ", price.toString());

    //     //check asset vault balance
    //     let assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddr);
    //     console.log("assetsVault ether amount:", assetsVaultBalance.toString());

    //     cSTONEAddress = await stoneCarnival.address;
    //     let cSTONE = await StoneCarnival.at(cSTONEAddress);

    //     let carvival_stone = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("carvival_stone stone : ", carvival_stone.toString(10));

    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker2
    //     });
    //     await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
    //         from: taker3
    //     });
    //     let taker1_stone = BigNumber(await stone.balanceOf(taker1));
    //     let taker2_stone = BigNumber(await stone.balanceOf(taker2));
    //     let taker3_stone = BigNumber(await stone.balanceOf(taker3));

    //     console.log("taker1 stone : ", taker1_stone.toString(10));
    //     console.log("taker2 stone : ", taker2_stone.toString(10));
    //     console.log("taker3 stone : ", taker3_stone.toString(10));

    //     let taker1_cstone = BigNumber(await cSTONE.balanceOf(taker1));
    //     let taker2_cstone = BigNumber(await cSTONE.balanceOf(taker2));
    //     let taker3_cstone = BigNumber(await cSTONE.balanceOf(taker3));

    //     console.log("taker1 cstone : ", taker1_cstone.toString(10));
    //     console.log("taker2 cstone : ", taker2_cstone.toString(10));
    //     console.log("taker3 cstone : ", taker3_cstone.toString(10));

    //     await stoneCarnival.depositStone(taker1_stone.toString(), {
    //         from: taker1
    //     });

    //     await stoneCarnival.depositStone(taker2_stone.toString(), {
    //         from: taker2
    //     });

    //     await stoneCarnival.depositStone(taker3_stone.toString(), {
    //         from: taker3
    //     });

    //     await sleep(2);
    //     await stoneVault.rollToNextRound({
    //         from: taker1
    //     });
    //     console.log("settlement finished!");

    //     let price1 = await stoneVault.currentSharePrice.call();
    //     console.log("current share price1 is : ", price1.toString());

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddr);
    //     console.log("assetsVault ether amount1:", assetsVaultBalance.toString());

    //     let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value is : ", strategyA_value.toString(10));

    //     let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value is : ", strategyB_value.toString(10));

    //     await stoneCarnival.pauseDeposit({ from: deployer });

    //     let request_amount = taker1_stone.plus(taker2_stone);
    //     console.log("request amount is : ", request_amount.toString());
    //     let carvival_stoneAmount = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("carvival_stoneAmount : ", carvival_stoneAmount.toString(10));

    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     await stoneCarnival.cancelWithdraw(request_amount.toString(),
    //         {
    //             from: deployer
    //         });

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     await truffleAssert.fails(
    //         stoneCarnival.withdrawETH(request_amount.toString(),
    //             {
    //                 from: deployer
    //             }),
    //         truffleAssert.ErrorType.REVERT,
    //         "exceed withdrawable"
    //     );
    //     await stoneCarnival.makeRequest(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     // strategies earn
    //     let interest1 = BigNumber(3e17);
    //     await web3.eth.sendTransaction({
    //         from: taker2,
    //         to: mockNullStrategyA.address,
    //         value: interest1.toString(10)
    //     })
    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();
    //     let price2 = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("current share price2 is : ", price2.toString());

    //     let tx = await stoneCarnival.withdrawETH(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     let freezerBalance1 = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("After withdrawETH freezerBalance ether amount:", freezerBalance1.toString());
    //     assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddr);
    //     console.log("assetsVault ether amount2:", assetsVaultBalance.toString());

    //     let strategyA_value1 = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value1 is : ", strategyA_value1.toString(10));

    //     let strategyB_value1 = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value1 is : ", strategyB_value1.toString(10));

    //     let carvival_stone1 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("After withdrawETH carvival_stone amount:", carvival_stone1.toString());
    //     // fix amount 
    //     let tx1 = await stoneCarnival.makeDeposit(request_amount.toString(),
    //         {
    //             from: deployer
    //         });
    //     let freezerBalance3 = BigNumber(await web3.eth.getBalance(stoneCarnival.address));
    //     console.log("After freezerBalance3 ether amount:", freezerBalance3.toString());

    //     await sleep(2);
    //     await time.advanceBlock();
    //     await stoneVault.rollToNextRound();

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddr);
    //     console.log("assetsVault ether amount3:", assetsVaultBalance.toString());

    //     strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
    //     console.log("strategyA_value3 is : ", strategyA_value.toString(10));

    //     strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
    //     console.log("strategyB_value3 is : ", strategyB_value.toString(10));

    //     await stoneCarnival.forceTerminate({ from: deployer });

    //     let carvival_stone2 = BigNumber(await stone.balanceOf(stoneCarnival.address));
    //     console.log("After withdrawETH carvival_stone2 amount:", carvival_stone2.toString());

    //     await stoneCarnival.withdrawStone({ from: taker1 });
    //     await stoneCarnival.withdrawStone({ from: taker2 });
    //     await stoneCarnival.withdrawStone({ from: taker3 });

    //     taker1_stone = BigNumber(await stone.balanceOf(taker1));
    //     taker2_stone = BigNumber(await stone.balanceOf(taker2));
    //     taker3_stone = BigNumber(await stone.balanceOf(taker3));
    //     console.log("taker1 stone : ", taker1_stone.toString(10));
    //     console.log("taker2 stone : ", taker2_stone.toString(10));
    //     console.log("taker3 stone : ", taker3_stone.toString(10));
    // });

});


