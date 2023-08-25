const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const RLP = require('rlp');
const Abi = web3.eth.abi;
const truffleAssert = require('truffle-assertions');
const Stone = artifacts.require("Stone");
const MockToken = artifacts.require("MockToken");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const withdrawFeeRate = 0;
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');

contract("test_NullStrategy", async ([deployer, feeRecipient, taker1, taker2, taker3, proposer]) => {
    // const PERCENTAGE = BigNumber(1).times(1e4);

    const ONE_HUNDRED_PERCENT = 1e6;
    const MULTIPLIER = 1e18;
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

        const layerzeroEndpoint = "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23";
        stone = await Stone.new(minterAddr, layerzeroEndpoint);

        console.log("stone: ", stone.address);

        const stoneVaultAddr = await getFutureAddr(1);
        console.log("stoneVaultAddr: ", stoneVaultAddr);

        minter = await Minter.new(stone.address, stoneVaultAddr);
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));
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
    // it("test3_one user_deposit_nullstrategy_roll to next_request partial withdraw_instant withdraw all should fail_should cancel first", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await expectRevert.unspecified(stoneVault.instantWithdraw(0, userStone, {
    //         from: taker1
    //     }));
    //     await stoneVault.cancelWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await stoneVault.instantWithdraw(0, userStone, {
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
    // it("test4_one user_deposit_nullstrategy_roll to next_request withdraw_cancel withdraw", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    // it("test5_taker1 deposit at the 0 round_taker2 deposit at the 1 round_taker1 request withdraw all_complete withdraw", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();
    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    // it("test6_taker1 deposit at the 0 round_taker2 deposit at the 1 round_taker2 instant withdraw", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    // it("test7_two users deposit at the 0 round_taker1 initiate withdraw at the 1 round", async () => {
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

    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));
    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));
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
    //     //double check
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(fee.plus(1e16)));
    //     let feeRecipientBalance1 = BigNumber(await web3.eth.getBalance(feeRecipient));
    //     console.log("feeRecipientBalance1:", feeRecipientBalance1.toString());
    //     assert.strictEqual(feeRecipientBalance1.minus(feeRecipientBalance).toString(10), fee.toString(10));
    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual('0', userStone1.toString(10));
    // });

    // it("test8_taker1 deposit at the 0 round and the 1st round_instant withdraw amount is greater than the second deposit at the 1st round_complete withdraw", async () => {
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

    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice is : ", sharePrice.toString(10));

    //     let userInfo = await stoneVault.userReceipts(taker1);
    //     console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

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
    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.instantWithdraw(0, eth_deposit_amount.times(1.5), {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).minus(eth_deposit_amount.times(0.5)).toString());
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()).minus(eth_deposit_amount.times(0.5)) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()).minus(eth_deposit_amount.times(0.5)) < BigNumber(1e15));

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual(userStone.toString(10), userStone1.times(2).toString(10));
    // });

    // it("test9_user deposit at the 0 round_rolltonext_initiate withdraw at the 1 round_partial cancel_complete withdraw", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });
    //     await stoneVault.cancelWithdraw(userStone.div(2), {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));
    //     assert.strictEqual(userStone.div(2).toString(10), userStone1.toString(10));
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();
    //     await stoneVault.instantWithdraw(eth_deposit_amount.div(2), 0, {
    //         from: taker1
    //     });
    //     let userStone2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone2 is : ", userStone2.toString(10));
    //     assert.strictEqual(userStone2.toString(10), userStone.div(2).toString(10));
    //     let actualBalance3 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("actualBalance3 amount:", actualBalance3.toString());
    //     console.log("actualBalance.minus(actualBalance3).minus(eth_deposit_amount.div(2)):", actualBalance.minus(actualBalance3).minus(eth_deposit_amount.div(2)).toString());
    //     assert.ok(actualBalance.minus(actualBalance3).minus(eth_deposit_amount.div(2)) > 0);
    //     //double check
    //     // assert.ok(actualBalance.minus(actualBalance3).minus(eth_deposit_amount.div(2)) < BigNumber(1e16));

    // });

    // it("test10_three users deposit at the 0 round_taker1 initiate withdraw at the 1st round_taker2 initiate withdraw at the 2nd round_taker3 initiate withdraw at the 3rd round_complete withdraw at the 4th round", async () => {
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
    //     const strategyController = await StrategyController.at(strategyControllerAddr);

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
    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker3
    //     });

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
    //     let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance1.toString());

    //     stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
    //     console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
    //     assert.strictEqual(stoneVaultBalance.toString(), '0');

    //     assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
    //     assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.times(3).toString(10));
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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
    //     let strategyB_vaule0 = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
    //     console.log("strategyB_vaule0 is : ", strategyB_vaule0.toString(10));
    //     await stoneVault.requestWithdraw(userStone, {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();
    //     let user2Stone = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone is : ", user2Stone.toString(10));
    //     await stoneVault.requestWithdraw(user2Stone, {
    //         from: taker2
    //     });
    //     await time.increase(time.duration.seconds(5));

    //     await stoneVault.rollToNextRound();
    //     let user3Stone = BigNumber(await stone.balanceOf(taker3));
    //     console.log("user3Stone is : ", user3Stone.toString(10));
    //     await stoneVault.requestWithdraw(user3Stone, {
    //         from: taker3
    //     });
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());

    //     let userStone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone1 is : ", userStone1.toString(10));

    //     await stoneVault.instantWithdraw(eth_deposit_amount, 0, {
    //         from: taker1
    //     });
    //     await stoneVault.instantWithdraw(eth_deposit_amount.div(2), 0, {
    //         from: taker2
    //     });
    //     await stoneVault.instantWithdraw(eth_deposit_amount.times(1.5), 0, {
    //         from: taker3
    //     });
    //     let userStone2 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone2 is : ", userStone2.toString(10));
    //     assert.strictEqual(userStone2.toString(10), '0');

    //     let actualBalance3 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("actualBalance3 amount:", actualBalance3.toString());
    //     console.log("actualBalance diff:", actualBalance.minus(actualBalance3).toString());

    //     assert.ok(actualBalance.minus(actualBalance3) > 0);
    //     // assert.ok(actualBalance.minus(actualBalance3) < BigNumber(1e15));
    //     userInfo = await stoneVault.userReceipts(taker1);
    //     userWithdrawShares = userInfo.withdrawShares;
    //     console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
    //     userWithdrawRound = userInfo.withdrawRound;
    //     console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
    //     userWithdrawableAmount = userInfo.withdrawableAmount;
    //     console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));

    // });

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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();
    //     assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
    //     console.log("After requestWithdraw ether amount:", assetsVaultBalance1.toString());
    //     console.log("After requestWithdraw userStone ether amount:", userStone.toString());
    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));

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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.instantWithdraw(0, eth_deposit_amount, {
    //         from: taker1
    //     });

    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(1e15));

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
    //     let sharePrice = await stoneVault.currentSharePrice.call();
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

    //     sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
    //     console.log("sharePrice1 is : ", sharePrice.toString(10));

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();

    //     await stoneVault.requestWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await stoneVault.cancelWithdraw(userStone.div(2), {
    //         from: taker1
    //     });
    //     await stoneVault.instantWithdraw(0, eth_deposit_amount.div(2), {
    //         from: taker1
    //     });
    //     await stoneVault.instantWithdraw(eth_deposit_amount.div(2), 0, {
    //         from: taker1
    //     });
    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     // assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < BigNumber(1e16));

    //     userStone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("userStone is : ", userStone.toString(10));
    //     assert.strictEqual(userStone.toString(10), '0');
    //     await time.increase(time.duration.seconds(5));

    //     await stoneVault.rollToNextRound();

    //     await expectRevert.unspecified(stoneVault.instantWithdraw(0, 1, {
    //         from: taker1
    //     }));
    // });


    // it("test15_taker1 deposit_rollToNext_withdraw all first_rollToNext_taker1 deposit", async () => {
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
    //     await stoneVault.rollToNextRound();
    //     await stoneVault.instantWithdraw(0, eth_deposit_amount, {
    //         from: taker1
    //     });
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();
    //     await time.increase(time.duration.seconds(5));
    //     await stoneVault.rollToNextRound();
    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    // });

    // it("test16_taker1 deposit at the 0 round_rolltonext_proposal", async () => {
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
    //     let sharePrice = await stoneVault.currentSharePrice.call();
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

    // it("test17_taker1/2 deposit at the 0 round_rolltonext_proposal_retrive_twice", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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
    // it("test18_negative_taker1 deposit at the 0 round_rolltonext_proposal_execute before vote deadline_withdraw multiple times", async () => {
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
    //     let sharePrice = await stoneVault.currentSharePrice.call();
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

    //     await expectRevert.unspecified(proposal.execProposal(proposals[0],
    //         {
    //             from: taker1
    //         }));
    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     canExec1 = await proposal.canExec(proposals[0]);
    //     canExec2 = await proposal.canExec(proposals[1]);
    //     assert.strictEqual(canExec1, true);
    //     assert.strictEqual(canExec2, false);

    //     await proposal.execProposal(proposals[0]);

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
    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker1
    //         });
    //     await proposal.retrieveAllToken(
    //         {
    //             from: taker2
    //         });
    //     let user1Stone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone1 is : ", user1Stone1.toString(10));

    //     let user2Stone1 = BigNumber(await stone.balanceOf(taker2));
    //     console.log("user2Stone1 is : ", user2Stone1.toString(10));
    //     assert.strictEqual(user1Stone1.toString(10), user1Stone.toString(10));
    //     assert.strictEqual(user2Stone1.toString(10), user2Stone.toString(10));

    // });


    // it("test19_taker1/2 deposit at the 0 round_rolltonext_proposal_one strategy portion less than before_exec proposal_rolltonext_check strategy value", async () => {
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
    //     let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
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
    //     let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyAAddr));
    //     let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue(mockNullStrategyBAddr));
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
    //     await time.increase(time.duration.seconds(5));
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
    it("test20_taker1 deposit at the 0 round_rolltonext_taker2 deposit at the 1st round_proposal one strategy portion more than before_exec proposal_taker1 request withdraw_rolltonext_taker1/taker2 instant withdraw_check strategy value", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [2e5, 8e5]
        );
        console.log("stoneVault: ", stoneVault.address);
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

        let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance1.toString());

        stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
        console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
        assert.strictEqual(stoneVaultBalance.toString(), '0');

        assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
        console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
        //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
        let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice is : ", sharePrice.toString(10));
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        await stoneVault.rollToNextRound();

        let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyAAddr));
        let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));
        assert.strictEqual(strategyA_vaule.toString(10), eth_deposit_amount.times(0.2).toString(10));
        assert.strictEqual(strategyB_vaule.toString(10), eth_deposit_amount.times(0.8).toString(10));

        await stoneVault.deposit({
            value: eth_deposit_amount.div(4),
            from: taker2
        });
        let total = eth_deposit_amount.times(1.25);
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
            [[mockNullStrategyA.address, mockNullStrategyB.address, mockNullStrategyC.address], [4e5, 2e5, 4e5]]
        );
        const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3, {
            from: proposer
        });

        let proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals);
        let canVote1 = await proposal.canVote(proposals[0]);
        let canVote2 = await proposal.canVote(proposals[1]);
        let canVote3 = await proposal.canVote(proposals[2]);

        assert.strictEqual(canVote1, true);
        assert.strictEqual(canVote2, true);
        assert.strictEqual(canVote3, true);

        await proposal.voteFor(proposals[0], user1Stone.div(2), true,
            {
                from: taker1
            });
        await proposal.voteFor(proposals[1], user1Stone.div(2), false,
            {
                from: taker1
            });
        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        await proposal.voteFor(proposals[0], user2Stone.div(2), false,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[1], user2Stone.div(4), true,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[2], user2Stone.div(8), true,
            {
                from: taker2
            });

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

        await proposal.execProposal(proposals[2]);
        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);

        assert.strictEqual(strategies[0].length, 3);
        assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
        console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        assert.strictEqual(strategies[1][0].toString(10), BigNumber(4e5).toString(10));
        assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
        console.log("strategyB's portion is : ", strategies[1][1].toString(10));
        assert.strictEqual(strategies[1][1].toString(10), BigNumber(2e5).toString(10));

        assert.strictEqual(strategies[0][2], mockNullStrategyC.address);
        console.log("strategyC's portion is : ", strategies[1][2].toString(10));
        assert.strictEqual(strategies[1][2].toString(10), BigNumber(4e5).toString(10));

        await proposal.retrieveTokenFor(proposals[0],
            {
                from: taker1
            });
        let user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
        let user2Stone_1 = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_1 is : ", user2Stone_1.toString(10));
        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
        assert.strictEqual(user2Stone_1.toString(10), user2Stone.div(8).toString(10));

        // // taker1 should fail to withdraw all
        // await stoneVault.requestWithdraw(user1Stone, {
        //     from: taker1
        // });
        // only can withdraw the retrieved
        await stoneVault.requestWithdraw(user1Stone_retrieve, {
            from: taker1
        });
        strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyAAddr));
        strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        let strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyC.address));

        console.log("strategyA_vaule1 is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule1 is : ", strategyB_vaule.toString(10));
        console.log("strategyC_vaule1 is : ", strategyC_vaule.toString(10));
        assert.strictEqual(strategyA_vaule.toString(10), eth_deposit_amount.times(0.2).toString(10));
        assert.strictEqual(strategyB_vaule.toString(10), eth_deposit_amount.times(0.8).toString(10));
        assert.strictEqual(strategyC_vaule.toString(10), '0');

        let userStone1 = BigNumber(await stone.balanceOf(taker1));
        console.log("userStone1 is : ", userStone1.toString(10));
        assert.strictEqual('0', userStone1.toString(10));
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();

        strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyAAddr));
        strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyC.address));

        console.log("strategyA_vaule2 is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule2 is : ", strategyB_vaule.toString(10));
        console.log("strategyC_vaule2 is : ", strategyC_vaule.toString(10));

        //value in strategies should be adjusted according to the portion after roll
        assert.strictEqual(strategyA_vaule.toString(10), total.minus(eth_deposit_amount.div(2)).times(0.4).toString(10));
        assert.strictEqual(strategyB_vaule.toString(10), total.minus(eth_deposit_amount.div(2)).times(0.2).toString(10));
        assert.strictEqual(strategyC_vaule.toString(10), total.minus(eth_deposit_amount.div(2)).times(0.4).toString(10));


        await stoneVault.instantWithdraw(user1Stone_retrieve, 0, {
            from: taker1
        });
        let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance2.toString());
        let diff = actualBalance2.integerValue().minus(actualBalance1.integerValue());
        console.log("taker1 diff:", diff.toString());
        assert.ok(diff > 0);
        assert.ok(diff < BigNumber(6e6));

        // taker2 should success to instant withdraw 1/8
        await stoneVault.instantWithdraw(0, user2Stone.div(8), {
            from: taker2
        });
        strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyAAddr));
        strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyC.address));

        console.log("strategyA_vaule3 is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule3 is : ", strategyB_vaule.toString(10));
        console.log("strategyC_vaule3 is : ", strategyC_vaule.toString(10));
        //value in strategies should be adjusted according to the portion after instantWithdraw
        assert.strictEqual(strategyA_vaule.toString(10), total.minus(eth_deposit_amount.div(2).plus(eth_deposit_amount.div(4).div(8))).times(0.4).toString(10));
        assert.strictEqual(strategyB_vaule.toString(10), total.minus(eth_deposit_amount.div(2).plus(eth_deposit_amount.div(4).div(8))).times(0.2).toString(10));
        assert.strictEqual(strategyC_vaule.toString(10), total.minus(eth_deposit_amount.div(2).plus(eth_deposit_amount.div(4).div(8))).times(0.4).toString(10));

        await proposal.retrieveAllToken(
            {
                from: taker1
            });
        await proposal.retrieveAllToken(
            {
                from: taker2
            });
        user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
        user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.div(2).toString(10));
        assert.strictEqual(user2Stone_retrieve.toString(10), user2Stone.times(7).div(8).toString(10));

    });


    it("test21_taker1 deposit at the 0 round_rolltonext_taker2 deposit at the 1st round_strategy gets some bonus_taker1 request withdraw_rolltoNext_taker1 instant withdraw", async () => {

        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [2e5, 8e5]
        );
        console.log("stoneVault: ", stoneVault.address);

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
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

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
        let user1Stone0 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone0 is : ", user1Stone0.toString(10));

        let total = eth_deposit_amount;
        // strategyA/B got some interest
        let interest = BigNumber(1e17);
        let interest1 = BigNumber(3e17);

        await web3.eth.sendTransaction({
            from: deployer,
            to: mockNullStrategyAAddr,
            value: interest.toString(10)
        })
        await web3.eth.sendTransaction({
            from: deployer,
            to: mockNullStrategyBAddr,
            value: interest1.toString(10)
        })

        let balanceOfA = await web3.eth.getBalance(mockNullStrategyAAddr);
        console.log('balanceOfA is : ', balanceOfA.toString(10));
        total = total.plus(interest).plus(interest1);
        await stoneVault.rollToNextRound();
        let sharePrice0 = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice0 is : ", sharePrice0.toString(10));
        await stoneVault.deposit({
            value: eth_deposit_amount.div(2),
            from: taker2
        });
        let user2Stone0 = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone0 amount:", user2Stone0.toString());
        assert.strictEqual(user2Stone0.toString(10), eth_deposit_amount.div(2).div(sharePrice0).times(MULTIPLIER).integerValue().toString(10));
        total = total.plus(eth_deposit_amount.div(2));
        let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance1.toString());

        let sharePrice1 = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice1 is : ", sharePrice1.toString(10));
        assert.strictEqual(sharePrice1.toString(10), total.div(user2Stone0.plus(user1Stone0)).times(MULTIPLIER).integerValue().toString(10));
        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));
        await time.increase(time.duration.seconds(5));
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

        await proposal.voteFor(proposals[0], user1Stone.div(2), true,
            {
                from: taker1
            });
        await proposal.voteFor(proposals[1], user1Stone.div(2), false,
            {
                from: taker1
            });

        await proposal.voteFor(proposals[0], BigNumber(user2Stone.div(2)), false,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[1], user2Stone.div(4).integerValue(), true,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[2], user2Stone.div(4).integerValue(), true,
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
        assert.ok(user2Stone_vote < 4);

        canVote1 = await proposal.canVote(proposals[0]);
        canVote2 = await proposal.canVote(proposals[1]);
        assert.strictEqual(canVote1, false);
        assert.strictEqual(canVote2, false);
        await time.increase(time.duration.seconds(5));

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
        assert.ok(user2Stone_retrieve < 4);

        await proposal.retrieveAllToken(
            {
                from: taker1
            });
        user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
        user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.toString(10));
        assert.ok(user2Stone_retrieve < 4);
        await proposal.retrieveAllToken(
            {
                from: taker2
            });
        user2Stone_retrieve = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_retrieve is : ", user2Stone_retrieve.toString(10));
        assert.strictEqual(user2Stone_retrieve.toString(10), user2Stone.toString(10));

    });

    it("test22_set strategyA portion to be 0", async () => {

        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [2e5, 8e5]
        );
        console.log("stoneVault: ", stoneVault.address);

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
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })
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
        let user1Stone = BigNumber(await stone.balanceOf(taker1));

        await stoneVault.rollToNextRound();

        await proposal.setProposer(proposer,
            {
                from: deployer
            });
        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[mockNullStrategyA.address, mockNullStrategyB.address], [0, 10e5]]
        );
        const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3, {
            from: proposer
        });

        let proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals);

        await proposal.voteFor(proposals[0], user1Stone.div(2), true,
            {
                from: taker1
            });

        let canVote1 = await proposal.canVote(proposals[0]);

        assert.strictEqual(canVote1, true);

        let strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        assert.strictEqual(strategies[0].length, 2);

        // time add (one vote period + 1)
        await proposal.advanceToEndTime();
        let canExec1 = await proposal.canExec(proposals[0]);

        assert.strictEqual(canExec1, true);

        await proposal.execProposal(proposals[0]);

        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        assert.strictEqual(strategies[0].length, 2);
        assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
        console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        assert.strictEqual(strategies[1][0].toString(10), '0');

        assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
        console.log("strategyB's portion is : ", strategies[1][1].toString(10));
        assert.strictEqual(strategies[1][1].toString(10), BigNumber(ONE_HUNDRED_PERCENT).toString(10));

        let user1Stone_vote = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_vote is : ", user1Stone_vote.toString(10));
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();

        await proposal.retrieveTokenFor(proposals[0],
            {
                from: taker1
            });
        await expectRevert.unspecified(proposal.retrieveTokenFor(proposals[0],
            {
                from: taker1
            }));

        let user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));
        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.toString(10));

        await proposal.retrieveAllToken(
            {
                from: taker1
            });
        await proposal.retrieveAllToken(
            {
                from: taker1
            });
        user1Stone_retrieve = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_retrieve is : ", user1Stone_retrieve.toString(10));

        assert.strictEqual(user1Stone_retrieve.toString(10), user1Stone.toString(10));

    });

    it("test23_three users deposit at the 0 round_taker1 initiate withdraw at the 1st round_taker2 initiate withdraw at the 2nd round_taker3 initiate withdraw at the 3rd round_complete withdraw at the 4th round", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);
        let proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();
        const strategyController = await StrategyController.at(strategyControllerAddr);

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", actualBalance.toString());
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker3
        });

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
        let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance1.toString());

        stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
        console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
        assert.strictEqual(stoneVaultBalance.toString(), '0');

        assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
        console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
        assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.times(3).toString(10));
        let sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice is : ", sharePrice.toString(10));
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })
        let userInfo = await stoneVault.userReceipts(taker1);
        console.log("taker1's withdrawableAmount: ", userInfo.withdrawableAmount.toString(10));

        let userStone = BigNumber(await stone.balanceOf(taker1));
        console.log("userStone is : ", userStone.toString(10));

        await stoneVault.rollToNextRound();
        let strategyB_vaule0 = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyB_vaule0 is : ", strategyB_vaule0.toString(10));
        // strategyA got some interest while strategyB loss some
        let interest = BigNumber(5e18);
        let interest1 = BigNumber(15e18);

        await web3.eth.sendTransaction({
            from: deployer,
            to: mockNullStrategyAAddr,
            value: interest.toString(10)
        })

        await mockNullStrategyB.mock_transfer(interest1, {
            from: deployer
        })
        let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));

        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice1 is : ", sharePrice.toString(10));
        assert.strictEqual(eth_deposit_amount.times(3).minus(interest1).plus(interest).div(eth_deposit_amount.times(3)).times(MULTIPLIER).integerValue().toString(10), sharePrice.toString(10));
        await stoneVault.requestWithdraw(userStone, {
            from: taker1
        });
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();
        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        await stoneVault.requestWithdraw(user2Stone, {
            from: taker2
        });
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();
        let user3Stone = BigNumber(await stone.balanceOf(taker3));
        console.log("user3Stone is : ", user3Stone.toString(10));
        await stoneVault.requestWithdraw(user3Stone, {
            from: taker3
        });
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();

        let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance2.toString());

        let userStone1 = BigNumber(await stone.balanceOf(taker1));
        console.log("userStone1 is : ", userStone1.toString(10));
        // assert.strictEqual(userStone.div(2).toString(10), userStone1.toString(10));

        await stoneVault.instantWithdraw(eth_deposit_amount.times(sharePrice).div(MULTIPLIER), 0, {
            from: taker1
        });
        await stoneVault.instantWithdraw(eth_deposit_amount.div(2).times(sharePrice).div(MULTIPLIER), 0, {
            from: taker2
        });
        await stoneVault.instantWithdraw(eth_deposit_amount.times(1.5).times(sharePrice).div(MULTIPLIER), 0, {
            from: taker3
        });
        let userStone2 = BigNumber(await stone.balanceOf(taker1));
        console.log("userStone2 is : ", userStone2.toString(10));
        assert.strictEqual(userStone2.toString(10), '0');

        let actualBalance3 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("actualBalance3 amount:", actualBalance3.toString());
        console.log("actualBalance diff:", actualBalance.minus(actualBalance3).toString());

        assert.ok(actualBalance.minus(actualBalance3) > 0);
        // assert.ok(actualBalance.minus(actualBalance3) < BigNumber(2e15));
        userInfo = await stoneVault.userReceipts(taker1);
        userWithdrawShares = userInfo.withdrawShares;
        console.log("taker1's withdrawShares: ", userWithdrawShares.toString(10));
        userWithdrawRound = userInfo.withdrawRound;
        console.log("taker1's withdrawRound: ", userWithdrawRound.toString(10));
        userWithdrawableAmount = userInfo.withdrawableAmount;
        console.log("taker1's withdrawableAmount: ", userWithdrawableAmount.toString(10));
    });


    it("test24_taker1/2 deposit at the 0 round_rolltonext_change strategies_rolltoNext_check strategies portion", async () => {

        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [2e5, 8e5]
        );
        console.log("stoneVault: ", stoneVault.address);

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
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

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
        await stoneVault.deposit({
            value: eth_deposit_amount.div(2),
            from: taker2
        });
        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));
        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        let balanceOfA = await web3.eth.getBalance(mockNullStrategyAAddr);
        console.log('balanceOfA is : ', balanceOfA.toString(10));

        await stoneVault.rollToNextRound();

        let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyAAddr));
        let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
        console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));

        await proposal.setProposer(proposer,
            {
                from: deployer
            });
        const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
        console.log("mockNullStrategyC: ", mockNullStrategyC.address);
        const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
        console.log("mockNullStrategyD: ", mockNullStrategyD.address);

        const fn1 = "updatePortfolioConfig(address[],uint256[])";
        const selector1 = Abi.encodeFunctionSignature(fn1);
        const encodedParams1 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[mockNullStrategyC.address, mockNullStrategyD.address], [4e5, 6e5]]
        );
        const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
        console.log("data3: ", data1);

        await proposal.propose(data1, {
            from: proposer
        });

        let proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals);

        await proposal.voteFor(proposals[0], user1Stone.div(2), true,
            {
                from: taker1
            });

        await proposal.voteFor(proposals[0], BigNumber(user2Stone.div(2)), false,
            {
                from: taker2
            });

        // time add (one vote period + 1)
        await proposal.advanceToEndTime();
        let assetsVaultBalance0 = await web3.eth.getBalance(assetsVault.address);
        console.log("assetsVault0 ether amount:", assetsVaultBalance0.toString());
        assert.strictEqual("0", assetsVaultBalance0.toString());

        await proposal.execProposal(proposals[0]);

        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);

        assert.strictEqual(strategies[0].length, 4);
        assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
        console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
        console.log("strategyB's portion is : ", strategies[1][1].toString(10));
        assert.strictEqual(strategies[0][2], mockNullStrategyC.address);
        console.log("strategyC's portion is : ", strategies[1][2].toString(10));
        assert.strictEqual(strategies[0][3], mockNullStrategyD.address);
        console.log("strategyD's portion is : ", strategies[1][3].toString(10));

        let assetsVaultBalance1 = await web3.eth.getBalance(assetsVault.address);
        console.log("assetsVault1 ether amount:", assetsVaultBalance1.toString());
        assert.strictEqual("0", assetsVaultBalance1.toString());
        await time.increase(time.duration.seconds(5));

        await stoneVault.rollToNextRound();

        let strategyC_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyC.address));
        let strategyD_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyD.address));
        console.log("strategyC_vaule is : ", strategyC_vaule.toString(10));
        console.log("strategyD_vaule is : ", strategyD_vaule.toString(10));
        assert.strictEqual(eth_deposit_amount.times(1.5).times(0.4).toString(10), strategyC_vaule.toString(10));
        assert.strictEqual(eth_deposit_amount.times(1.5).times(0.6).toString(10), strategyD_vaule.toString(10));

        let assetsVaultBalance2 = BigNumber(await web3.eth.getBalance(assetsVault.address));
        console.log("assetsVault2 ether amount:", assetsVaultBalance2.toString());
        assert.strictEqual("0", assetsVaultBalance2.toString());
    });

    it("test25_two users deposit at the 0 round_vote for strategies but vote tied", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);

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
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

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
        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone :", user1Stone.toString());
        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker2
        });
        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone :", user2Stone.toString());

        await stoneVault.rollToNextRound();

        await proposal.setProposer(proposer,
            {
                from: deployer
            });
        const fn1 = "updatePortfolioConfig(address[],uint256[])";
        const selector1 = Abi.encodeFunctionSignature(fn1);
        const encodedParams1 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[mockNullStrategyA.address, mockNullStrategyB.address], [1e5, 9e5]]
        );
        const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
        console.log("data1: ", data1);
        const encodedParams2 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[mockNullStrategyA.address, mockNullStrategyB.address], [2e5, 8e5]]
        );
        const data2 = `${selector1}${encodedParams2.split("0x")[1]}`
        console.log("data2: ", data2);
        await proposal.propose(data1, {
            from: proposer
        });
        await proposal.propose(data2, {
            from: proposer
        });
        let proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals);

        await proposal.voteFor(proposals[0], user1Stone, true,
            {
                from: taker1
            });
        await proposal.voteFor(proposals[1], user2Stone, true,
            {
                from: taker2
            });

        // time add (one vote period + 1)
        await proposal.advanceToEndTime();
        let canExec1 = await proposal.canExec(proposals[0]);
        let canExec2 = await proposal.canExec(proposals[1]);
        console.log("canExec1 is :", canExec1);
        console.log("canExec2 is :", canExec2);
        let price = await stone.tokenPrice.call();
        console.log("price is :", BigNumber(price).div(1e18).toString(10));

        assert.strictEqual(canExec1, true);
        assert.strictEqual(canExec2, true);
    });

    // it("test26_user deposit at the 0 round_use some stones to vote for strategy_try to withdraw all eth should be fail_partial withdraw eth_vote time end_retrieve all stone_instant withdraw", async () => {
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
    //     const strategyController = await StrategyController.at(strategyControllerAddr);
    //     await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
    //         from: deployer
    //     })
    //     await stoneVault.setFeeRecipient(feeRecipient, {
    //         from: deployer
    //     })

    //     await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });

    //     await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
    //         from: taker1
    //     });

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("Before taker1 ether amount:", actualBalance.toString());

    //     await stoneVault.deposit({
    //         value: eth_deposit_amount,
    //         from: taker1
    //     });
    //     let user1Stone = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone :", user1Stone.toString());
    //     await proposal.setProposer(proposer,
    //         {
    //             from: deployer
    //         });
    //     const fn1 = "updatePortfolioConfig(address[],uint256[])";
    //     const selector1 = Abi.encodeFunctionSignature(fn1);
    //     const encodedParams1 = Abi.encodeParameters(
    //         ["address[]", "uint256[]"],
    //         [[mockNullStrategyA.address, mockNullStrategyB.address], [1e5, 9e5]]
    //     );
    //     const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
    //     console.log("data1: ", data1);

    //     await proposal.propose(data1, {
    //         from: proposer
    //     });

    //     let proposals = await proposal.getProposals();
    //     console.log("proposals are : ", proposals);

    //     await proposal.voteFor(proposals[0], user1Stone.div(2), true,
    //         {
    //             from: taker1
    //         });
    //     let user1Stone1 = BigNumber(await stone.balanceOf(taker1));
    //     console.log("user1Stone1 is : ", user1Stone1.toString(10));
    //     assert.strictEqual(user1Stone.toString(10), user1Stone1.times(2).toString(10));
    //     await expectRevert.unspecified(stoneVault.instantWithdraw(0, user1Stone, {
    //         from: taker1
    //     }));
    //     await stoneVault.instantWithdraw(0, user1Stone.div(2), {
    //         from: taker1
    //     });
    //     // time add (one vote period + 1)
    //     await proposal.advanceToEndTime();
    //     await proposal.retrieveTokenFor(proposals[0],
    //         {
    //             from: taker1
    //         });
    //     await stoneVault.instantWithdraw(0, user1Stone.div(2), {
    //         from: taker1
    //     });
    //     let actualBalance2 = BigNumber(await web3.eth.getBalance(taker1));
    //     console.log("After taker1 ether amount:", actualBalance2.toString());
    //     console.log("taker1 diff:", actualBalance.integerValue().minus(actualBalance2.integerValue()).toString());
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) > 0);
    //     assert.ok(actualBalance.integerValue().minus(actualBalance2.integerValue()) < 2e16);

    // });

    it("test27_three users deposit at the 0 round_roll to next_strategies earn and loss some money_roll to next_check the price_all the money should be assigned to strategies according to the origin portion", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);
        let proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();
        const strategyController = await StrategyController.at(strategyControllerAddr);

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", actualBalance.toString());
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker3
        });

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
        let userStone = BigNumber(await stone.balanceOf(taker1));
        console.log("userStone is : ", userStone.toString(10));

        let sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice is : ", sharePrice.toString(10));
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

        await stoneVault.rollToNextRound();
        let strategyB_vaule0 = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyB_vaule0 is : ", strategyB_vaule0.toString(10));

        // strategyA got some interest while strategyB loss all
        let interest = BigNumber(5e18);
        let interest1 = BigNumber(15e18);

        await web3.eth.sendTransaction({
            from: deployer,
            to: mockNullStrategyAAddr,
            value: interest.toString(10)
        })

        await mockNullStrategyB.mock_transfer(interest1, {
            from: deployer
        })
        let strategyA_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyAAddr));
        console.log("strategyA_vaule is : ", strategyA_vaule.toString(10));
        assert.strictEqual(strategyA_vaule.toString(10), eth_deposit_amount.times(1.5).plus(interest).toString(10));

        let strategyB_vaule = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyBAddr));
        console.log("strategyB_vaule is : ", strategyB_vaule.toString(10));
        assert.strictEqual(strategyB_vaule.toString(10), "0");

        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice1 is : ", sharePrice.toString(10));
        assert.strictEqual(eth_deposit_amount.times(3).minus(interest1).plus(interest).div(eth_deposit_amount.times(3)).times(MULTIPLIER).integerValue().toString(10), sharePrice.toString(10));
        await stoneVault.requestWithdraw(userStone, {
            from: taker1
        });
        let allValue = BigNumber(await strategyController.getAllStrategiesValue.call());
        let allValidValue = BigNumber(await strategyController.getAllStrategyValidValue.call());
        console.log("allValue is : ", allValue.toString(10));
        console.log("allValidValue is : ", allValidValue.toString(10));
        let strategyAValue = BigNumber(await strategyController.getStrategyValue.call(mockNullStrategyA.address));
        let strategyAValidValue = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyA.address));
        console.log("strategyAValue is : ", strategyAValue.toString(10));
        console.log("strategyAValidValue is : ", strategyAValidValue.toString(10));
        // assert.strictEqual(strategyAValue.toString(10), strategyAValidValue.plus(userStone.times(sharePrice).div(MULTIPLIER)).toString(10));
        // assert.strictEqual(strategyAValue.toString(10), eth_deposit_amount.times(1.5).plus(interest).toString(10));
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();
        let sharePrice2 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice2 is : ", sharePrice2.toString(10));

        let allValue1 = BigNumber(await strategyController.getAllStrategiesValue.call());
        let allValidValue1 = BigNumber(await strategyController.getAllStrategyValidValue.call());
        console.log("allValue1 is : ", allValue1.toString(10));
        console.log("allValidValue1 is : ", allValidValue1.toString(10));
        let strategyAValue1 = BigNumber(await strategyController.getStrategyValue.call(mockNullStrategyA.address));
        let strategyAValidValue1 = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyA.address));
        console.log("strategyAValue1 is : ", strategyAValue1.toString(10));
        console.log("strategyAValidValue1 is : ", strategyAValidValue1.toString(10));
        let strategyBValue1 = BigNumber(await strategyController.getStrategyValue.call(mockNullStrategyB.address));
        let strategyBValidValue1 = BigNumber(await strategyController.getStrategyValidValue.call(mockNullStrategyB.address));
        console.log("strategyBValue1 is : ", strategyBValue1.toString(10));
        console.log("strategyBValidValue1 is : ", strategyBValidValue1.toString(10));
        assert.strictEqual(strategyAValue1.toString(10), strategyBValue1.toString(10));
        assert.strictEqual(strategyAValidValue1.toString(10), strategyBValidValue1.toString(10));
        assert.strictEqual(strategyAValue1.toString(10), eth_deposit_amount.times(3).minus(interest1).plus(interest).minus(userStone.times(sharePrice).div(MULTIPLIER)).div(2).toString(10));
        assert.strictEqual(allValue.toString(10), allValue1.plus(userStone.times(sharePrice).div(MULTIPLIER)).toString(10));

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));
        let strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);

        assert.strictEqual(strategies[0].length, 2);
        assert.strictEqual(strategies[0][0], mockNullStrategyA.address);
        console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        assert.strictEqual(strategies[1][0].toString(10), BigNumber(5e5).toString(10));
        assert.strictEqual(strategies[0][1], mockNullStrategyB.address);
        console.log("strategyB's portion is : ", strategies[1][1].toString(10));
        assert.strictEqual(strategies[1][1].toString(10), BigNumber(5e5).toString(10));

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });
        // strategyA earn some interest while strategyB loss
        interest = BigNumber(5e18);
        interest1 = BigNumber(3e18);

        await web3.eth.sendTransaction({
            from: deployer,
            to: mockNullStrategyAAddr,
            value: interest.toString(10)
        })

        await mockNullStrategyB.mock_transfer(interest1, {
            from: deployer
        })
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();
        userStone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", userStone.toString(10));
        assert.strictEqual(userStone.toString(10), eth_deposit_amount.div(sharePrice2).times(MULTIPLIER).integerValue().toString(10));
        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        let user3Stone = BigNumber(await stone.balanceOf(taker3));
        console.log("user3Stone is : ", user3Stone.toString(10));

        sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice2 is : ", sharePrice.toString(10));
        assert.strictEqual(strategyAValue1.times(2).plus(eth_deposit_amount).minus(interest1).plus(interest).div(userStone.plus(user2Stone).plus(user3Stone)).times(MULTIPLIER).integerValue().toString(10), sharePrice.toString(10));

    });

    it("test28_user1 deposit at the 0 round_roll to next_strategyA earn some money_roll to next_strategyB loss some money_user2 deposit_check price and stone", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);
        let proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();
        const strategyController = await StrategyController.at(strategyControllerAddr);
        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);
        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", actualBalance.toString());
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });

        let userStone = BigNumber(await stone.balanceOf(taker1));
        console.log("userStone is : ", userStone.toString(10));

        let sharePrice0 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice0 is : ", sharePrice0.toString(10));

        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

        await stoneVault.rollToNextRound();
        let sharePrice1 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice1 is : ", sharePrice1.toString(10));

        // strategyA got some interest while strategyB loss all
        let interest = BigNumber(5e18);

        await web3.eth.sendTransaction({
            from: deployer,
            to: mockNullStrategyAAddr,
            value: interest.toString(10)
        })

        let sharePrice2 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice2 is : ", sharePrice2.toString(10));
        await stoneVault.requestWithdraw(userStone.div(2), {
            from: taker1
        });
        await time.increase(time.duration.seconds(5));
        await stoneVault.rollToNextRound();
        let sharePrice3 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice3 is : ", sharePrice3.toString(10));

        let interest1 = BigNumber(3e18);
        await mockNullStrategyB.mock_transfer(interest1, {
            from: deployer
        })
        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker2
        });
        let sharePrice4 = await stoneVault.currentSharePrice.call();
        console.log("sharePrice4 is : ", sharePrice4.toString(10));
        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));
        assert.strictEqual(eth_deposit_amount.div(sharePrice3).times(MULTIPLIER).integerValue().toString(10), user2Stone.toString(10));

        let userInfo = await stoneVault.userReceipts(taker1);
        await stoneVault.instantWithdraw(userStone.div(2).times(sharePrice3).div(MULTIPLIER), 0, {
            from: taker1
        });
    });

    it("test29_taker1/2 deposit at the 0 round_rolltonext_proposal_taker1 retrieve all_taker2 retrieve all", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);
        let proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);

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

        await stoneVault.deposit({
            value: eth_deposit_amount.div(2),
            from: taker2
        });

        let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance1.toString());

        stoneVaultBalance = await web3.eth.getBalance(stoneVault.address);
        console.log("After stoneVault ether amount:", stoneVaultBalance.toString());
        assert.strictEqual(stoneVaultBalance.toString(), '0');

        assetsVaultBalance = await web3.eth.getBalance(assetsVault.address);
        console.log("After assetsVault ether amount:", assetsVaultBalance.toString());
        //assert.strictEqual(assetsVaultBalance.toString(), eth_deposit_amount.toString(10));
        let sharePrice = await stoneVault.currentSharePrice.call();
        console.log("sharePrice is : ", sharePrice.toString(10));
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));

        await stoneVault.rollToNextRound();
        const mockNullStrategyC = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy C");
        console.log("mockNullStrategyC: ", mockNullStrategyC.address);
        const mockNullStrategyD = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy D");
        console.log("mockNullStrategyD: ", mockNullStrategyD.address);
        const fn1 = "addStrategy(address)";
        const selector1 = Abi.encodeFunctionSignature(fn1);
        const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyC.address]);
        const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
        const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyD.address]);
        const data2 = `${selector1}${encodedParams2.split("0x")[1]}`

        await proposal.propose(data1, {
            from: deployer
        });
        await proposal.propose(data2, {
            from: deployer
        });

        let proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals);

        let polls;
        await proposal.voteFor(proposals[0], user1Stone.div(2), true,
            {
                from: taker1
            });
        await proposal.voteFor(proposals[1], user1Stone.div(4), true,
            {
                from: taker1
            });

        await proposal.voteFor(proposals[0], user2Stone.div(4), false,
            {
                from: taker2
            });
        await proposal.voteFor(proposals[1], user2Stone.div(2), true,
            {
                from: taker2
            });

        let canVote1 = await proposal.canVote(proposals[0]);
        let canVote2 = await proposal.canVote(proposals[1]);
        assert.strictEqual(canVote1, true);
        assert.strictEqual(canVote2, true);
        // time add (one vote period + 1)
        await proposal.advanceToEndTimeForProposal(proposals[0]);
        let canExec1 = await proposal.canExec(proposals[0]);
        let canExec2 = await proposal.canExec(proposals[1]);
        assert.strictEqual(canExec1, true);
        assert.strictEqual(canExec2, false);
        canVote1 = await proposal.canVote(proposals[0]);
        canVote2 = await proposal.canVote(proposals[1]);
        assert.strictEqual(canVote1, false);
        assert.strictEqual(canVote2, true);
        await proposal.execProposal(proposals[0]);
        let user1Stone1 = BigNumber(await stone.balanceOf(taker1));
        let user2Stone1 = BigNumber(await stone.balanceOf(taker2));
        assert.strictEqual(user1Stone1.toString(10), user1Stone.div(4).toString(10));
        assert.strictEqual(user2Stone1.toString(10), user2Stone.div(4).toString(10));

        const strategyController = await StrategyController.at(strategyControllerAddr);
        let strategies = await strategyController.getStrategies();
        assert.strictEqual(strategies[0].length, 3);
        assert.strictEqual(strategies[0][2], mockNullStrategyC.address);

        await proposal.retrieveTokenFor(proposals[0],
            {
                from: taker1
            });
        await proposal.retrieveAllToken({
            from: taker1
        });
        await proposal.retrieveAllToken({
            from: taker2
        });
        user1Stone1 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone1.toString(10));
        user2Stone1 = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone1.toString(10));
        assert.strictEqual(user1Stone.times(0.75).toString(10), user1Stone1.toString(10));
        assert.strictEqual(user2Stone.div(2).toString(10), user2Stone1.toString(10));
    });


    it("test30_taker1 deposit", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);
        let proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);
        const strategyControllerAddr = await stoneVault.strategyController();

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        const eth_deposit_amount = BigNumber(1).times(1e18);
        let actualBalance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", actualBalance.toString());

        await stoneVault.depositFor(taker1, {
            value: 1,
            from: taker1
        });
        let actualBalance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", actualBalance1.toString());
        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("case30 user1Stone amount:", user1Stone.toString());
    });

});