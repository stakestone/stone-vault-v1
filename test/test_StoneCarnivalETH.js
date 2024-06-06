
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const RLP = require('rlp');
const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StoneCarnival = artifacts.require("StoneCarnival");
const StoneCarnivalETH = artifacts.require("StoneCarnivalETH");
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
contract("test_StoneCarnivalETH", async ([deployer, taker1, taker2, taker3, taker4, feeRecipient]) => {
    // const PERCENTAGE = BigNumber(1).times(1e4);
    const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
    console.log('Gas price:', gasPrice.toString());
    const MULTIPLIER = 1e18;
    const cap = BigNumber(30).times(1e18);
    const minStoneAllowed = 1e15;
    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const rs = web3.utils.sha3(encoded);
        return '0x' + rs.substr(rs.length - 40, 40);
    }
    let stoneVault, stoneCarnival, stoneCarvivalAddr, cSTONE, proposal, minter, assetsVaultAddr, strategyController, strategyAAddr, strategyBAddr, stone, proposalAddr, currentTime, mockNullStrategyA, mockNullStrategyB;

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
        console.log("mockNullmockNullStrategyA.address: ", strategyAAddr);
        console.log("mockNullStrategyBAddr: ", strategyBAddr);
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
        strategyAAddr = mockNullStrategyA.address;
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        strategyBAddr = mockNullStrategyB.address;

        console.log("mockNullStrategyB: ", mockNullStrategyB.address);
        strategyController = await StrategyController.at(strategyControllerAddr);
        await stoneVault.setWithdrawFeeRate(withdrawFeeRate, {
            from: deployer
        })
        await stoneVault.setFeeRecipient(feeRecipient, {
            from: deployer
        })
        stoneCarnival = await StoneCarnival.new(
            stone.address,
            stoneVault.address,
            cap,
            minStoneAllowed
        );
        console.log("stoneCarnival: ", stoneCarnival.address);
        stoneCarvivalAddr = stoneCarnival.address;
        cSTONEAddress = stoneCarnival.address;
        cSTONE = await StoneCarnival.at(cSTONEAddress);

    });
    it("test1_taker1 deposit ETH_taker1 claim cSTONE_taker2 claim cSTONE", async () => {

        const stoneCarnivalETH = await StoneCarnivalETH.new(
            stone.address,
            stoneVault.address,
            stoneCarvivalAddr,
            minStoneAllowed
        );
        console.log("stoneCarnivalETH : ", stoneCarnivalETH.address);

        const eth_deposit_amount1 = BigNumber(3).times(1e18);
        const eth_deposit_amount2 = BigNumber(4).times(1e18);

        await stoneCarnivalETH.depositETH({
            value: BigNumber(eth_deposit_amount1),
            from: taker1
        });
        await stoneCarnivalETH.depositETH({
            value: BigNumber(eth_deposit_amount2),
            from: taker2
        });
        await stoneCarnivalETH.makeDeposit({ from: deployer })
        await stoneCarnivalETH.claimCStoneByRound([0], { from: taker1 });
        let cStone_taker1 = BigNumber(await cSTONE.balanceOf(taker1));
        console.log("cStone_taker1 is : ", cStone_taker1.toString(10));
        let cStone_taker2 = BigNumber(await cSTONE.balanceOf(taker2));
        console.log("cStone_taker2 is : ", cStone_taker2.toString(10));
        let stonePrice = await stoneVault.currentSharePrice.call();

        assert.strictEqual(
            cStone_taker1.toString(10),
            eth_deposit_amount1.toString(10)
        );
        assert.strictEqual(
            eth_deposit_amount1.plus(eth_deposit_amount2).toString(10),
            BigNumber(await stoneCarnivalETH.etherDepositedByRound(0)).toString(10)
        );
        assert.strictEqual(
            eth_deposit_amount1.toString(10),
            BigNumber(await stoneCarnivalETH.etherDeposited(taker1, 0)).toString(10)
        );
        assert.strictEqual(
            true,
            await stoneCarnivalETH.cStoneClaimedByRound(taker1, 0)
        );
        assert.strictEqual(
            false,
            await stoneCarnivalETH.cStoneClaimedByRound(taker2, 0)
        );
        assert.strictEqual(
            eth_deposit_amount1.plus(eth_deposit_amount2).div(stonePrice).times(1e18).toFixed(0).toString(10).toString(10),
            BigNumber((await stoneCarnivalETH.cStoneReceivedByRound(0))).toString(10)
        );
        assert.strictEqual(
            cStone_taker2.toString(10),
            '0'
        );

        let claimed = BigNumber(await stoneCarnivalETH.claimCStoneByRound.call([0], { from: taker2 }));
        console.log("cStone_taker claimed is : ", claimed.toString(10));
        await stoneCarnivalETH.claimCStoneByRound([0], { from: taker2 });
        cStone_taker2 = BigNumber(await cSTONE.balanceOf(taker2));
        console.log("cStone_taker2 is : ", cStone_taker2.toString(10));
        assert.strictEqual(
            cStone_taker2.toString(10),
            eth_deposit_amount2.div(stonePrice).times(1e18).toString(10)
        );
        assert.strictEqual(
            cStone_taker2.toString(10),
            claimed.toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker2, 0)));

        let claimed1 = BigNumber(await stoneCarnivalETH.claimCStoneByRound.call([0], { from: taker2 }));
        console.log("cStone_taker2 is : ", claimed1.toString(10));
        assert.strictEqual(
            "0",
            claimed1.toString(10)
        );
    });
    it("test2_taker deposit ETH_two rounds_taker1 claim each round while taker2 claim after two rounds", async () => {
        const stoneCarnivalETH = await StoneCarnivalETH.new(
            stone.address,
            stoneVault.address,
            stoneCarvivalAddr,
            minStoneAllowed
        );
        console.log("stoneCarnivalETH : ", stoneCarnivalETH.address);

        // Deposit
        const amount1 = BigNumber(13e18).toString(10);
        const amount2 = BigNumber(9e18).toString(10);

        await stoneCarnivalETH.depositETH({
            value: amount1,
            from: taker1
        });
        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker2
        });

        let stonePrice = await stoneVault.currentSharePrice.call();
        // Make Deposit
        await sleep(2);
        await time.advanceBlock();

        await stoneCarnivalETH.makeDepositAndRoll();

        // Claim
        await stoneCarnivalETH.claimCStoneByRound([0], {
            from: taker1
        });
        assert.strictEqual(
            BigNumber(amount1).div(stonePrice).times(1e18).toFixed(0).toString(10),
            BigNumber((await stoneCarnival.balanceOf(taker1))).toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker1, 0)));

        await stoneCarnivalETH.depositETH({
            value: amount1,
            from: taker2
        });
        assert.strictEqual(
            amount2,
            BigNumber((await stoneCarnivalETH.etherDeposited(taker2, 0))).toString(10)
        );
        assert.strictEqual(
            amount1,
            BigNumber((await stoneCarnivalETH.etherDeposited(taker2, 1))).toString(10)
        );

        let stonePrice1 = await stoneVault.currentSharePrice.call();
        // Make Deposit
        await truffleAssert.fails(
            stoneCarnivalETH.makeDepositAndRoll({
                from: deployer
            }),
            truffleAssert.ErrorType.REVERT,
            "cap"
        );
        await stoneCarnival.setCap(BigNumber(100e18), { from: deployer });
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll({
            from: deployer
        });
        assert.strictEqual(
            BigNumber(amount1).toString(10),
            BigNumber((await stoneCarnivalETH.etherDepositedByRound(1))).toString(10)
        );
        assert.strictEqual(
            BigNumber(amount1).div(stonePrice1).times(1e18).toFixed(0).toString(10),
            BigNumber((await stoneCarnivalETH.cStoneReceivedByRound(1))).toString(10)
        );
        assert.strictEqual(
            '2',
            BigNumber((await stoneCarnivalETH.round())).toString(10)
        );

        // Claim
        await stoneCarnivalETH.claimCStoneByRound([0, 1], {
            from: taker2
        });
        assert.strictEqual(
            BigNumber(BigNumber(amount2).div(stonePrice).times(1e18).toFixed(0)).plus(BigNumber(amount1).div(stonePrice1).times(1e18).toFixed(0)).toString(10),
            BigNumber((await stoneCarnival.balanceOf(taker2))).toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker1, 0)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker2, 0)));
    });


    it("test3_taker deposit ETH_three rounds_taker1 claim 1st and 3rd rounds", async () => {
        const stoneCarnivalETH = await StoneCarnivalETH.new(
            stone.address,
            stoneVault.address,
            stoneCarvivalAddr,
            minStoneAllowed
        );
        console.log("stoneCarnivalETH : ", stoneCarnivalETH.address);

        // Deposit
        const amount1 = BigNumber(2e18).toString(10);
        const amount2 = BigNumber(4e18).toString(10);

        await stoneCarnivalETH.depositETH({
            value: amount1,
            from: taker1
        });
        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker2
        });

        let stonePrice = await stoneVault.currentSharePrice.call();
        // Make Deposit
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll();
        let stonePrice1 = await stoneVault.currentSharePrice.call();
        console.log("the first settlement")

        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker1
        });
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll();
        let stonePrice2 = await stoneVault.currentSharePrice.call();

        console.log("the second settlement")
        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker2
        });
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll({
            from: deployer
        });
        let stonePrice3 = await stoneVault.currentSharePrice.call();

        assert.strictEqual(
            BigNumber(amount2).toString(10),
            BigNumber((await stoneCarnivalETH.etherDepositedByRound(1))).toString(10)
        );
        assert.strictEqual(
            BigNumber(amount2).div(stonePrice1).times(1e18).toFixed(0).toString(10),
            BigNumber((await stoneCarnivalETH.cStoneReceivedByRound(1))).toString(10)
        );
        assert.strictEqual(
            '3',
            BigNumber((await stoneCarnivalETH.round())).toString(10)
        );

        // Claim
        await stoneCarnivalETH.claimCStoneByRound([0, 1], {
            from: taker1
        });
        await stoneCarnivalETH.claimCStoneByRound([0, 2], {
            from: taker2
        });
        assert.strictEqual(
            BigNumber(BigNumber(amount2).div(stonePrice).times(1e18).toFixed(0)).plus(BigNumber(amount2).div(stonePrice1).times(1e18).toFixed(0)).toString(10),
            BigNumber((await stoneCarnival.balanceOf(taker2))).toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker1, 0)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker1, 1)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker2, 2)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker2, 0)));

        assert.isTrue(!(await stoneCarnivalETH.cStoneClaimedByRound(taker1, 2)));
        assert.isTrue(!(await stoneCarnivalETH.cStoneClaimedByRound(taker2, 1)));
        let claimed = BigNumber(await stoneCarnivalETH.claimCStoneByRound.call([1], { from: taker2 }));
        console.log("cStone_taker claimed is : ", claimed.toString(10));
        let claimed1 = BigNumber(await stoneCarnivalETH.claimCStoneByRound.call([0, 1], { from: taker1 }));
        console.log("cStone_taker claimed1 is : ", claimed1.toString(10));
        assert.strictEqual(
            claimed.toString(10),
            '0'
        );
        assert.strictEqual(
            claimed1.toString(10),
            '0'
        );
    });
    it("test4_taker deposit ETH_three rounds_taker1 claim 1st first and then the 3rd rounds", async () => {
        const stoneCarnivalETH = await StoneCarnivalETH.new(
            stone.address,
            stoneVault.address,
            stoneCarvivalAddr,
            minStoneAllowed
        );
        console.log("stoneCarnivalETH : ", stoneCarnivalETH.address);

        // Deposit
        const amount1 = BigNumber(2e18).toString(10);
        const amount2 = BigNumber(4e18).toString(10);

        await stoneCarnivalETH.depositETH({
            value: amount1,
            from: taker1
        });
        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker2
        });

        let stonePrice = await stoneVault.currentSharePrice.call();
        // Make Deposit
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll();
        let stonePrice1 = await stoneVault.currentSharePrice.call();
        console.log("the first settlement")

        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker1
        });
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll();
        let stonePrice2 = await stoneVault.currentSharePrice.call();

        console.log("the second settlement")
        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: taker2
        });
        await sleep(2);
        await time.advanceBlock();
        await stoneCarnivalETH.makeDepositAndRoll({
            from: deployer
        });
        let stonePrice3 = await stoneVault.currentSharePrice.call();

        assert.strictEqual(
            BigNumber(amount2).toString(10),
            BigNumber((await stoneCarnivalETH.etherDepositedByRound(1))).toString(10)
        );
        assert.strictEqual(
            BigNumber(amount2).div(stonePrice1).times(1e18).toFixed(0).toString(10),
            BigNumber((await stoneCarnivalETH.cStoneReceivedByRound(1))).toString(10)
        );
        assert.strictEqual(
            '3',
            BigNumber((await stoneCarnivalETH.round())).toString(10)
        );

        // Claim
        await stoneCarnivalETH.claimCStoneByRound([0, 1], {
            from: taker1
        });
        await stoneCarnivalETH.claimCStoneByRound([2], {
            from: taker2
        });
        await stoneCarnivalETH.claimCStoneByRound([0], {
            from: taker2
        });
        assert.strictEqual(
            BigNumber(BigNumber(amount2).div(stonePrice).times(1e18).toFixed(0)).plus(BigNumber(amount2).div(stonePrice1).times(1e18).toFixed(0)).toString(10),
            BigNumber((await stoneCarnival.balanceOf(taker2))).toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker1, 0)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker1, 1)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker2, 2)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(taker2, 0)));

        assert.isTrue(!(await stoneCarnivalETH.cStoneClaimedByRound(taker1, 2)));
        assert.isTrue(!(await stoneCarnivalETH.cStoneClaimedByRound(taker2, 1)));
        let claimed = BigNumber(await stoneCarnivalETH.claimCStoneByRound.call([1], { from: taker2 }));
        console.log("cStone_taker claimed is : ", claimed.toString(10));
        let claimed1 = BigNumber(await stoneCarnivalETH.claimCStoneByRound.call([0, 1], { from: taker1 }));
        console.log("cStone_taker claimed1 is : ", claimed1.toString(10));
        assert.strictEqual(
            claimed.toString(10),
            '0'
        );
        assert.strictEqual(
            claimed1.toString(10),
            '0'
        );
    });

    // let cstone_carnival = cSTONE.balanceOf(stoneCarnival.address);

});