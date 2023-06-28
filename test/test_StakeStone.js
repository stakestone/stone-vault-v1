const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
const truffleAssert = require('truffle-assertions');
const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const withdrawFeeRate = 0;
const { expectRevert } = require('@openzeppelin/test-helpers');

contract("test_NullStrategy", async ([deployer, feeRecipient, taker1, taker2, taker3, proposer]) => {
    // const PERCENTAGE = BigNumber(1).times(1e4);
    const PERCENTAGE = 0;
    const ONE_HUNDRED_PERCENT = 1e6;
    const minDeposit = BigNumber(1).times(1e17);
    const DECIMALS = 1e18;
    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const rs = web3.utils.sha3(encoded);
        return '0x' + rs.substr(rs.length - 40, 40);
    }
    let minter, assetsVaultAddr, mockNullStrategyAAddr, mockNullStrategyBAddr, stone, proposalAddr;

    beforeEach(async () => {

        const minterAddr = await getFutureAddr(1);
        console.log("minterAddr: ", minterAddr);

        stone = await Stone.new(minterAddr);
        console.log("stone: ", stone.address);

        const stoneVaultAddr = await getFutureAddr(1);
        console.log("stoneVaultAddr: ", stoneVaultAddr);

        minter = await Minter.new(stone.address, [stoneVaultAddr]);
        console.log("minter: ", minter.address);

        assetsVaultAddr = await getFutureAddr(2);
        console.log("assetsVaultAddr: ", assetsVaultAddr);

        mockNullStrategyAAddr = await getFutureAddr(3);
        mockNullStrategyBAddr = await getFutureAddr(4);
        console.log("mockNullStrategyAAddr: ", mockNullStrategyAAddr);
        console.log("mockNullStrategyBAddr: ", mockNullStrategyBAddr);
        proposalAddr = await getFutureAddr(1);
        console.log("proposalAddr: ", proposalAddr);
    });

    // it("test1_one user_deposit_instant withdraw", async () => {

    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);

    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let minter1 = await stoneVault.minter();
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stoneVault.instantWithdraw(0, eth_deposit_amount, {
    //         from: taker1
    //     });
    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');

    // });
    // it("test2_one user_deposit_nullstrategy_roll to next_request withdraw_roll to next_instant withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });

    //     await stoneVault.rollToNextRound();
    //     userInfo1 = await stoneVault.userReceipts(taker1);
    //     userWithdrawableAmount1 = userInfo1.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount1: ", userWithdrawableAmount1.toString(10));
    //     userWithdrawShares1 = userInfo1.withdrawShares;
    //     console.log("taker1's withdrawShares1: ", userWithdrawShares1.toString(10));
    //     userWithdrawRound1 = userInfo1.withdrawRound;
    //     console.log("taker1's withdrawRound1: ", userWithdrawRound1.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');

    // });
    // it("test3_one user_deposit_nullstrategy_roll to next_request withdraw_cancel withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });

    //     await stoneVault.rollToNextRound();

    //     // await truffleAssert.fails(
    //     //     stoneVault.instantWithdraw(eth_deposit_amount, eth_deposit_amount, {
    //     //         from: taker1
    //     //     }),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "exceed withdrawable"
    //     // );
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });
    //     await stoneVault.cancelWithdraw(userStone, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual(userStone.toString(10), userStone1.toString(10));

    // });

    // it("test4_taker1 deposit at the 0 round_taker2 deposit at the 1 round_taker1 request withdraw all_complete withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker2
    //     });

    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });
    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());

    //     // await truffleAssert.fails(
    //     //     stoneVault.instantWithdraw(0, eth_deposit_amount, {
    //     //         from: taker1
    //     //     }),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "exceed withdrawable"
    //     // );
    //     await stoneVault.rollToNextRound();
    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });
    //     let actualBalance3 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance3.toString());
    //     let diff = BigNumber(actualBalance.integerValue().minus(actualBalance3.integerValue()));
    //     console.log("taker1 diff:", diff.toString());

    //     assert.ok(diff > 0);
    //     // assert.ok(diff < BigNumber(1e15));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');

    // });

    // it("test5_taker1 deposit at the 0 round_taker2 deposit at the 1 round_taker2 instant withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     let roundprice = await stoneVault.roundPricePerShare(0);
    //     console.log("roundprice is : ", roundprice.toString(10));
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker2
    //     });

    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker2);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));
    //     let latestRoundID = await stoneVault.latestRoundID();
    //     console.log("latestRoundID is : ", latestRoundID.toString(10));

    //     roundprice = await stoneVault.roundPricePerShare(0);
    //     console.log("roundprice is : ", roundprice.toString(10));
    //     await stoneVault.instantWithdraw(0, eth_deposit_amount, {
    //         from: taker2
    //     });
    //     // await truffleAssert.fails(
    //     //     stoneVault.instantWithdraw(0, eth_deposit_amount.div(2), {
    //     //         from: taker2
    //     //     }),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "ERC20: burn amount exceeds balance"
    //     // );

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual(userStone.toString(10), userStone1.toString(10));

    // });
    // //没改
    // it("test6_two users deposit at the 0 round_taker1 initiate withdraw at the 1 round", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);
    //     let withdrawFeeRate1 = BigNumber(1).times(1e4);

    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate1, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker2
    //     });
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker2
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());

    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     let feeRecipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeRecipientBalance:", feeRecipientBalance.toString());

    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();

    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());

    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));
    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });

    //     await stoneVault.rollToNextRound();

    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount after roll: ", userWithdrawableAmount.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });
    //     let fee = eth_deposit_amount.times(withdrawFeeRate1).div(
    //         ONE_HUNDRED_PERCENT
    //     );
    //     console.log("fee is : ", fee.toString(10));
    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > fee);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));
    //     let feeRecipientBalance1 = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeRecipientBalance1:", feeRecipientBalance1.toString());
    //     assert.strictEqual(feeRecipientBalance1.minus(feeRecipientBalance).toString(10), fee.toString(10));
    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     //assert.strictEqual(userStone.toString(10), userStone1.toString(10));
    // });


    // it("test7_taker1 deposit at the 0 round and the 1st round_instant withdraw amount is greater than the second deposit at the 1st round_complete withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposal,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);

    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     await minter.setKeeper(stoneVault.address, true);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));
    //     // await truffleAssert.fails(
    //     //     stoneVault.instantWithdraw(eth_deposit_amount, eth_deposit_amount),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "exceed withdrawable"
    //     // );
    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     await stoneVault.rollToNextRound();
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount.times(1.5), 0, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual(userStone.toString(10), userStone1.toString(10));
    // });
    ///////////////////////还没调
    // it("test8_user deposit at the 0 round_rolltoNext_initiate withdraw at the 1 round_rollToNext_deposit_instant withdraw all", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount = BigNumber(10).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     console.log("Vault is created! ");
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');  //????

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });

    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     //cancel
    //     await expectRevert.unspecified(vault.cancelWithdraw(withdrawAll, {
    //         from: taker1,
    //     }));

    //     let userInfo1 = await vault.userReceipts(taker1);
    //     console.log("userInfo1: ", userInfo1.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo1.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo1.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo1.withdrawShares.toString(10), BigNumber(withdrawAll).toString(10));
    //     assert.strictEqual(userInfo1.unredeemedShares.toString(10), '0');
    // });
    // 好的
    //     it("test9_user deposit at the 0 round_rolltonext_initiate withdraw at the 1 round_partial cancel_complete withdraw", async () => {
    //         const stoneVault = await StoneVault.new(
    //             minter.address,
    //             proposalAddr,
    //             assetsVaultAddr,
    //             [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //             [5e5, 5e5]
    //         );
    //         console.log("stoneVault: ", stoneVault.address);
    //         let proposal = await Proposal.new(stoneVault.address);
    //         console.log("proposal: ", proposal.address);
    //         const strategyControllerAddr = await stoneVault.strategyController();

    //         const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //         console.log("assetsVault: ", assetsVault.address);

    //         const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //         console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //         const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //         console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //         const eth_deposit_amount = BigNumber(1).times(1e18);
    //         let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("Before taker1 ether amount:", actualBalance.toString());

    //         await stoneVault.deposit({
    //             value: eth_deposit_amount,
    //             from: taker1
    //         });
    //         let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("After taker1 ether amount:", actualBalance1.toString());

    //         stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //         console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //         assert.strictEqual(stoneVaultBalance.toString(), '0');

    //         assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //         console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //         assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //         let sharePrice = await stoneVault.currentSharePrice();
    //         console.log("sharePrice is : ", sharePrice.toString(10));
    //         await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //             from: deployer
    //         })
    //         await stoneVault.setFeeRecipient(feeRecipient, {
    //             from: deployer
    //         })
    //         let userInfo = await stoneVault.userReceipts(taker1);
    //         console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //         let userStone = BigNumber(await stone.balanceOf(taker1));
    //         console.log("userStone is : ", userStone.toString(10));
    //         await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //             from: taker1
    //         });

    //         await stoneVault.rollToNextRound();

    //         assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //         console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //         let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //         console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //         // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //         userInfo = await stoneVault.userReceipts(taker1);
    //         userWithdrawShares = userInfo.withdrawShares;
    //         console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //         userWithdrawRound = userInfo.withdrawRound;
    //         console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //         userWithdrawableAmount = userInfo.withdrawableAmount;
    //         console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //         sharePrice = await stoneVault.currentSharePrice();
    //         console.log("sharePrice1 is : ", sharePrice.toString(10));

    //         await stoneVault.requestWithdraw(userStone, {
    //             from: taker1
    //         });
    //         await stoneVault.cancelWithdraw(userStone.div(2), {
    //             from: taker1
    //         });

    //         let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("After taker1 ether amount:", actualBalance2.toString());

    //         let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //         console.log("userStone1 is : ", userStone1.toString(10));
    //         assert.strictEqual(userStone.div(2).toString(10), userStone1.toString(10));
    //         await stoneVault.rollToNextRound();
    //         await stoneVault.instantWithdraw(eth_deposit_amount.div(2), 0, {
    //             from: taker1
    //         });
    //         let userStone2 = BigNumber(await stone.balanceOf(taker1));
    //         console.log("userStone2 is : ", userStone2.toString(10));
    //         assert.strictEqual(userStone2.toString(10), userStone.div(2).toString(10));
    //         let actualBalance3 = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("actualBalance3 amount:", actualBalance3.toString());
    //         assert.ok(actualBalance.minus(actualBalance3).minus(eth_deposit_amount.div(2)) > 0);
    //         assert.ok(actualBalance.minus(actualBalance3).minus(eth_deposit_amount.div(2)) < BigNumber(2e15));

    //     });
    // //好的
    //     it("test10_three users deposit at the 0 round_taker1 initiate withdraw at the 1st round_taker2 initiate withdraw at the 2nd round_taker3 initiate withdraw at the 3rd round_complete withdraw at the 4th round", async () => {
    //         const stoneVault = await StoneVault.new(
    //             minter.address,
    //             proposalAddr,
    //             assetsVaultAddr,
    //             [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //             [5e5, 5e5]
    //         );
    //         console.log("stoneVault: ", stoneVault.address);
    //         let proposal = await Proposal.new(stoneVault.address);
    //         console.log("proposal: ", proposal.address);
    //         const strategyControllerAddr = await stoneVault.strategyController();

    //         const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //         console.log("assetsVault: ", assetsVault.address);

    //         const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //         console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //         const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //         console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //         const eth_deposit_amount = BigNumber(1).times(1e18);
    //         let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("Before taker1 ether amount:", actualBalance.toString());
    //         await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //             from: taker1
    //         });
    //         await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //             from: taker2
    //         });
    //         await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //             from: taker3
    //         });
    //         await stoneVault.deposit({
    //             value: eth_deposit_amount,
    //             from: taker1
    //         });
    //         await stoneVault.deposit({
    //             value: eth_deposit_amount.times(0.5),
    //             from: taker2
    //         });
    //         await stoneVault.deposit({
    //             value: eth_deposit_amount.times(1.5),
    //             from: taker3
    //         });
    //         let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("After taker1 ether amount:", actualBalance1.toString());

    //         stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //         console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //         assert.strictEqual(stoneVaultBalance.toString(), '0');

    //         assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //         console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //         assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.times(3).toString(10));
    //         let sharePrice = await stoneVault.currentSharePrice();
    //         console.log("sharePrice is : ", sharePrice.toString(10));
    //         await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //             from: deployer
    //         })
    //         await stoneVault.setFeeRecipient(feeRecipient, {
    //             from: deployer
    //         })
    //         let userInfo = await stoneVault.userReceipts(taker1);
    //         console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //         let userStone = BigNumber(await stone.balanceOf(taker1));
    //         console.log("userStone is : ", userStone.toString(10));

    //         await stoneVault.rollToNextRound();

    //         assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //         console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //         let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //         console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //         // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //         userInfo = await stoneVault.userReceipts(taker1);
    //         userWithdrawShares = userInfo.withdrawShares;
    //         console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //         userWithdrawRound = userInfo.withdrawRound;
    //         console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //         userWithdrawableAmount = userInfo.withdrawableAmount;
    //         console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //         sharePrice = await stoneVault.currentSharePrice();
    //         console.log("sharePrice1 is : ", sharePrice.toString(10));

    //         await stoneVault.requestWithdraw(userStone, {
    //             from: taker1
    //         });

    //         await stoneVault.rollToNextRound();
    //         let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //         console.log("user2Stone is : ", user2Stone.toString(10));
    //         await stoneVault.requestWithdraw(user2Stone, {
    //             from: taker2
    //         });

    //         await stoneVault.rollToNextRound();
    //         let user3Stone = BigNumber(await stone.balanceOf(taker3));
    //         console.log("user3Stone is : ", user3Stone.toString(10));
    //         await stoneVault.requestWithdraw(user3Stone, {
    //             from: taker3
    //         });

    //         await stoneVault.rollToNextRound();

    //         let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("After taker1 ether amount:", actualBalance2.toString());

    //         let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //         console.log("userStone1 is : ", userStone1.toString(10));
    //         // assert.strictEqual(userStone.div(2).toString(10), userStone1.toString(10));

    //         await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //             from: taker1
    //         });
    //         await stoneVault.instantWithdraw(eth_deposit_amount.div(2), 0, {
    //             from: taker2
    //         });
    //         await stoneVault.instantWithdraw(eth_deposit_amount.times(1.5), 0, {
    //             from: taker3
    //         });
    //         let userStone2 = BigNumber(await stone.balanceOf(taker1));
    //         console.log("userStone2 is : ", userStone2.toString(10));
    //         assert.strictEqual(userStone2.toString(10), '0');

    //         let actualBalance3 = BigNumber(await web3.eth.getBalance(taker1));
    //         console.log("actualBalance3 amount:", actualBalance3.toString());
    //         console.log("actualBalance diff:", actualBalance.minus(actualBalance3).toString());

    //         assert.ok(actualBalance.minus(actualBalance3) > 0);
    //         // assert.ok(actualBalance.minus(actualBalance3) < BigNumber(2e15));

    //     });
    // OK
    // it("test11_one user_deposit_nullstrategy_roll to next_request withdraw_roll to next_request withdraw_rollToNext_instant withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });

    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After requestWithdraw ether amount:", assetsVaultBalance1.toString());
    //     console.log("After requestWithdraw userStone ether amount:", userStone.toString());
    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After requestWithdraw2 ether amount:", assetsVaultBalance1.toString());

    //     userInfo1 = await stoneVault.userReceipts(taker1);
    //     userWithdrawableAmount1 = userInfo1.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount1: ", userWithdrawableAmount1.toString(10));
    //     userWithdrawShares1 = userInfo1.withdrawShares;
    //     console.log("taker1's withdrawShares1: ", userWithdrawShares1.toString(10));
    //     userWithdrawRound1 = userInfo1.withdrawRound;
    //     console.log("taker1's withdrawRound1: ", userWithdrawRound1.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');

    // });
    // // OK
    // it("test12_one user_deposit_nullstrategy_roll to next_instant withdraw", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.instantWithdraw(0, eth_deposit_amount, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');

    // });
    // it("test13_user1 deposit_nullstrategy_roll to next_user2 deposit less than user1_ user1 instant withdraw all", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');
    //     user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     assert.strictEqual(user2Stone.toString(10), eth_deposit_amount.div(2).toString(10));

    // });
    // it("test14_one user_deposit_nullstrategy_roll to next_request withdraw_roll to next_request withdraw_instant withdraw_roll to next_instant withdraw should fail", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });
    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

    //     let userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault1 ether amount:", assetsVaultBalance1.toString());
    //     let withdrawFeeRate1 = BigNumber(await stoneVault.withdrawFeeRate());
    //     console.log("withdrawFeeRate1 is :", withdrawFeeRate1.toString(10));
    //     // assert.strictEqual(withdrawFeeRate1.toString(10), withdrawFeeRate.toString(10));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    //     sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });

    //     await stoneVault.rollToNextRound();

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     // console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(4e14));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');
    //     await stoneVault.rollToNextRound();
    //     //should fail
    //     await stoneVault.instantWithdraw(eth_deposit_amount.div(10000000), 0, {
    //         from: taker1
    //     });
    // });
    // it("test13_totalPendingAmount == assets.totalWithdraw_three users deposit at the 0 round_taker1 initiate withdraw at the 1 round_taker2 initiate withdraw at the 2 round", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     await stETHToken.approve(vault.address, BigNumber(100000000000).times(1e18), {
    //         from: publisher
    //     });
    //     let eth_deposit_amount1 = BigNumber(4).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(5).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(6).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount1.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);

    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });

    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     let userInfo1 = await vault.userReceipts(taker1);
    //     console.log("userInfo1: ", userInfo1.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo1.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo1.depositRound.toString(10), '0');
    //     // assert.strictEqual(userInfo1.withdrawRound.toString(10), '1');
    //     assert.strictEqual(userInfo1.unredeemedShares.toString(10), '0');  //????

    //     await vault.collectShares(taker2, {
    //         from: taker2,
    //     });
    //     withdrawAll = await vault.balanceOf(taker2);

    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker2,
    //     });

    //     let userInfo2 = await vault.userReceipts(taker2);
    //     console.log("userInfo2: ", userInfo2.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo2.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo2.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo2.withdrawRound.toString(10), '2');
    //     assert.strictEqual(userInfo2.unredeemedShares.toString(10), '0');  //????
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.completeWithdraw({
    //         from: taker2,
    //     });
    //     await vault.userReceipts(taker2);
    //     console.log("userInfo2: ", userInfo2.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo2.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo2.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo2.withdrawRound.toString(10), '2');
    //     assert.strictEqual(userInfo2.unredeemedShares.toString(10), '0');  //????
    // });
    // it("test14__slippage_minEtherReceived.add(etherBefore) < address(this).balance_three users deposit at the 0 round_taker1 initiate withdraw at the 1 round_taker2 initiate withdraw at the 2 round", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     await stETHToken.approve(vault.address, BigNumber(100000000000).times(1e18), {
    //         from: publisher
    //     });
    //     let eth_deposit_amount1 = BigNumber(4).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(5).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(6).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount1.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);

    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });

    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     let userInfo1 = await vault.userReceipts(taker1);
    //     console.log("userInfo1: ", userInfo1.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo1.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo1.depositRound.toString(10), '0');
    //     // assert.strictEqual(userInfo1.withdrawRound.toString(10), '1');
    //     assert.strictEqual(userInfo1.unredeemedShares.toString(10), '0');  //????

    //     await vault.collectShares(taker2, {
    //         from: taker2,
    //     });

    //     withdrawAll = await vault.balanceOf(taker2);

    //     await vault.initiateWithdraw(eth_deposit_amount2, {
    //         from: taker2,
    //     });

    //     let userInfo2 = await vault.userReceipts(taker2);
    //     console.log("userInfo2: ", userInfo2.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo2.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo2.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo2.withdrawRound.toString(10), '2');
    //     assert.strictEqual(userInfo2.unredeemedShares.toString(10), '0');  //????
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.completeWithdraw({
    //         from: taker2,
    //     });
    //     await vault.userReceipts(taker2);
    //     console.log("userInfo2: ", userInfo2.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo2.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo2.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo2.withdrawRound.toString(10), '2');
    //     assert.strictEqual(userInfo2.unredeemedShares.toString(10), '0');  //????
    // });

    // it("test16_terminate after the 1st round_the money in optiontrading should payback", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,
    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });

    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount1 = BigNumber(4).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(8).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(16).times(1e18);
    //     let beforeBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeBalance ether amount", beforeBalance.toString());
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     let sharePrice = await vault.currentSharePrice();
    //     console.log("share price is :", sharePrice.toString(10));
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount1.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = BigNumber(await vault.balanceOf(taker1));
    //     console.log("taker1's share is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     // 1.3 only for withdraw 
    //     // await ldoRouter.set_transfer_eth_amount(BigNumber(13).times(1e17));
    //     // await ldoRouter.deposit({
    //     //     value: BigNumber(130).times(1e17),
    //     //     from: deployer,
    //     // });

    //     // await stableSwap.set_ratio(BigNumber(110).times(1e4));
    //     await vault.settlement(BigNumber(1e18), 0, {
    //         from: publisher
    //     });
    //     // await vault.deposit(ZERO_ADDRESS, {
    //     //     value: eth_deposit_amount1,
    //     //     from: taker1,
    //     // });

    //     // let all_ether = await vault.getAllEtherValue();
    //     // console.log("All ether", BigNumber(all_ether.logs[0].args['0']).toNumber());

    //     let actualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", actualBalance.toString());
    //     await vault.advanceToEndTime();
    //     // await stableSwap.set_ratio(BigNumber(100).times(1e4));

    //     await vault.terminate(BigNumber(1).times(1e18), {
    //         from: publisher,
    //     });
    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance ", optionsTradingBalance.toString());



    //     let userInfo1 = await vault.userReceipts(taker1);

    //     console.log("userInfo1.pendingAmount", userInfo1.pendingAmount.toString(10));
    //     console.log("userInfo1.depositRound", userInfo1.depositRound.toString(10));
    //     console.log("userInfo1.withdrawRound", userInfo1.withdrawRound.toString(10));
    //     console.log("userInfo1.unredeemedShares", userInfo1.unredeemedShares.toString(10));
    //     console.log("ususerInfo1.withdrawShareserInfo1", userInfo1.withdrawShares.toString(10));
    //     console.log("useuserInfo1.withdrawableAmount", userInfo1.withdrawableAmount.toString(10));

    //     let userInfo2 = await vault.userReceipts(taker2);
    //     console.log("userInfo2.pendingAmount", userInfo2.pendingAmount.toString(10));
    //     console.log("userInfo2.depositRound", userInfo2.depositRound.toString(10));
    //     console.log("userInfo2.withdrawRound", userInfo2.withdrawRound.toString(10));
    //     console.log("userInfo2.unredeemedShares", userInfo2.unredeemedShares.toString(10));
    //     console.log("userInfo2.withdrawShares", userInfo2.withdrawShares.toString(10));
    //     console.log("userInfo2.withdrawableAmount", userInfo2.withdrawableAmount.toString(10));

    //     let userInfo3 = await vault.userReceipts(taker3);
    //     console.log("userInfo3.pendingAmount", userInfo3.pendingAmount.toString(10));
    //     console.log("userInfo3.depositRound", userInfo3.depositRound.toString(10));
    //     console.log("userInfo3.withdrawRound", userInfo3.withdrawRound.toString(10));
    //     console.log("userInfo3.unredeemedShares", userInfo3.unredeemedShares.toString(10));
    //     console.log("userInfo3.withdrawShares", userInfo3.withdrawShares.toString(10));
    //     console.log("userInfo3.withdrawableAmount", userInfo3.withdrawableAmount.toString(10));
    //     let beforeexit = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeexit ether amount", beforeexit.toString());
    //     await vault.exit({
    //         from: taker1,
    //     });
    //     // let userInfo12 = await vault.userReceipts(taker1);

    //     // console.log("userInfo12.pendingAmount", userInfo12.pendingAmount.toString(10));
    //     // console.log("userInfo12.depositRound", userInfo12.depositRound.toString(10));
    //     // console.log("userInfo12.withdrawRound", userInfo12.withdrawRound.toString(10));
    //     // console.log("userInfo12.unredeemedShares", userInfo12.unredeemedShares.toString(10));
    //     // console.log("ususerInfo12.withdrawShareserInfo1", userInfo12.withdrawShares.toString(10));
    //     // console.log("useuserInfo12.withdrawableAmount", userInfo12.withdrawableAmount.toString(10));

    //     // await vault.exit({
    //     //     from: taker1,
    //     // });

    //     let aftBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 aftBalance ether amount", aftBalance.toString());
    //     let beforeexit2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 beforeexit ether amount", beforeexit2.toString());

    //     await vault.exit({
    //         from: taker2,
    //     });
    //     let userInfo11 = await vault.userReceipts(taker1);

    //     console.log("userInfo11.pendingAmount", userInfo11.pendingAmount.toString(10));
    //     console.log("userInfo11.depositRound", userInfo11.depositRound.toString(10));
    //     console.log("userInfo11.withdrawRound", userInfo11.withdrawRound.toString(10));
    //     console.log("userInfo11.unredeemedShares", userInfo11.unredeemedShares.toString(10));
    //     console.log("userInfo11.withdrawShares", userInfo11.withdrawShares.toString(10));
    //     console.log("userInfo11.withdrawableAmount", userInfo11.withdrawableAmount.toString(10));

    //     let userInfo22 = await vault.userReceipts(taker2);
    //     console.log("userInfo22.pendingAmount", userInfo22.pendingAmount.toString(10));
    //     console.log("userInfo22.depositRound", userInfo22.depositRound.toString(10));
    //     console.log("userInfo22.withdrawRound", userInfo22.withdrawRound.toString(10));
    //     console.log("userInfo22.unredeemedShares", userInfo22.unredeemedShares.toString(10));
    //     console.log("userInfo22.withdrawShares", userInfo22.withdrawShares.toString(10));
    //     console.log("userInfo22.withdrawableAmount", userInfo22.withdrawableAmount.toString(10));

    //     let userInfo33 = await vault.userReceipts(taker3);
    //     console.log("userInfo33.pendingAmount", userInfo33.pendingAmount.toString(10));
    //     console.log("userInfo33.depositRound", userInfo33.depositRound.toString(10));
    //     console.log("userInfo33.withdrawRound", userInfo33.withdrawRound.toString(10));
    //     console.log("userInfo33.unredeemedShares", userInfo33.unredeemedShares.toString(10));
    //     console.log("userInfo33.withdrawShares", userInfo33.withdrawShares.toString(10));
    //     console.log("userInfo33.withdrawableAmount", userInfo33.withdrawableAmount.toString(10));

    //     let aftBalance2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 aftBalance ether amount", aftBalance2.toString());
    //     let beforeexit3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 beforeexit ether amount", beforeexit3.toString());
    //     let vaultbal = BigNumber(await web3.eth.getBalance(vault.address));
    //     console.log("vault balance left", vaultbal.toString());

    //     await vault.exit({
    //         from: taker3,
    //     });
    //     let aftBalance3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 aftBalance ether amount", aftBalance3.toString());
    // });

    // it("test17_terminate after the 0st round_premium in optiontrading should payback", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });

    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount1 = BigNumber(28).times(1e18);
    //     let beforeBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeBalance ether amount", beforeBalance.toString());
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     // let sharePrice = await vault.currentSharePrice();
    //     // console.log("share price is :", sharePrice.toString(10));
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let premium = eth_deposit_amount1.times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR);
    //     console.log("premium is :", premium.decimalPlaces(0, 1).toString(10));
    //     await vault.terminate(eth_deposit_amount1.minus(premium.decimalPlaces(0, 1)), {
    //         from: publisher,
    //     });
    //     let beforeexit = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeexit ether amount", beforeexit.toString());

    //     await vault.exit({
    //         from: taker1,
    //     });
    //     let aftBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 aftBalance ether amount", aftBalance.toString());
    // });

    // it("test18_one user repeat deposit settlement and withdraw for several cycles", async () => {
    //     let feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientBalance amount: ", feeReceipientBalance.toString());

    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");
    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount = BigNumber(10).times(1e18);
    //     let actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("taker1 ether amount", actualBalance.toString());
    //     let vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", vaultActualBalance.toString());

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("After taker1 ether amount", actualBalance.toString());
    //     vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("After vault ether amount", vaultActualBalance.toString());
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     let round1 = await vault.roundInfo(1);
    //     let filled = BigNumber(round1.filledVolume);
    //     console.log("filled amount", filled.toString());
    //     vaultBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount after staking in curve", vaultBalance.toString());
    //     console.log("getAllEtherValue", BigNumber(await vault.getAllEtherValue).toString());

    //     let allEtherInvested = BigNumber(await vault.getAllEtherValue).minus(vaultBalance);
    //     let yield = allEtherInvested.minus(filled);
    //     console.log("yield is : ", yield.toString(10));
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = BigNumber(await vault.balanceOf(taker1));
    //     await vault.initiateWithdraw(withdrawAll.div(BigNumber(2)).decimalPlaces(0, 1), {
    //         from: taker1,
    //     });

    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     withdrawAll = BigNumber(await vault.balanceOf(taker1));

    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     userInfo = await vault.userReceipts(taker1);
    //     console.log("receipt withdrawableAmount is : ", userInfo.withdrawableAmount.toString(10));
    //     console.log("receipt withdrawShares is : ", userInfo.withdrawShares.toString(10));
    //     console.log("receipt withdrawRound is : ", userInfo.withdrawRound.toString(10));
    //     // assert.strictEqual("withdrawableAmount amount is : ",)
    //     await vault.advanceToEndTime();

    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });

    //     takerBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("takerBalance bef: ", takerBalance.toString());

    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });

    //     takerBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("takerBalance aft: ", takerBalance1.toString());

    //     userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     let feeReceipientBalance1 = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("fee amount: ", feeReceipientBalance1.minus(feeReceipientBalance).toString());

    // });

    // it("test19_trader withdraw", async () => {

    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await optionsTrading.setOptionsTrader(trader, {
    //         from: governance
    //     })
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     await stETHToken.approve(vault.address, BigNumber(100000000000).times(1e18), {
    //         from: publisher
    //     });
    //     let eth_deposit_amount = BigNumber(20).times(1e18);

    //     let actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("taker1 ether amount", actualBalance.toString());
    //     let vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", vaultActualBalance.toString());

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });

    //     vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("After vault ether amount", vaultActualBalance.toString());
    //     await vault.advanceToEndTime();

    //     console.log("Vault is created! ");

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let premium = eth_deposit_amount.times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR);
    //     console.log("premium is :", premium.decimalPlaces(0, 1).toString(10));

    //     optionTraderBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("before optionTraderBalance ether amount: ", optionTraderBalance.toString(10));
    //     assert.strictEqual(optionTraderBalance.minus(premium.decimalPlaces(0, 1)).toString(10), '0');

    //     beforeTraderBalance = BigNumber(await web3.eth.getBalance(trader));
    //     console.log("before trader ether amount: ", beforeTraderBalance.toString());

    //     await optionsTrading.tradeOptions(premium.decimalPlaces(0, 1), "hhhhh", {
    //         from: trader
    //     });

    //     aftTraderBalance = BigNumber(await web3.eth.getBalance(trader));
    //     console.log("aft trader ether amount: ", aftTraderBalance.toString());
    //     optionTraderBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     assert.strictEqual(optionTraderBalance.toString(10), '0');
    //     console.log("trader gas", premium.decimalPlaces(0, 1).minus(aftTraderBalance.minus(beforeTraderBalance)).toString(10));
    //     assert.ok(premium.decimalPlaces(0, 1).minus(aftTraderBalance.minus(beforeTraderBalance)) < BigNumber(4e14), "trader amount may not correct");
    //     assert.ok(premium.decimalPlaces(0, 1).minus(aftTraderBalance.minus(beforeTraderBalance)) > 0);
    // });


    // it("test20_terminate after the 3st round_premium and unredeemedshares should be payback", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });

    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount1 = BigNumber(10).times(1e18);
    //     let beforeBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeBalance ether amount", beforeBalance.toString());
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     await vault.terminate(eth_deposit_amount1, {
    //         from: publisher,
    //     });
    //     let beforeexit = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeexit ether amount", beforeexit.toString());

    //     await vault.exit({
    //         from: taker1,
    //     });
    //     let aftBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 aftBalance ether amount", aftBalance.toString());
    // });
    // it("test20_user complete withdraw after several cycles", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount = BigNumber(10).times(1e18);

    //     let actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("taker1 ether amount", actualBalance.toString());
    //     let vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", vaultActualBalance.toString());

    //     feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientBalance amount: ", feeReceipientBalance.toString());

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("After taker1 ether amount", actualBalance.toString());
    //     vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("After vault ether amount", vaultActualBalance.toString());
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let ratio = BigNumber(110).times(1e4);
    //     await stableSwap.set_ratio(ratio);
    //     const IDO_reward = BigNumber(13).times(1e17);
    //     await ldoRouter.set_transfer_eth_amount(IDO_reward);
    //     await ldoRouter.deposit({
    //         value: BigNumber(130).times(1e17),
    //         from: deployer,
    //     });
    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });

    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await ldoRouter.set_transfer_eth_amount(0);

    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.advanceToEndTime();

    //     feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));

    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });

    //     taker1Balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance: ", taker1Balance.toString());

    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     takerBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("takerBalance1: ", takerBalance1.toString());
    //     let premium = eth_deposit_amount.times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR);
    //     console.log("premium is :", premium.toString(10));
    //     let curveFinalAmount = eth_deposit_amount.minus(premium).times(ratio).div(PERCENTAGE).plus(premium).plus(IDO_reward);
    //     console.log("curveFinalAmount is :", curveFinalAmount.toString(10));

    //     let calcProfit = curveFinalAmount.minus(eth_deposit_amount).times(0.9);
    //     console.log("calcProfit is :", calcProfit.toString(10));
    //     assert.ok(calcProfit.integerValue().minus(takerBalance1.minus(taker1Balance).minus(eth_deposit_amount)) > 0);
    //     assert.ok(calcProfit.integerValue().minus(takerBalance1.minus(taker1Balance).minus(eth_deposit_amount)) < BigNumber(4e14));

    //     await expectRevert.unspecified(vault.initiateWithdraw(BigNumber(1e14), {
    //         from: taker1,
    //     }));
    //     userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), '0');
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');
    //     feeReceipientBalance_final = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     let fee = feeReceipientBalance_final.minus(feeReceipientBalance);
    //     console.log("fee amount: ", feeReceipientBalance_final.minus(feeReceipientBalance).toString());
    //     let calc_fee = curveFinalAmount.minus(eth_deposit_amount).times(0.1);
    //     console.log("calc_fee is: ", calc_fee.toString(10));
    //     assert.ok(calc_fee.minus(fee) > 0);
    //     assert.ok(calc_fee.minus(fee) < BigNumber(4e14));

    // });
    // it("test21_user complete withdraw, then empty vault run several cycles_user deposit again", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount = BigNumber(10).times(1e18);

    //     let actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("taker1 ether amount", actualBalance.toString());
    //     let vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", vaultActualBalance.toString());

    //     feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientBalance amount: ", feeReceipientBalance.toString());

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("After taker1 ether amount", actualBalance.toString());
    //     vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("After vault ether amount", vaultActualBalance.toString());
    //     await vault.advanceToEndTime();

    //     console.log("Vault is created! ");

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let ratio = BigNumber(110).times(1e4);
    //     await stableSwap.set_ratio(ratio);
    //     const IDO_reward = BigNumber(13).times(1e17);
    //     await ldoRouter.set_transfer_eth_amount(IDO_reward);
    //     await ldoRouter.deposit({
    //         value: BigNumber(130).times(1e17),
    //         from: deployer,
    //     });
    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.completeWithdraw(
    //         {
    //             from: taker1
    //         })
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     // 故意出错debug
    //     await vault.completeWithdraw(
    //         {
    //             from: taker1
    //         })
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });

    //     taker1Balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance: ", taker1Balance.toString());

    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });

    //     takerBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance1: ", takerBalance1.toString());
    //     console.log("diff is: ", takerBalance1.minus(taker1Balance).toString(10));
    // });

    // it("test22_invest but loss money", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount = BigNumber(10).times(1e18);

    //     let actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("taker1 ether amount", actualBalance.toString());

    //     feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientBalance amount: ", feeReceipientBalance.toString());

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount,
    //         from: taker1,
    //     });
    //     actualBalance = await web3.eth.getBalance(taker1);
    //     console.log("After taker1 ether amount", actualBalance.toString());
    //     vaultActualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("After vault ether amount", vaultActualBalance.toString());
    //     await vault.advanceToEndTime();

    //     console.log("Vault is created! ");
    //     //suppose curve price
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     // lp lose money
    //     let ratio = BigNumber(60).times(1e4);
    //     await stableSwap.set_ratio(ratio);
    //     // trader doesn't return any money
    //     let premium = eth_deposit_amount.times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR);
    //     console.log("premium is :", premium.decimalPlaces(0, 1).toString(10));

    //     await optionsTrading.tradeOptions(premium.decimalPlaces(0, 1), "hhhhh", {
    //         from: trader
    //     });
    //     const IDO_reward = BigNumber(13).times(1e17);
    //     await ldoRouter.set_transfer_eth_amount(IDO_reward);
    //     await ldoRouter.deposit({
    //         value: BigNumber(13).times(1e17),
    //         from: deployer,
    //     });
    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());
    //     // pending amount only change to 0 after user's action
    //     assert.strictEqual(userInfo.pendingAmount.toString(10), eth_deposit_amount.toString(10));
    //     assert.strictEqual(userInfo.depositRound.toString(10), '0');
    //     assert.strictEqual(userInfo.withdrawRound.toString(10), '0');
    //     assert.strictEqual(userInfo.unredeemedShares.toString(10), '0');

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });

    //     await vault.advanceToEndTime();

    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     taker1Balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance: ", taker1Balance.toString());

    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     // Make it fail to see event
    //     // await vault.initiateWithdraw(withdrawAll, {
    //     //     from: taker1,
    //     // });
    //     takerBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance1: ", takerBalance1.toString());
    //     let taker1_loss = takerBalance1.minus(taker1Balance).minus(eth_deposit_amount);
    //     console.log("loss is: ", eth_deposit_amount.minus(takerBalance1.minus(taker1Balance)).toString(10));
    //     let curveFinalAmount = eth_deposit_amount.minus(premium).times(ratio).div(PERCENTAGE);
    //     console.log("curveFinalAmount is :", curveFinalAmount.toString(10));

    //     let calcProfit = IDO_reward.plus(curveFinalAmount.times(ratio.minus(BigNumber(100).times(1e4)).div(PERCENTAGE))).decimalPlaces(0, 1);
    //     console.log("calcProfit is :", calcProfit.toString(10));
    //     let cal_loss = calcProfit.minus(premium);
    //     feeReceipientBalance_final = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     assert.ok(feeReceipientBalance.minus(feeReceipientBalance_final) < BigNumber(4e14));
    //     assert.ok(cal_loss.minus(taker1_loss) < BigNumber(4e14));
    // });
    // it("test23_three users deposit at the 0 round_sell IDO and LP and earn money from optionTrade_taker1 initiate withdraw at the 1st round_taker1 complete withdraw and taker2 initiate withdraw at the 2nd round_taker2 complete withdraw and taker3 initiate withdraw at the 3rd round_taker3 complete withdraw at the 4th round", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount1 = BigNumber(100).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(200).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(300).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     console.log("Vault is created! ");
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());

    //     let feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientBalance amount: ", feeReceipientBalance.toString());
    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.advanceToEndTime();

    //     await ldoRouter.set_transfer_eth_amount(BigNumber(30).times(1e17));
    //     await ldoRouter.deposit({
    //         value: BigNumber(5000).times(1e17),
    //         from: deployer,
    //     });
    //     await stableSwap.set_ratio(BigNumber(150).times(1e4));
    //     let Premium = BigNumber(eth_deposit_amount1.plus(eth_deposit_amount2).plus(eth_deposit_amount3).times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR));
    //     let optionYield = BigNumber(20).times(1e18);
    //     await optionsTrading.payOptionYield({
    //         value: optionYield,
    //         from: trader,
    //     });

    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance is :", optionsTradingBalance.toString(10));
    //     assert.strictEqual(optionsTradingBalance.toString(10), Premium.plus(optionYield).decimalPlaces(0, 1).toString(10));

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await ldoRouter.set_transfer_eth_amount(0);

    //     await stableSwap.set_ratio(BigNumber(60).times(1e4));
    //     let Premium2 = BigNumber(eth_deposit_amount2.times(2).plus(eth_deposit_amount3).times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR));

    //     let take1BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("take1BeforeWithDraw amount: ", take1BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     let take1AfterWithDraw = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("take1AfterWithDraw amount: ", take1AfterWithDraw.toString());
    //     await vault.collectShares(taker2, {
    //         from: taker2,
    //     });
    //     let withdrawAll2 = await vault.balanceOf(taker2);
    //     console.log("withdraw2 all is :", withdrawAll2.toString(10));
    //     await vault.initiateWithdraw(withdrawAll2, {
    //         from: taker2,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let take2BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("take2BeforeWithDraw amount: ", take2BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker2,
    //     });
    //     let take2AfterWithDraw = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("take2AfterWithDraw amount: ", take2AfterWithDraw.toString());
    //     await vault.collectShares(taker3, {
    //         from: taker3,
    //     });
    //     let withdrawAll3 = await vault.balanceOf(taker3);
    //     console.log("withdraw3 all is :", withdrawAll3.toString(10));
    //     await vault.initiateWithdraw(withdrawAll3, {
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     // check user amount
    //     let take3BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("take3BeforeWithDraw amount: ", take3BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker3,
    //     });
    //     let take3AfterWithDraw = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("take3AfterWithDraw amount: ", take3AfterWithDraw.toString());
    //     let feeReceipientLast = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientLast amount: ", feeReceipientLast.toString());
    //     //?????????????
    //     // let curveFinalAmount = BigNumber(eth_deposit_amount.times(3).minus(Premium).times(ratio).div(PERCENTAGE));
    //     // console.log("curveFinalAmount is :", curveFinalAmount.toString(10));

    //     feeReceipientBalance_final = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("fee amount: ", feeReceipientBalance_final.minus(feeReceipientBalance).toString());
    //     // totalFee = BigNumber(eth_deposit_amount.times(managementFeeRate).div(PERCENTAGE).plus(IDO_reward.times(performanceFeeRate).div(PERCENTAGE)));
    //     // console.log("totalFee amount: ", totalFee.toString(10));

    // });

    // it("test24_three users deposit at the 0 round_sell IDO and LP and earn money from optionTrade_taker1 initiate withdraw at the 1st round_taker1 complete withdraw and taker2 initiate withdraw at the 2nd round_taker2 complete withdraw and taker3 initiate withdraw at the 3rd round_taker3 complete withdraw at the 4th round", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount1 = BigNumber(100).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(200).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(300).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     console.log("Vault is created! ");
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());

    //     let feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientBalance amount: ", feeReceipientBalance.toString());
    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.advanceToEndTime();

    //     await ldoRouter.set_transfer_eth_amount(BigNumber(30).times(1e17));
    //     await ldoRouter.deposit({
    //         value: BigNumber(5000).times(1e17),
    //         from: deployer,
    //     });
    //     await stableSwap.set_ratio(BigNumber(120).times(1e4));
    //     let Premium = BigNumber(eth_deposit_amount1.plus(eth_deposit_amount2).plus(eth_deposit_amount3).times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR));
    //     let optionYield = BigNumber(20).times(1e18);
    //     await optionsTrading.payOptionYield({
    //         value: optionYield,
    //         from: trader,
    //     });

    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance is :", optionsTradingBalance.toString(10));
    //     assert.strictEqual(optionsTradingBalance.toString(10), Premium.plus(optionYield).decimalPlaces(0, 1).toString(10));

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await ldoRouter.set_transfer_eth_amount(0);

    //     await stableSwap.set_ratio(BigNumber(150).times(1e4));
    //     let Premium2 = BigNumber(eth_deposit_amount2.times(2).plus(eth_deposit_amount3).times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR));

    //     let take1BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("take1BeforeWithDraw amount: ", take1BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     let take1AfterWithDraw = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("take1AfterWithDraw amount: ", take1AfterWithDraw.toString());
    //     await vault.collectShares(taker2, {
    //         from: taker2,
    //     });
    //     let withdrawAll2 = await vault.balanceOf(taker2);
    //     console.log("withdraw2 all is :", withdrawAll2.toString(10));
    //     await vault.initiateWithdraw(withdrawAll2, {
    //         from: taker2,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     let take2BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("take2BeforeWithDraw amount: ", take2BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker2,
    //     });
    //     let take2AfterWithDraw = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("take2AfterWithDraw amount: ", take2AfterWithDraw.toString());
    //     await vault.collectShares(taker3, {
    //         from: taker3,
    //     });
    //     let withdrawAll3 = await vault.balanceOf(taker3);
    //     console.log("withdraw3 all is :", withdrawAll3.toString(10));
    //     await vault.initiateWithdraw(withdrawAll3, {
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     // check user amount
    //     let take3BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("take3BeforeWithDraw amount: ", take3BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker3,
    //     });
    //     let take3AfterWithDraw = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("take3AfterWithDraw amount: ", take3AfterWithDraw.toString());
    //     let feeReceipientLast = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientLast amount: ", feeReceipientLast.toString());
    //     //?????????????
    //     // let curveFinalAmount = BigNumber(eth_deposit_amount.times(3).minus(Premium).times(ratio).div(PERCENTAGE));
    //     // console.log("curveFinalAmount is :", curveFinalAmount.toString(10));

    //     feeReceipientBalance_final = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("fee amount: ", feeReceipientBalance_final.minus(feeReceipientBalance).toString());
    //     // totalFee = BigNumber(eth_deposit_amount.times(managementFeeRate).div(PERCENTAGE).plus(IDO_reward.times(performanceFeeRate).div(PERCENTAGE)));
    //     // console.log("totalFee amount: ", totalFee.toString(10));

    // });
    // it("test25_three users deposit at the 0 round_sell IDO and LP and earn money from optionTrade_taker1 initiate withdraw at the 1st round_taker1 complete withdraw and taker2 initiate withdraw at the 2nd round_taker2 complete withdraw and taker3 initiate withdraw at the 3rd round_taker3 complete withdraw at the 4th round", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount1 = BigNumber(100).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(200).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(300).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     console.log("Vault is created! ");
    //     feeReceipientBalance = BigNumber(await web3.eth.getBalance(feeRecipient));

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     let userInfo = await vault.userReceipts(taker1);
    //     console.log("userInfo", userInfo.toString());

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.advanceToEndTime();
    //     let ldoReward = BigNumber(30).times(1e17);
    //     // await quoter.setQuoteExactInputSingle(ldoReward);
    //     await ldoRouter.set_transfer_eth_amount(ldoReward);
    //     await ldoRouter.deposit({
    //         value: BigNumber(5000).times(1e17),
    //         from: deployer,
    //     });
    //     let ratio = BigNumber(60).times(1e4)
    //     await stableSwap.set_ratio(ratio);
    //     let Premium = BigNumber(eth_deposit_amount1.plus(eth_deposit_amount2).plus(eth_deposit_amount3).times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR));
    //     console.log("Premium is :", Premium.toString(10));
    //     let optionYield = BigNumber(20).times(1e18);
    //     await optionsTrading.payOptionYield({
    //         value: optionYield,
    //         from: trader,
    //     });

    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance is :", optionsTradingBalance.toString(10));
    //     assert.strictEqual(optionsTradingBalance.toString(10), Premium.plus(optionYield).decimalPlaces(0, 1).toString(10));

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     let ldoReward2 = BigNumber(50).times(1e17);
    //     // await quoter.setQuoteExactInputSingle(ldoReward2);

    //     await ldoRouter.set_transfer_eth_amount(ldoReward2);
    //     let ratio2 = BigNumber(120).times(1e4);
    //     await stableSwap.set_ratio(ratio2);

    //     let take1BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("take1BeforeWithDraw amount: ", take1BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     // For debug
    //     // await vault.initiateWithdraw(withdrawAll, {
    //     //     from: taker1,
    //     // });
    //     let take1AfterWithDraw = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("take1AfterWithDraw amount: ", take1AfterWithDraw.toString());
    //     let real_loss = eth_deposit_amount1.minus(take1AfterWithDraw.minus(take1BeforeWithDraw));
    //     console.log("real_loss is :", real_loss.toString(10));
    //     let expect_loss = eth_deposit_amount1.minus(Premium.div(6)).times(BigNumber(100).times(1e4).minus(ratio).div(PERCENTAGE)).minus(ldoReward.plus(optionYield).div(6)).integerValue();
    //     console.log("expect_loss is :", expect_loss.toString(10));
    //     assert.ok(real_loss.minus(expect_loss) > 0);
    //     assert.ok(real_loss.minus(expect_loss) < BigNumber(4e14));
    //     await vault.collectShares(taker2, {
    //         from: taker2,
    //     });
    //     let withdrawAll2 = await vault.balanceOf(taker2);
    //     console.log("withdraw2 all is :", withdrawAll2.toString(10));
    //     await vault.initiateWithdraw(withdrawAll2, {
    //         from: taker2,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });

    //     let take2BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("take2BeforeWithDraw amount: ", take2BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker2,
    //     });
    //     let take2AfterWithDraw = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("take2AfterWithDraw amount: ", take2AfterWithDraw.toString());
    //     let Premium2 = BigNumber(eth_deposit_amount2.times(2).minus(expect_loss.times(2)).plus(eth_deposit_amount3).minus(expect_loss.times(3)).times(APY).div(PERCENTAGE).times(cycle).div(SECONDS_IN_YEAR));

    //     let real_profit_taker2 = take2AfterWithDraw.minus(take2BeforeWithDraw).minus(eth_deposit_amount2.times(2));
    //     let fee0 = real_profit_taker2.div(9);
    //     let expect_profit_taker2 = eth_deposit_amount2.times(2).minus(expect_loss.times(2)).minus(Premium2.div(7).times(4)).times(ratio2.minus(BigNumber(100).times(1e4)).div(PERCENTAGE)).plus(ldoReward2.div(7).times(4)).integerValue();
    //     console.log("real_profit_taker2 amount: ", real_profit_taker2.toString());
    //     console.log("expect_profit_taker2 amount: ", expect_profit_taker2.toString());

    //     assert.ok(expect_profit_taker2.minus(real_profit_taker2) < BigNumber(4e14));

    //     await vault.collectShares(taker3, {
    //         from: taker3,
    //     });
    //     let withdrawAll3 = await vault.balanceOf(taker3);
    //     console.log("withdraw3 all is :", withdrawAll3.toString(10));
    //     await vault.initiateWithdraw(withdrawAll3, {
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     await ldoRouter.set_transfer_eth_amount(0);
    //     ratio = BigNumber(100).times(1e4);
    //     await stableSwap.set_ratio(ratio);

    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     // check user amount
    //     let take3BeforeWithDraw = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("take3BeforeWithDraw amount: ", take3BeforeWithDraw.toString());
    //     await vault.completeWithdraw({
    //         from: taker3,
    //     });
    //     let take3AfterWithDraw = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("take3AfterWithDraw amount: ", take3AfterWithDraw.toString());
    //     let feeReceipientLast = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeReceipientLast amount: ", feeReceipientLast.toString());
    //     //?????????????
    //     // let curveFinalAmount = BigNumber(eth_deposit_amount.times(3).minus(Premium).times(ratio).div(PERCENTAGE));
    //     // console.log("curveFinalAmount is :", curveFinalAmount.toString(10));

    //     console.log("fee amount: ", feeReceipientLast.minus(feeReceipientBalance).toString());
    //     // totalFee = BigNumber(eth_deposit_amount.times(managementFeeRate).div(PERCENTAGE).plus(IDO_reward.times(performanceFeeRate).div(PERCENTAGE)));
    //     // console.log("totalFee amount: ", totalFee.toString(10));

    // });


    // it("test26_multiple users complete withdraw, then empty vault run several cycles_user deposit again", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });
    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });
    //     let eth_deposit_amount1 = BigNumber(46).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(200).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(77).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });

    //     console.log("Vault is created! ");
    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     // let ratio = BigNumber(110).times(1e4);
    //     // await stableSwap.set_ratio(ratio);
    //     // const IDO_reward = BigNumber(13).times(1e17);
    //     // await ldoRouter.set_transfer_eth_amount(IDO_reward);
    //     // await ldoRouter.deposit({
    //     //     value: BigNumber(130).times(1e17),
    //     //     from: deployer,
    //     // });

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.collectShares(taker2, {
    //         from: taker2,
    //     });
    //     let withdrawAll2 = await vault.balanceOf(taker2);
    //     await vault.collectShares(taker3, {
    //         from: taker3,
    //     });
    //     let withdrawAll3 = await vault.balanceOf(taker3);

    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.initiateWithdraw(withdrawAll2, {
    //         from: taker2,
    //     });
    //     // await vault.initiateWithdraw(BigDecimal(withdrawAll3).minus(1e-18), {
    //     //     from: taker3,
    //     // });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });
    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     withdrawAll = await vault.balanceOf(taker1);
    //     console.log("withdraw all is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(0, 0, {
    //         from: publisher
    //     });

    //     taker1Balance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance: ", taker1Balance.toString());

    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });

    //     takerBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1Balance1: ", takerBalance1.toString());
    //     console.log("diff is: ", takerBalance1.minus(taker1Balance).toString(10));
    // });

    // it("test27_terminate after the 1st round_the money in optiontrading should payback", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });

    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount1 = BigNumber(4).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(8).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(16).times(1e18);
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });

    //     let vault_init = await web3.eth.getBalance(vault.address);
    //     console.log("vault_init ether amount", vault_init.toString());

    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = BigNumber(await vault.balanceOf(taker1));
    //     console.log("taker1's share is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll, {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), 0, {
    //         from: publisher
    //     });

    //     let actualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", actualBalance.toString());
    //     await vault.advanceToEndTime();

    //     await vault.terminate(BigNumber(1).times(1e18), {
    //         from: publisher,
    //     });
    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance ", optionsTradingBalance.toString());
    //     assert.strictEqual(optionsTradingBalance.toString(10), '0');

    //     let userInfo1 = await vault.userReceipts(taker1);

    //     console.log("userInfo1.pendingAmount", userInfo1.pendingAmount.toString(10));
    //     console.log("userInfo1.depositRound", userInfo1.depositRound.toString(10));
    //     console.log("userInfo1.withdrawRound", userInfo1.withdrawRound.toString(10));
    //     console.log("userInfo1.unredeemedShares", userInfo1.unredeemedShares.toString(10));
    //     console.log("ususerInfo1.withdrawShareserInfo1", userInfo1.withdrawShares.toString(10));
    //     console.log("useuserInfo1.withdrawableAmount", userInfo1.withdrawableAmount.toString(10));

    //     let userInfo2 = await vault.userReceipts(taker2);
    //     console.log("userInfo2.pendingAmount", userInfo2.pendingAmount.toString(10));
    //     console.log("userInfo2.depositRound", userInfo2.depositRound.toString(10));
    //     console.log("userInfo2.withdrawRound", userInfo2.withdrawRound.toString(10));
    //     console.log("userInfo2.unredeemedShares", userInfo2.unredeemedShares.toString(10));
    //     console.log("userInfo2.withdrawShares", userInfo2.withdrawShares.toString(10));
    //     console.log("userInfo2.withdrawableAmount", userInfo2.withdrawableAmount.toString(10));

    //     let userInfo3 = await vault.userReceipts(taker3);
    //     console.log("userInfo3.pendingAmount", userInfo3.pendingAmount.toString(10));
    //     console.log("userInfo3.depositRound", userInfo3.depositRound.toString(10));
    //     console.log("userInfo3.withdrawRound", userInfo3.withdrawRound.toString(10));
    //     console.log("userInfo3.unredeemedShares", userInfo3.unredeemedShares.toString(10));
    //     console.log("userInfo3.withdrawShares", userInfo3.withdrawShares.toString(10));
    //     console.log("userInfo3.withdrawableAmount", userInfo3.withdrawableAmount.toString(10));
    //     let beforeexit = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeexit ether amount", beforeexit.toString());
    //     await vault.exit({
    //         from: taker1,
    //     });

    //     let aftBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 aftBalance ether amount", aftBalance.toString());
    //     let beforeexit2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 beforeexit ether amount", beforeexit2.toString());

    //     await vault.exit({
    //         from: taker2,
    //     });
    //     let userInfo11 = await vault.userReceipts(taker1);

    //     console.log("userInfo11.pendingAmount", userInfo11.pendingAmount.toString(10));
    //     console.log("userInfo11.depositRound", userInfo11.depositRound.toString(10));
    //     console.log("userInfo11.withdrawRound", userInfo11.withdrawRound.toString(10));
    //     console.log("userInfo11.unredeemedShares", userInfo11.unredeemedShares.toString(10));
    //     console.log("userInfo11.withdrawShares", userInfo11.withdrawShares.toString(10));
    //     console.log("userInfo11.withdrawableAmount", userInfo11.withdrawableAmount.toString(10));

    //     let userInfo22 = await vault.userReceipts(taker2);
    //     console.log("userInfo22.pendingAmount", userInfo22.pendingAmount.toString(10));
    //     console.log("userInfo22.depositRound", userInfo22.depositRound.toString(10));
    //     console.log("userInfo22.withdrawRound", userInfo22.withdrawRound.toString(10));
    //     console.log("userInfo22.unredeemedShares", userInfo22.unredeemedShares.toString(10));
    //     console.log("userInfo22.withdrawShares", userInfo22.withdrawShares.toString(10));
    //     console.log("userInfo22.withdrawableAmount", userInfo22.withdrawableAmount.toString(10));

    //     let userInfo33 = await vault.userReceipts(taker3);
    //     console.log("userInfo33.pendingAmount", userInfo33.pendingAmount.toString(10));
    //     console.log("userInfo33.depositRound", userInfo33.depositRound.toString(10));
    //     console.log("userInfo33.withdrawRound", userInfo33.withdrawRound.toString(10));
    //     console.log("userInfo33.unredeemedShares", userInfo33.unredeemedShares.toString(10));
    //     console.log("userInfo33.withdrawShares", userInfo33.withdrawShares.toString(10));
    //     console.log("userInfo33.withdrawableAmount", userInfo33.withdrawableAmount.toString(10));

    //     let aftBalance2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 aftBalance ether amount", aftBalance2.toString());
    //     let beforeexit3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 beforeexit ether amount", beforeexit3.toString());
    //     let vaultbal = BigNumber(await web3.eth.getBalance(vault.address));
    //     console.log("vault balance left", vaultbal.toString());

    //     await vault.exit({
    //         from: taker3,
    //     });
    //     let aftBalance3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 aftBalance ether amount", aftBalance3.toString());
    // });
    // it("test28_terminate after the 1st round_user1 has different status_withdraw multiple times_the money in optiontrading should payback", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });

    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount1 = BigNumber(4).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(8).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(16).times(1e18);

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });

    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1.plus(100),
    //         from: taker1,
    //     });
    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = BigNumber(await vault.balanceOf(taker1));
    //     console.log("taker1's share is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll.div(2), {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();

    //     await vault.settlement(BigNumber(1e18), 0, {
    //         from: publisher
    //     });
    //     await vault.initiateWithdraw(withdrawAll.div(2), {
    //         from: taker1,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });
    //     let actualBalance = await web3.eth.getBalance(vault.address);
    //     console.log("vault ether amount", actualBalance.toString());
    //     await vault.advanceToEndTime();

    //     await vault.terminate(BigNumber(1).times(1e18), {
    //         from: publisher,
    //     });

    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance ", optionsTradingBalance.toString());
    //     assert.strictEqual(optionsTradingBalance.toString(10), '0');

    //     let userInfo1 = await vault.userReceipts(taker1);

    //     console.log("userInfo1.pendingAmount", userInfo1.pendingAmount.toString(10));
    //     console.log("userInfo1.depositRound", userInfo1.depositRound.toString(10));
    //     console.log("userInfo1.withdrawRound", userInfo1.withdrawRound.toString(10));
    //     console.log("userInfo1.unredeemedShares", userInfo1.unredeemedShares.toString(10));
    //     console.log("ususerInfo1.withdrawShareserInfo1", userInfo1.withdrawShares.toString(10));
    //     console.log("useuserInfo1.withdrawableAmount", userInfo1.withdrawableAmount.toString(10));

    //     let userInfo2 = await vault.userReceipts(taker2);
    //     console.log("userInfo2.pendingAmount", userInfo2.pendingAmount.toString(10));
    //     console.log("userInfo2.depositRound", userInfo2.depositRound.toString(10));
    //     console.log("userInfo2.withdrawRound", userInfo2.withdrawRound.toString(10));
    //     console.log("userInfo2.unredeemedShares", userInfo2.unredeemedShares.toString(10));
    //     console.log("userInfo2.withdrawShares", userInfo2.withdrawShares.toString(10));
    //     console.log("userInfo2.withdrawableAmount", userInfo2.withdrawableAmount.toString(10));

    //     let userInfo3 = await vault.userReceipts(taker3);
    //     console.log("userInfo3.pendingAmount", userInfo3.pendingAmount.toString(10));
    //     console.log("userInfo3.depositRound", userInfo3.depositRound.toString(10));
    //     console.log("userInfo3.withdrawRound", userInfo3.withdrawRound.toString(10));
    //     console.log("userInfo3.unredeemedShares", userInfo3.unredeemedShares.toString(10));
    //     console.log("userInfo3.withdrawShares", userInfo3.withdrawShares.toString(10));
    //     console.log("userInfo3.withdrawableAmount", userInfo3.withdrawableAmount.toString(10));
    //     let beforeexit = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeexit ether amount", beforeexit.toString());

    //     await vault.exit({
    //         from: taker1,
    //     });
    //     let beforeexit0 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 beforeexit0 ether amount", beforeexit0.toString());

    //     await vault.exit({
    //         from: taker1,
    //     });
    //     let aftBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 aftBalance ether amount", aftBalance.toString());
    //     let beforeexit2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 beforeexit ether amount", beforeexit2.toString());

    //     await vault.exit({
    //         from: taker2,
    //     });
    //     let userInfo11 = await vault.userReceipts(taker1);

    //     console.log("userInfo11.pendingAmount", userInfo11.pendingAmount.toString(10));
    //     console.log("userInfo11.depositRound", userInfo11.depositRound.toString(10));
    //     console.log("userInfo11.withdrawRound", userInfo11.withdrawRound.toString(10));
    //     console.log("userInfo11.unredeemedShares", userInfo11.unredeemedShares.toString(10));
    //     console.log("userInfo11.withdrawShares", userInfo11.withdrawShares.toString(10));
    //     console.log("userInfo11.withdrawableAmount", userInfo11.withdrawableAmount.toString(10));

    //     let userInfo22 = await vault.userReceipts(taker2);
    //     console.log("userInfo22.pendingAmount", userInfo22.pendingAmount.toString(10));
    //     console.log("userInfo22.depositRound", userInfo22.depositRound.toString(10));
    //     console.log("userInfo22.withdrawRound", userInfo22.withdrawRound.toString(10));
    //     console.log("userInfo22.unredeemedShares", userInfo22.unredeemedShares.toString(10));
    //     console.log("userInfo22.withdrawShares", userInfo22.withdrawShares.toString(10));
    //     console.log("userInfo22.withdrawableAmount", userInfo22.withdrawableAmount.toString(10));

    //     let userInfo33 = await vault.userReceipts(taker3);
    //     console.log("userInfo33.pendingAmount", userInfo33.pendingAmount.toString(10));
    //     console.log("userInfo33.depositRound", userInfo33.depositRound.toString(10));
    //     console.log("userInfo33.withdrawRound", userInfo33.withdrawRound.toString(10));
    //     console.log("userInfo33.unredeemedShares", userInfo33.unredeemedShares.toString(10));
    //     console.log("userInfo33.withdrawShares", userInfo33.withdrawShares.toString(10));
    //     console.log("userInfo33.withdrawableAmount", userInfo33.withdrawableAmount.toString(10));

    //     let aftBalance2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 aftBalance ether amount", aftBalance2.toString());
    //     let beforeexit3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 beforeexit ether amount", beforeexit3.toString());
    //     let vaultbal = BigNumber(await web3.eth.getBalance(vault.address));
    //     console.log("vault balance left", vaultbal.toString());

    //     await vault.exit({
    //         from: taker3,
    //     });
    //     let aftBalance3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 aftBalance ether amount", aftBalance3.toString());
    // });

    // it("test16_terminate after the 1st round but before settlement _the money in optiontrading should payback", async () => {
    //     vault = await Vault.new(
    //         publisher,
    //         feeRecipient,
    //         _wETH.address,
    //         _STETH.address,

    //         managementFeeRate,
    //         performanceFeeRate,
    //         cycle,  //cycle
    //         {
    //             from: deployer
    //         });

    //     await vault.setQuoter(quoter.address);

    //     let start_t = parseInt(Date.now() / 1000);
    //     console.log("start_t is : ", start_t.toString(10));
    //     let endTime = parseInt(Date.now() / 1000 + 7 * 24 * 60 * 60);
    //     console.log("endTime is : ", endTime.toString(10));
    //     optionsTrading = await OptionsTrading.new(vault.address, trader, governance, {
    //         from: deployer
    //     });
    //     await vault.initialize(
    //         APY,
    //         maxVolume,
    //         minDeposit,
    //         endTime,
    //         stableSwap.address,
    //         curveLPToken.address,
    //         ldoRouter.address,
    //         curveGauge.address,
    //         priceFeeder.address,
    //         optionsTrading.address,
    //         {
    //             from: deployer
    //         });

    //     console.log("Vault is created! ");

    //     await vault.setPriceFeeder(priceFeeder.address, {
    //         from: publisher
    //     });

    //     let eth_deposit_amount1 = BigNumber(10).times(1e18);
    //     let eth_deposit_amount2 = BigNumber(10).times(1e18);
    //     let eth_deposit_amount3 = BigNumber(10).times(1e18);

    //     let ratio = BigNumber(100).times(1e4);

    //     let befBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 befBalance ether amount", befBalance.toString());
    //     let befBalance2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 befBalance ether amount", befBalance2.toString());
    //     let befBalance3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 befBalance ether amount", befBalance3.toString());

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount1,
    //         from: taker1,
    //     });

    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount2,
    //         from: taker2,
    //     });
    //     await vault.deposit(ZERO_ADDRESS, {
    //         value: eth_deposit_amount3,
    //         from: taker3,
    //     });
    //     await vault.advanceToEndTime();
    //     // let sharePrice = await vault.currentSharePrice();
    //     // console.log("share price is :", sharePrice);

    //     await vault.settlement(BigNumber(1e18), BigNumber(1e18), {
    //         from: publisher
    //     });

    //     await vault.collectShares(taker1, {
    //         from: taker1,
    //     });
    //     let withdrawAll = BigNumber(await vault.balanceOf(taker1));
    //     console.log("taker1's share is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll.div(2), {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();
    //     await vault.settlement(BigNumber(1e18), 0, {
    //         from: publisher
    //     });
    //     let optionYield = BigNumber(20).times(1e18);
    //     await optionsTrading.payOptionYield({
    //         value: optionYield,
    //         from: trader,
    //     });
    //     await vault.completeWithdraw({
    //         from: taker1,
    //     });
    //     withdrawAll = BigNumber(await vault.balanceOf(taker1));
    //     console.log("taker1's share is :", withdrawAll.toString(10));
    //     await vault.initiateWithdraw(withdrawAll.div(2), {
    //         from: taker1,
    //     });
    //     await vault.advanceToEndTime();

    //     await vault.terminate(BigNumber(1).times(1e18), {
    //         from: publisher,
    //     });
    //     let optionsTradingBalance = BigNumber(await web3.eth.getBalance(optionsTrading.address));
    //     console.log("optionsTradingBalance ", optionsTradingBalance.toString());

    //     await vault.exit({
    //         from: taker1,
    //     });
    //     await vault.exit({
    //         from: taker2,
    //     });
    //     await vault.exit({
    //         from: taker3,
    //     });
    //     let aftBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("taker1 aftBalance ether amount", aftBalance.toString());
    //     let beforeexit2 = BigNumber(await web3.eth.getBalance(taker2));
    //     console.log("taker2 aftBalance ether amount", beforeexit2.toString());

    //     let aftBalance3 = BigNumber(await web3.eth.getBalance(taker3));
    //     console.log("taker3 aftBalance ether amount", aftBalance3.toString());
    // });
    // new
    // it("test20_taker1 deposit at the 0 round_rolltonext_proposal", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

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
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
    //     console.log("mockNullStrategyC: ", mockNullStrategyC.address);
    //     const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
    //     console.log("mockNullStrategyD: ", mockNullStrategyD.address);
    //     const fn1 = "addStrategy(address)";
    //     const selector1 = Abi.encodeFunctionSignature(fn1);
    //     const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
    //     const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
    //     const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
    //     const data2 = `${selector1}${encodedParams2.split("0x")[1]}`

    //     await proposal.propose(data1, {
    //         from: deployer
    //     });
    //     await proposal.propose(data2, {
    //         from: deployer
    //     });

    //     let proposals = await proposal.getProposals();
    //     console.log("proposals are : ", proposals);

    //     let polls;
    //     await proposal.voteFor(proposals[0], user1Stone.div(2), true,
    //         {
    //             from: taker1
    //         });
    //     await proposal.voteFor(proposals[1], user1Stone.div(2), false,
    //         {
    //             from: taker1
    //         });

    //     await proposal.voteFor(proposals[0], user2Stone.div(2), false,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[1], user2Stone.div(2), true,
    //         {
    //             from: taker2
    //         });

    //     let canVote1 = await proposal.canVote(proposals[0]);
    //     let canVote2 = await proposal.canVote(proposals[1]);
    //     assert.strictEqual(canVote1, true);
    //     assert.strictEqual(canVote2, true);
    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     let canExec1 = await proposal.canExec(proposals[0]);
    //     let canExec2 = await proposal.canExec(proposals[1]);
    //     assert.strictEqual(canExec1, true);
    //     assert.strictEqual(canExec2, false);
    //     await proposal.execProposal(proposals[0]);
    //     user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));
    //     user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     assert.strictEqual(user1Stone.toString(10), '0');
    //     assert.strictEqual(user2Stone.toString(10), '0');


    //     const strategyController = await StrategyController.at(strategyControllerAddr);
    //     let strategies = await strategyController.getStrategies();
    //     assert.strictEqual(strategies[0].length, 3);
    //     assert.strictEqual(strategies[0][2], mockNullStrategyC.address);

    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     canVote1 = await proposal.canVote(proposals[0]);
    //     canVote2 = await proposal.canVote(proposals[1]);
    //     assert.strictEqual(canVote1, false);
    //     assert.strictEqual(canVote2, false);
    //     await proposal.retrieveTokenFor(proposals[0],
    //         {
    //             from: taker1
    //         });
    //     await proposal.retrieveAllToken();

    //     // assert.strictEqual(strategies[0].length, 3);
    //     // assert.strictEqual(strategies[0].length, 3);

    // });

    // it("test20_taker1 deposit at the 0 round_rolltonext_proposal_retrive_twice", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

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
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     await stoneVault.rollToNextRound();

    //     await proposal.setProposer(proposer,
    //         {
    //             from: deployer
    //         });
    //     const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
    //     console.log("mockNullStrategyC: ", mockNullStrategyC.address);
    //     const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
    //     console.log("mockNullStrategyD: ", mockNullStrategyD.address);

    //     const fn1 = "addStrategy(address)";
    //     const selector1 = Abi.encodeFunctionSignature(fn1);
    //     const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
    //     const data1 = `${selector1}${encodedParams1.split("0x")[1]}`;
    //     const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
    //     const data2 = `${selector1}${encodedParams2.split("0x")[1]}`;
    //     await proposal.propose(data1, {
    //         from: proposer
    //     });
    //     await proposal.propose(data2, {
    //         from: proposer
    //     });

    //     const fn2 = "updatePortfolioConfig(address[],uint256[])";
    //     const selector2 = Abi.encodeFunctionSignature(fn2);
    //     const encodedParams3 = Abi.encodeParameters(
    //         ["address[]", "uint256[]"],
    //         [[mockNullStrategyA.address, mockNullStrategyB.address, mockNullStrategyC.address], [1e5, 2e5, 7e5]]
    //     );
    //     const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
    //     console.log("data3: ", data3);

    //     await proposal.propose(data3, {
    //         from: proposer
    //     });

    //     let proposals = await proposal.getProposals();
    //     console.log("proposals are : ", proposals);

    //     let polls;
    //     await proposal.voteFor(proposals[0], user1Stone.div(2), true,
    //         {
    //             from: taker1
    //         });
    //     await proposal.voteFor(proposals[1], user1Stone.div(2), false,
    //         {
    //             from: taker1
    //         });

    //     await proposal.voteFor(proposals[0], user2Stone.div(2), false,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[1], user2Stone.div(4), true,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[2], user2Stone.div(4), true,
    //         {
    //             from: taker2
    //         });
    //     let canVote1 = await proposal.canVote(proposals[0]);
    //     let canVote2 = await proposal.canVote(proposals[1]);
    //     let canVote3 = await proposal.canVote(proposals[2]);

    //     assert.strictEqual(canVote1, true);
    //     assert.strictEqual(canVote2, true);
    //     assert.strictEqual(canVote3, true);

    //     const strategyController = await StrategyController.at(strategyControllerAddr);
    //     let strategies = await strategyController.getStrategies();
    //     console.log("strategies are : ", strategies);
    //     assert.strictEqual(strategies[0].length, 2);

    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     let canExec1 = await proposal.canExec(proposals[0]);
    //     let canExec2 = await proposal.canExec(proposals[1]);
    //     let canExec3 = await proposal.canExec(proposals[2]);

    //     assert.strictEqual(canExec1, true);
    //     assert.strictEqual(canExec2, false);
    //     assert.strictEqual(canExec3, true);

    //     await proposal.execProposal(proposals[0]);
    //     await proposal.execProposal(proposals[2]);

    //     strategies = await strategyController.getStrategies();
    //     console.log("strategies are : ", strategies);

    //     assert.strictEqual(strategies[0].length, 3);
    //     assert.strictEqual(strategies[0][2], mockNullStrategyC.address);
    //     console.log("strategyC's portion is : ", strategies[1][2].toString(10));

    //     let user1Stone_vote = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_vote is : ", user1Stone_vote.toString(10));
    //     let user2Stone_vote = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_vote is : ", user2Stone_vote.toString(10));
    //     assert.strictEqual(user1Stone_vote.toString(10), '0');
    //     assert.strictEqual(user2Stone_vote.toString(10), '0');

    //     canVote1 = await proposal.canVote(proposals[0]);
    //     canVote2 = await proposal.canVote(proposals[1]);
    //     assert.strictEqual(canVote1, false);
    //     assert.strictEqual(canVote2, false);
    //     await proposal.retrieveTokenFor(proposals[0],
    //         {
    //             from: taker1
    //         });
    //     let user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
    //     let user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), '0');

    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker1
    //         });
    //     user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
    //     user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), '0');
    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker2
    //         });
    //     user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), user2Stone.toString(10));

    // });
    // it("test22_negative_taker1 deposit at the 0 round_rolltonext_proposal_execute before vote deadline_withdraw multiple times", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);

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
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));

    //     await stoneVault.rollToNextRound();
    //     const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
    //     console.log("mockNullStrategyC: ", mockNullStrategyC.address);
    //     const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
    //     console.log("mockNullStrategyD: ", mockNullStrategyD.address);
    //     const fn1 = "addStrategy(address)";
    //     const selector1 = Abi.encodeFunctionSignature(fn1);
    //     const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
    //     const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
    //     const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
    //     const data2 = `${selector1}${encodedParams2.split("0x")[1]}`

    //     await proposal.propose(data1, {
    //         from: deployer
    //     });
    //     await proposal.propose(data2, {
    //         from: deployer
    //     });

    //     let proposals = await proposal.getProposals();
    //     console.log("proposals are : ", proposals);

    //     let polls;
    //     await proposal.voteFor(proposals[0], user1Stone.div(2), true,
    //         {
    //             from: taker1
    //         });
    //     await proposal.voteFor(proposals[1], user1Stone.div(2), false,
    //         {
    //             from: taker1
    //         });

    //     await proposal.voteFor(proposals[0], user2Stone.div(2), false,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[1], user2Stone.div(2), true,
    //         {
    //             from: taker2
    //         });

    //     let canVote1 = await proposal.canVote(proposals[0]);
    //     let canVote2 = await proposal.canVote(proposals[1]);
    //     assert.strictEqual(canVote1, true);
    //     assert.strictEqual(canVote2, true);
    //     let canExec1 = await proposal.canExec(proposals[0]);
    //     let canExec2 = await proposal.canExec(proposals[1]);
    //     assert.strictEqual(canExec1, false);
    //     assert.strictEqual(canExec2, false);

    //     // await truffleAssert.fails(
    //     //     proposal.execProposal(proposals[0]),
    //     //     truffleAssert.ErrorType.REVERT,
    //     //     "cannot exec"
    //     // );
    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     canExec1 = await proposal.canExec(proposals[0]);
    //     canExec2 = await proposal.canExec(proposals[1]);
    //     assert.strictEqual(canExec1, true);
    //     assert.strictEqual(canExec2, false);
    //     await proposal.execProposal(proposals[0]);
    //     user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));
    //     user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     assert.strictEqual(user1Stone.toString(10), '0');
    //     assert.strictEqual(user2Stone.toString(10), '0');


    //     const strategyController = await StrategyController.at(strategyControllerAddr);
    //     let strategies = await strategyController.getStrategies();
    //     assert.strictEqual(strategies[0].length, 3);
    //     assert.strictEqual(strategies[0][2], mockNullStrategyC.address);

    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     canVote1 = await proposal.canVote(proposals[0]);
    //     canVote2 = await proposal.canVote(proposals[1]);
    //     assert.strictEqual(canVote1, false);
    //     assert.strictEqual(canVote2, false);
    //     await proposal.retrieveTokenFor(proposals[0],
    //         {
    //             from: taker1
    //         });
    //     await proposal.retrieveAllToken();

    //     // assert.strictEqual(strategies[0].length, 3);
    //     // assert.strictEqual(strategies[0].length, 3);

    // });


    // it("test20_taker1 deposit at the 0 round_rolltonext_proposal_one strategy portion more than before_exec proposal_rolltonext_check strategy value", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);
    //     let strategyControllerContract = await StrategyController.new(assetsVault.address, [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [5e5, 5e5]);
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
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(2),
    //         from: taker2
    //     });

    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     let strategyA_vaule = BigNumber(await strategyControllerContract.getStrategyValidValue(mockNullStrategyAAddr));
    //     let strategyB_vaule = BigNumber(await strategyControllerContract.getStrategyValidValue(mockNullStrategyBAddr));
    //     console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
    //     console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));

    //     await stoneVault.rollToNextRound();

    //     await proposal.setProposer(proposer,
    //         {
    //             from: deployer
    //         });
    //     const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
    //     console.log("mockNullStrategyC: ", mockNullStrategyC.address);
    //     const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
    //     console.log("mockNullStrategyD: ", mockNullStrategyD.address);

    //     const fn1 = "addStrategy(address)";
    //     const selector1 = Abi.encodeFunctionSignature(fn1);
    //     const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
    //     const data1 = `${selector1}${encodedParams1.split("0x")[1]}`;
    //     const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
    //     const data2 = `${selector1}${encodedParams2.split("0x")[1]}`;
    //     await proposal.propose(data1, {
    //         from: proposer
    //     });
    //     await proposal.propose(data2, {
    //         from: proposer
    //     });

    //     const fn2 = "updatePortfolioConfig(address[],uint256[])";
    //     const selector2 = Abi.encodeFunctionSignature(fn2);
    //     const encodedParams3 = Abi.encodeParameters(
    //         ["address[]", "uint256[]"],
    //         [[mockNullStrategyA.address, mockNullStrategyB.address, mockNullStrategyC.address], [1e5, 2e5, 7e5]]
    //     );
    //     const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
    //     console.log("data3: ", data3);

    //     await proposal.propose(data3, {
    //         from: proposer
    //     });

    //     let proposals = await proposal.getProposals();
    //     console.log("proposals are : ", proposals);

    //     let polls;
    //     await proposal.voteFor(proposals[0], user1Stone.div(2), true,
    //         {
    //             from: taker1
    //         });
    //     await proposal.voteFor(proposals[1], user1Stone.div(2), false,
    //         {
    //             from: taker1
    //         });

    //     await proposal.voteFor(proposals[0], user2Stone.div(2), false,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[1], user2Stone.div(4), true,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[2], user2Stone.div(4), true,
    //         {
    //             from: taker2
    //         });
    //     let canVote1 = await proposal.canVote(proposals[0]);
    //     let canVote2 = await proposal.canVote(proposals[1]);
    //     let canVote3 = await proposal.canVote(proposals[2]);

    //     assert.strictEqual(canVote1, true);
    //     assert.strictEqual(canVote2, true);
    //     assert.strictEqual(canVote3, true);

    //     const strategyController = await StrategyController.at(strategyControllerAddr);
    //     let strategies = await strategyController.getStrategies();
    //     console.log("strategies are : ", strategies);
    //     assert.strictEqual(strategies[0].length, 2);

    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     let canExec1 = await proposal.canExec(proposals[0]);
    //     let canExec2 = await proposal.canExec(proposals[1]);
    //     let canExec3 = await proposal.canExec(proposals[2]);

    //     assert.strictEqual(canExec1, true);
    //     assert.strictEqual(canExec2, false);
    //     assert.strictEqual(canExec3, true);

    //     //await proposal.execProposal(proposals[0]);
    //     await proposal.execProposal(proposals[2]);

    //     strategies = await strategyController.getStrategies();
    //     console.log("strategies are : ", strategies);

    //     assert.strictEqual(strategies[0].length, 3);
    //     assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
    //     console.log("strategyA's portion is : ", strategies[1][0].toString(10));
    //     assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
    //     console.log("strategyB's portion is : ", strategies[1][1].toString(10));
    //     assert.strictEqual(strategies[0][2], mockNullStrategyC.address);
    //     console.log("strategyC's portion is : ", strategies[1][2].toString(10));

    //     let user1Stone_vote = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_vote is : ", user1Stone_vote.toString(10));
    //     let user2Stone_vote = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_vote is : ", user2Stone_vote.toString(10));
    //     assert.strictEqual(user1Stone_vote.toString(10), '0');
    //     assert.strictEqual(user2Stone_vote.toString(10), '0');

    //     canVote1 = await proposal.canVote(proposals[0]);
    //     canVote2 = await proposal.canVote(proposals[1]);
    //     assert.strictEqual(canVote1, false);
    //     assert.strictEqual(canVote2, false);

    //     await stoneVault.rollToNextRound();

    //     await proposal.retrieveTokenFor(proposals[0],
    //         {
    //             from: taker1
    //         });
    //     let user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
    //     let user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), '0');

    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker1
    //         });
    //     user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
    //     user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), '0');
    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker2
    //         });
    //     user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), user2Stone.toString(10));

    // });
    // it("test21_taker1 deposit at the 0 round_rolltonext_taker2 deposit at the 1st round_proposal one strategy portion less than before_exec proposal_taker1 request withdraw_rolltonext_taker1/taker2 instant withdraw_check strategy value", async () => {
    //     const stoneVault = await StoneVault.new(
    //         minter.address,
    //         proposalAddr,
    //         assetsVaultAddr,
    //         [mockNullStrategyAAddr, mockNullStrategyBAddr],
    //         [2e5, 8e5]
    //     );
    //     console.log("stoneVault: ", stoneVault.address);
    //     let proposal = await Proposal.new(stoneVault.address);
    //     console.log("proposal: ", proposal.address);
    //     const strategyControllerAddr = await stoneVault.strategyController();

    //     const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
    //     console.log("assetsVault: ", assetsVault.address);

    //     const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
    //     console.log("mockNullStrategyA: ", mockNullStrategyA.address);

    //     const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
    //     console.log("mockNullStrategyB: ", mockNullStrategyB.address);
    //     const strategyController = await StrategyController.at(strategyControllerAddr);

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
    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });

    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
    //     let sharePrice = await stoneVault.currentSharePrice();
    //     console.log("sharePrice is : ", sharePrice.toString(10));
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })

    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone is : ", user1Stone.toString(10));

    //     await stoneVault.rollToNextRound();

    //     let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyAAddr));
    //     let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
    //     console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
    //     console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));
    //     assert.strictEqual(strategyA_vaule.toString(10), eth_deposit_amount.times(0.2).toString(10));
    //     assert.strictEqual(strategyB_vaule.toString(10), eth_deposit_amount.times(0.8).toString(10));

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount.div(4),
    //         from: taker2
    //     });
    //     let total = eth_deposit_amount.times(1.25);
    //     await proposal.setProposer(proposer,
    //         {
    //             from: deployer
    //         });
    //     const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
    //     console.log("mockNullStrategyC: ", mockNullStrategyC.address);
    //     const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
    //     console.log("mockNullStrategyD: ", mockNullStrategyD.address);

    //     const fn1 = "addStrategy(address)";
    //     const selector1 = Abi.encodeFunctionSignature(fn1);
    //     const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
    //     const data1 = `${selector1}${encodedParams1.split("0x")[1]}`;
    //     const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
    //     const data2 = `${selector1}${encodedParams2.split("0x")[1]}`;
    //     await proposal.propose(data1, {
    //         from: proposer
    //     });
    //     await proposal.propose(data2, {
    //         from: proposer
    //     });

    //     const fn2 = "updatePortfolioConfig(address[],uint256[])";
    //     const selector2 = Abi.encodeFunctionSignature(fn2);
    //     const encodedParams3 = Abi.encodeParameters(
    //         ["address[]", "uint256[]"],
    //         [[mockNullStrategyA.address, mockNullStrategyB.address, mockNullStrategyC.address], [4e5, 2e5, 4e5]]
    //     );
    //     const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
    //     console.log("data3: ", data3);

    //     await proposal.propose(data3, {
    //         from: proposer
    //     });

    //     let proposals = await proposal.getProposals();
    //     console.log("proposals are : ", proposals);
    //     let canVote1 = await proposal.canVote(proposals[0]);
    //     let canVote2 = await proposal.canVote(proposals[1]);
    //     let canVote3 = await proposal.canVote(proposals[2]);

    //     assert.strictEqual(canVote1, true);
    //     assert.strictEqual(canVote2, true);
    //     assert.strictEqual(canVote3, true);

    //     await proposal.voteFor(proposals[0], user1Stone.div(2), true,
    //         {
    //             from: taker1
    //         });
    //     await proposal.voteFor(proposals[1], user1Stone.div(2), false,
    //         {
    //             from: taker1
    //         });
    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     await proposal.voteFor(proposals[0], user2Stone.div(2), false,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[1], user2Stone.div(4), true,
    //         {
    //             from: taker2
    //         });
    //     await proposal.voteFor(proposals[2], user2Stone.div(8), true,
    //         {
    //             from: taker2
    //         });

    //     let strategies = await strategyController.getStrategies();
    //     console.log("strategies are : ", strategies);
    //     assert.strictEqual(strategies[0].length, 2);

    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     let canExec1 = await proposal.canExec(proposals[0]);
    //     let canExec2 = await proposal.canExec(proposals[1]);
    //     let canExec3 = await proposal.canExec(proposals[2]);

    //     assert.strictEqual(canExec1, true);
    //     assert.strictEqual(canExec2, false);
    //     assert.strictEqual(canExec3, true);

    //     await proposal.execProposal(proposals[2]);
    //     strategies = await strategyController.getStrategies();
    //     console.log("strategies are : ", strategies);

    //     assert.strictEqual(strategies[0].length, 3);
    //     assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
    //     console.log("strategyA's portion is : ", strategies[1][0].toString(10));
    //     assert.strictEqual(strategies[1][0].toString(10), BigNumber(4e5).toString(10));
    //     assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
    //     console.log("strategyB's portion is : ", strategies[1][1].toString(10));
    //     assert.strictEqual(strategies[1][1].toString(10), BigNumber(2e5).toString(10));

    //     assert.strictEqual(strategies[0][2], mockNullStrategyC.address);
    //     console.log("strategyC's portion is : ", strategies[1][2].toString(10));
    //     assert.strictEqual(strategies[1][2].toString(10), BigNumber(4e5).toString(10));

    //     await proposal.retrieveTokenFor(proposals[0],
    //         {
    //             from: taker1
    //         });
    //     let user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
    //     let user2Stone_1 = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_1 is : ", user2Stone_1.toString(10));
    //     assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
    //     assert.strictEqual(user2Stone_1.toString(10), user2Stone.div(8).toString(10));

    //     // // taker1 should fail to withdraw all
    //     // await stoneVault.requestWithdraw(user1Stone, {
    //     //     from: taker1
    //     // });
    //     // only can withdraw the retrieved
    //     await stoneVault.requestWithdraw(user1Stone_retrieve, {
    //         from: taker1
    //     });
    //     strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyAAddr));
    //     strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
    //     let strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyC.address));

    //     console.log("strategyA_vaule1 is : ", strategyA_vaule.toString(10));
    //     console.log("strategyB_vaule1 is : ", strategyB_vaule.toString(10));
    //     console.log("strategyC_vaule1 is : ", strategyC_vaule.toString(10));
    //     assert.strictEqual(strategyA_vaule.toString(10), eth_deposit_amount.times(0.2).toString(10));
    //     assert.strictEqual(strategyB_vaule.toString(10), eth_deposit_amount.times(0.8).toString(10));
    //     assert.strictEqual(strategyC_vaule.toString(10), '0');

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual('0', userStone1.toString(10));

    //     await stoneVault.rollToNextRound();

    //     strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyAAddr));
    //     strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
    //     strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyC.address));

    //     console.log("strategyA_vaule2 is : ", strategyA_vaule.toString(10));
    //     console.log("strategyB_vaule2 is : ", strategyB_vaule.toString(10));
    //     console.log("strategyC_vaule2 is : ", strategyC_vaule.toString(10));

    //     //value in strategies should be adjusted according to the portion after roll
    //     assert.strictEqual(strategyA_vaule.toString(10), total.minus(eth_deposit_amount.div(2)).times(0.4).toString(10));
    //     assert.strictEqual(strategyB_vaule.toString(10), total.minus(eth_deposit_amount.div(2)).times(0.2).toString(10));
    //     assert.strictEqual(strategyC_vaule.toString(10), total.minus(eth_deposit_amount.div(2)).times(0.4).toString(10));


    //     await stoneVault.instantWithdraw(user1Stone_retrieve, 0, {
    //         from: taker1
    //     });
    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     let diff = actualBalance2.integerValue().minus(actualBalance1.integerValue());
    //     console.log("taker1 diff:", diff.toString());
    //     assert.ok(diff > 0);
    //     assert.ok(diff < BigNumber(6e6));

    //     // taker2 should success to instant withdraw 1/8
    //     await stoneVault.instantWithdraw(0, user2Stone.div(8), {
    //         from: taker2
    //     });
    //     strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyAAddr));
    //     strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
    //     strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyC.address));

    //     console.log("strategyA_vaule3 is : ", strategyA_vaule.toString(10));
    //     console.log("strategyB_vaule3 is : ", strategyB_vaule.toString(10));
    //     console.log("strategyC_vaule3 is : ", strategyC_vaule.toString(10));
    //     //value in strategies should be adjusted according to the portion after instantWithdraw
    //     assert.strictEqual(strategyA_vaule.toString(10), total.minus(eth_deposit_amount.div(2).plus(eth_deposit_amount.div(4).div(8))).times(0.4).toString(10));
    //     assert.strictEqual(strategyB_vaule.toString(10), total.minus(eth_deposit_amount.div(2).plus(eth_deposit_amount.div(4).div(8))).times(0.2).toString(10));
    //     assert.strictEqual(strategyC_vaule.toString(10), total.minus(eth_deposit_amount.div(2).plus(eth_deposit_amount.div(4).div(8))).times(0.4).toString(10));

    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker1
    //         });
    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker2
    //         });
    //     user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
    //     user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
    //     assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
    //     assert.strictEqual(user2Stone_retrieve.toString(10), user2Stone.times(7).div(8).toString(10));

    // });


    it("test22_taker1 deposit at the 0 round_rolltonext_taker2 deposit at the 1st round_strategy gets some bonus_taker1 request withdraw_rolltoNext_taker1 instant withdraw", async () => {

        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [2e5, 8e5]
        );
        console.log("stoneVault: ", stoneVault.address);
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })
        let proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);
        const strategyController = await StrategyController.at(strategyControllerAddr);
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });

        await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
            from: taker2
        });
        const eth_deposit_amount = BigNumber(1).times(1e18);
        let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", actualBalance.toString());

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });

        // strategyA got some interest
        let interest = BigNumber(1).times(1e16);
        mockNullStrategyA.send({ from: deployer, value: interest });
        let balanceOfA = await web3.eth.getBalance(mockNullStrategyA.address);
        console.log('balanceOfA is : ', balanceOfA.toString(10));

        await stoneVault.rollToNextRound();

        await stoneVault.deposit({
            value: eth_deposit_amount.div(2),
            from: taker2
        });

        let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance1.toString());

        let sharePrice = await stoneVault.currentSharePrice();
        console.log("sharePrice is : ", sharePrice.toString(10));


        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyAAddr));
        let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
        console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));

        await stoneVault.rollToNextRound();

        await proposal.setProposer(proposer,
            {
                from: deployer
            });
        const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
        console.log("mockNullStrategyC: ", mockNullStrategyC.address);
        const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
        console.log("mockNullStrategyD: ", mockNullStrategyD.address);

        const fn1 = "addStrategy(address)";
        const selector1 = Abi.encodeFunctionSignature(fn1);
        const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
        const data1 = `${selector1}${encodedParams1.split("0x")[1]}`;
        const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
        const data2 = `${selector1}${encodedParams2.split("0x")[1]}`;
        await proposal.propose(data1, {
            from: proposer
        });
        await proposal.propose(data2, {
            from: proposer
        });

        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[mockNullStrategyA.address, mockNullStrategyB.address, mockNullStrategyC.address], [1e5, 2e5, 7e5]]
        );
        const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3, {
            from: proposer
        });

        let proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals);

        let polls;
        await proposal.voteFor(proposals[0], user1Stone.div(2), true,
            {
                from: taker1
            });
        await proposal.voteFor(proposals[1], user1Stone.div(2), false,
            {
                from: taker1
            });

        await proposal.voteFor(proposals[0], user2Stone.div(2), false,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[1], user2Stone.div(4), true,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[2], user2Stone.div(4), true,
            {
                from: taker2
            });
        let canVote1 = await proposal.canVote(proposals[0]);
        let canVote2 = await proposal.canVote(proposals[1]);
        let canVote3 = await proposal.canVote(proposals[2]);

        assert.strictEqual(canVote1, true);
        assert.strictEqual(canVote2, true);
        assert.strictEqual(canVote3, true);

        let strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        assert.strictEqual(strategies[0].length, 2);

        // time add (one vote period + 1)
        await proposal.advanceToEndTime();
        let canExec1 = await proposal.canExec(proposals[0]);
        let canExec2 = await proposal.canExec(proposals[1]);
        let canExec3 = await proposal.canExec(proposals[2]);

        assert.strictEqual(canExec1, true);
        assert.strictEqual(canExec2, false);
        assert.strictEqual(canExec3, true);

        //await proposal.execProposal(proposals[0]);
        await proposal.execProposal(proposals[2]);

        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);

        assert.strictEqual(strategies[0].length, 3);
        assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
        console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
        console.log("strategyB's portion is : ", strategies[1][1].toString(10));
        assert.strictEqual(strategies[0][2], mockNullStrategyC.address);
        console.log("strategyC's portion is : ", strategies[1][2].toString(10));

        let user1Stone_vote = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_vote is : ", user1Stone_vote.toString(10));
        let user2Stone_vote = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_vote is : ", user2Stone_vote.toString(10));
        assert.strictEqual(user1Stone_vote.toString(10), '0');
        assert.strictEqual(user2Stone_vote.toString(10), '0');

        canVote1 = await proposal.canVote(proposals[0]);
        canVote2 = await proposal.canVote(proposals[1]);
        assert.strictEqual(canVote1, false);
        assert.strictEqual(canVote2, false);

        await stoneVault.rollToNextRound();

        await proposal.retrieveTokenFor(proposals[0],
            {
                from: taker1
            });
        let user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
        let user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
        assert.strictEqual(user2Stone_retrieve.toString(10), '0');

        await proposal.retrieveAllToken(
            {
                from: taker1
            });
        user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
        user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.toString(10));
        assert.strictEqual(user2Stone_retrieve.toString(10), '0');
        await proposal.retrieveAllToken(
            {
                from: taker2
            });
        user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
        assert.strictEqual(user2Stone_retrieve.toString(10), user2Stone.toString(10));

    });
});