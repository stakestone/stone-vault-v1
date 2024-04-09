const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const RLP = require('rlp');
const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StoneFreezer = artifacts.require("StoneFreezer");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const withdrawFeeRate = 0;
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');
const TruffleConfig = require('../truffle-config');

function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}
contract("test_NullStrategy", async ([deployer, feeRecipient, taker3, taker4, taker1, taker2]) => {
    // const PERCENTAGE = BigNumber(1).times(1e4);
    const gasPrice = TruffleConfig.networks.Sepolia.gasPrice; // 获取 gasPrice 设置
    console.log('Gas price:', gasPrice.toString());
    const ONE_HUNDRED_PERCENT = 1e6;
    const MULTIPLIER = 1e18;
    const minDeposit = BigNumber(1).times(1e17);
    const cap = BigNumber(100).times(1e18);
    const DECIMALS = 1e18;

    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const rs = web3.utils.sha3(encoded);
        return '0x' + rs.substr(rs.length - 40, 40);
    }
    let stoneVault, proposal, minter, assetsVaultAddr, mockNullStrategyAAddr, mockNullStrategyBAddr, stone, proposalAddr, currentTime;

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

        mockNullStrategyAAddr = await getFutureAddr(3);
        mockNullStrategyBAddr = await getFutureAddr(4);
        console.log("mockNullStrategyAAddr: ", mockNullStrategyAAddr);
        console.log("mockNullStrategyBAddr: ", mockNullStrategyBAddr);
        proposalAddr = await getFutureAddr(1);
        console.log("proposalAddr: ", proposalAddr);
        currentTime = Math.floor(Date.now() / 1000);
        stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            currentTime,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stone address: ", stone.address);
        console.log("stoneVault address: ", stoneVault.address);
        proposal = await Proposal.new(stoneVault.address);
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

    });

    it("test1_user deposit stone", async () => {

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
        const eth_deposit_amount = BigNumber(20).times(1e18);

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });

        await stoneVault.deposit({
            value: eth_deposit_amount.div(2),
            from: taker2
        });

        let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice is : ", sharePrice.toString(10));

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));

        const stoneFreezer = await StoneFreezer.new(
            stone.address,
            stoneVault.address,
            cap
        );
        console.log("stoneFreezer: ", stoneFreezer.address);
        await stone.approve(stoneFreezer.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker1
        });
        await stone.approve(stoneFreezer.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker2
        });

        let stone_deposit = BigNumber(10).times(MULTIPLIER);
        await stoneFreezer.depositStone(stone_deposit.toString(), {
            from: taker1
        });
        user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_1 is : ", user1Stone_1.toString(10));
        assert.strictEqual(user1Stone_1.toString(), user1Stone.minus(stone_deposit).toString());

        stone_stoneFreezer = BigNumber(await stone.balanceOf(stoneFreezer.address));
        console.log("stone_stoneFreezer is : ", stone_stoneFreezer.toString(10));
        assert.strictEqual(stone_stoneFreezer.toString(10), stone_deposit.toString());
    });
    it("test2_user deposit ETH", async () => {

        const stoneFreezer = await StoneFreezer.new(
            stone.address,
            stoneVault.address,
            cap
        );
        console.log("stoneFreezer: ", stoneFreezer.address);
        user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_1 is : ", user1Stone_1.toString(10));

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let balance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", balance.toString());

        let tx = await stoneFreezer.depositETH({
            value: eth_deposit_amount.toString(),
            from: taker1
        });
        const gasUsed = tx.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        let balance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", balance1.toString());
        assert.isTrue(Math.abs(balance.minus(balance1).minus(eth_deposit_amount).minus(gas)) < 10, 'Absolute difference should be less than 10');

        bal_stoneFreezer = BigNumber(await web3.eth.getBalance(stoneFreezer.address));
        console.log("bal_stoneFreezer is : ", bal_stoneFreezer.toString(10));
        assert.strictEqual(bal_stoneFreezer.toString(10), '0');
        user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
        //currently share price = 1
        assert.strictEqual(user1Stone_2.minus(user1Stone_1).toString(), eth_deposit_amount.toString());

    });

    it("test3_user deposit ETH for other", async () => {

        const stoneFreezer = await StoneFreezer.new(
            stone.address,
            stoneVault.address,
            cap
        );
        console.log("stoneFreezer: ", stoneFreezer.address);

        user1Stone_1 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_1 is : ", user1Stone_1.toString(10));
        user2Stone_1 = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_1 is : ", user2Stone_1.toString(10));

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let balance = BigNumber(await web3.eth.getBalance(taker1));
        console.log("Before taker1 ether amount:", balance.toString());

        let tx = await stoneFreezer.depositETHFor(taker2, {
            value: eth_deposit_amount.toString(),
            from: taker1
        });
        const gasUsed = tx.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        let balance1 = BigNumber(await web3.eth.getBalance(taker1));
        console.log("After taker1 ether amount:", balance1.toString());
        assert.isTrue(Math.abs(balance.minus(balance1).minus(eth_deposit_amount).minus(gas)) < 10, 'Absolute difference should be less than 10');

        bal_stoneFreezer = BigNumber(await web3.eth.getBalance(stoneFreezer.address));
        console.log("bal_stoneFreezer is : ", bal_stoneFreezer.toString(10));
        assert.strictEqual(bal_stoneFreezer.toString(10), '0');
        user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
        assert.strictEqual(user1Stone_2.toString(10), user1Stone_1.toString(10));

        user2Stone_2 = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_2 is : ", user2Stone_2.toString(10));
        //currently share price = 1
        assert.strictEqual(user2Stone_2.minus(user2Stone_1).toString(), eth_deposit_amount.toString());

    });

    it("test4_user deposit stone for other", async () => {

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
        const eth_deposit_amount = BigNumber(20).times(1e18);

        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: taker1
        });

        await stoneVault.deposit({
            value: eth_deposit_amount.div(2),
            from: taker2
        });

        let sharePrice = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("sharePrice is : ", sharePrice.toString(10));

        let user1Stone = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone is : ", user1Stone.toString(10));

        let user2Stone = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone is : ", user2Stone.toString(10));

        const stoneFreezer = await StoneFreezer.new(
            stone.address,
            stoneVault.address,
            cap
        );
        console.log("stoneFreezer: ", stoneFreezer.address);
        await stone.approve(stoneFreezer.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker1
        });
        await stone.approve(stoneFreezer.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker2
        });

        let stone_deposit = BigNumber(10).times(MULTIPLIER);
        await stoneFreezer.depositStoneFor(taker2, stone_deposit.toString(), {
            from: taker1
        });
        user1Stone_2 = BigNumber(await stone.balanceOf(taker1));
        console.log("user1Stone_2 is : ", user1Stone_2.toString(10));
        assert.strictEqual(user1Stone_2.toString(), user1Stone.minus(stone_deposit).toString());
        user2Stone_2 = BigNumber(await stone.balanceOf(taker2));
        console.log("user2Stone_2 is : ", user2Stone_2.toString(10));
        assert.strictEqual(user2Stone.toString(), user2Stone_2.toString());

        stone_stoneFreezer = BigNumber(await stone.balanceOf(stoneFreezer.address));
        console.log("stone_stoneFreezer is : ", stone_stoneFreezer.toString(10));
        assert.strictEqual(stone_stoneFreezer.toString(10), stone_deposit.toString());
    });
});


