const BigNumber = require('bignumber.js');
const StoneCarnival = artifacts.require("StoneCarnival");
const StoneCarnivalETH = artifacts.require("StoneCarnivalETH");
const IERC20 = artifacts.require("IERC20");
const StoneVault = artifacts.require("StoneVault");


contract("test carnival", async ([deployer, user1, user2, user3, user4, taker2]) => {
    // Forked from mainnet
    const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
    const stone = "0x7122985656e38BDC0302Db86685bb972b145bD3C";

    let stoneCarnival, stoneCarnivalETH, stoneToken, stoneVault;

    beforeEach(async () => {
        stoneCarnival = await StoneCarnival.new(
            stone,
            vault,
            BigNumber(200000).times(1e18).toString(10),
            BigNumber(0.25).times(1e18).toString(10)
        );
        console.log("stoneCarnival: ", stoneCarnival.address);

        stoneCarnivalETH = await StoneCarnivalETH.new(
            stone,
            vault,
            stoneCarnival.address,
            BigNumber(0.25).times(1e18).toString(10)
        );
        console.log("StoneCarnivalETH: ", stoneCarnivalETH.address);

        stoneToken = await IERC20.at(stone);
    });

    it("test carnival", async () => {
        stoneVault = await StoneVault.at(vault);

        // Deposit
        const amount1 = BigNumber(1e18).toString(10);
        const amount2 = BigNumber(9e18).toString(10);

        await stoneCarnivalETH.depositETH({
            value: amount1,
            from: user1
        });
        await stoneCarnivalETH.depositETH({
            value: amount2,
            from: user2
        });

        assert.strictEqual(
            amount1,
            BigNumber((await stoneCarnivalETH.etherDeposited(user1, 0))).toString(10)
        );
        assert.strictEqual(
            amount2,
            BigNumber((await stoneCarnivalETH.etherDeposited(user2, 0))).toString(10)
        );

        let stonePrice = await stoneVault.currentSharePrice.call();
        // Make Deposit
        await stoneCarnivalETH.makeDeposit();

        assert.strictEqual(
            BigNumber(amount1).plus(BigNumber(amount2)).toString(10),
            BigNumber((await stoneCarnivalETH.etherDepositedByRound(0))).toString(10)
        );
        assert.strictEqual(
            BigNumber(amount1).plus(BigNumber(amount2)).div(stonePrice).times(1e18).toFixed(0).toString(10),
            BigNumber((await stoneCarnivalETH.cStoneReceivedByRound(0))).toString(10)
        );
        assert.strictEqual(
            '1',
            BigNumber((await stoneCarnivalETH.round())).toString(10)
        );

        // Claim
        await stoneCarnivalETH.claimCStoneByRound([0], {
            from: user1
        });
        assert.strictEqual(
            BigNumber(amount1).div(stonePrice).times(1e18).toFixed(0).toString(10),
            BigNumber((await stoneCarnival.balanceOf(user1))).toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(user1, 0)));

        await stoneCarnivalETH.depositETH({
            value: amount1,
            from: user2
        });
        assert.strictEqual(
            amount2,
            BigNumber((await stoneCarnivalETH.etherDeposited(user2, 0))).toString(10)
        );
        assert.strictEqual(
            amount1,
            BigNumber((await stoneCarnivalETH.etherDeposited(user2, 1))).toString(10)
        );

        let stonePrice1 = await stoneVault.currentSharePrice.call();
        // Make Deposit
        await stoneCarnivalETH.makeDeposit();

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
            from: user2
        });
        assert.strictEqual(
            BigNumber(BigNumber(amount2).div(stonePrice).times(1e18).toFixed(0)).plus(BigNumber(amount1).div(stonePrice1).times(1e18).toFixed(0)).toString(10),
            BigNumber((await stoneCarnival.balanceOf(user2))).plus(1).toString(10)
        );
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(user1, 0)));
        assert.isTrue((await stoneCarnivalETH.cStoneClaimedByRound(user2, 0)));
    });

});


