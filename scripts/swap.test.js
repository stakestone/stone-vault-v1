
//truffle exec scripts/swap.test.js --network local
const BigNumber = require('bignumber.js');
const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const MockToken = artifacts.require("MockToken");
const SwappingAggregator = artifacts.require("SwappingAggregator");
const IStableSwapPool = artifacts.require("IStableSwapPool");
const ISwapRouter = artifacts.require("ISwapRouter");
const IWETH9 = artifacts.require("IWETH9");
const { expectRevert } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const Swap = artifacts.require("Swap");
const StoneVault = artifacts.require("StoneVault");
const user1 = '0xe3b89e352aadd558489ec87f6b64b299c0c4b553';
const user2 = '0x648a7ad8a03b1dbbb457a4d30ad6dc05bf4b20e5';
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const StrategyController = artifacts.require("StrategyController");
const MULTIPLIER = 1e6;
const rate = 1000;

module.exports = async function (callback) {
    try {
        //curve没有router，是pool地址；只要买到价格合适，再去存或者取，结算后用trans hash到event.js里查看日志里是否存在uni router / curve pool。注意大小写。
        const UNI_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const stETHUniPool = "0x8f8eaaF88448ba31BdffF6aD8c42830c032C6392";
        const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
        const stETHSlippage = 997000;
        const stETHFee = 10000;
        const assetsVaultAddr = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        const swappingAggregatorAddr = "0x15469528C11E8Ace863F3F9e5a8329216e33dD7d";
        const swappingAggregator = await SwappingAggregator.at(swappingAggregatorAddr);
        const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        // 每个交易的token都需要approve
        let token = await MockToken.at(stETHAddr);

        const stETHHoldingStrategyAddr = "0xE942cDd0AF66aB9AB06515701fa3707Ec7deB93e";
        let sTETHHoldingStrategy = await STETHHoldingStrategy.at(stETHHoldingStrategyAddr);

        let owner = await sTETHHoldingStrategy.governance();
        console.log("owner is : ", owner);
        let stETHBalance = BigNumber(await token.balanceOf(stETHHoldingStrategyAddr));
        console.log("stETHBalance of strategy is :.... ", stETHBalance.toString(10));

        const testSwap = await Swap.new(stETHAddr, swappingAggregatorAddr, stETHHoldingStrategyAddr, assetsVaultAddr, { from: deployer });
        const testSwapAddr = testSwap.address;
        await testSwap.updateWhitelist([user1], [true], { from: deployer });
        let amount1 = BigNumber(1e18);
        let amount2 = BigNumber(4e18);
        // makers deposit
        let depositAmount_user1 = BigNumber(await testSwap.depositAmount(user1));
        console.log("depositAmount user1 is : ", depositAmount_user1.toString(10));
        await testSwap.deposit({ value: amount1, from: user1 });
        await expectRevert.unspecified(testSwap.deposit({ value: amount2, from: user2 }));
        await testSwap.updateWhitelist([user2], [true], { from: deployer });
        await testSwap.deposit({ value: amount2, from: user2 });
        let ethBalance = BigNumber(await web3.eth.getBalance(testSwapAddr));
        console.log("ethBalance is:", ethBalance.toString(10));
        assert.strictEqual(amount1.plus(amount2).toString(10), ethBalance.toString(10));

        let assetETHBlance = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
        console.log(" assetETHBlance is : ", assetETHBlance.toString(10));

        // stETH move to testSwap
        await swappingAggregator.setCurveRouter(
            stETHAddr,
            testSwapAddr,
            1,
            stETHSlippage, { from: owner }
        )
        await stoneVault.clearStrategy(stETHHoldingStrategyAddr, { from: owner });
        let assetETHBlance1 = BigNumber(await web3.eth.getBalance(assetsVaultAddr));
        console.log(" assetETHBlance1 is : ", assetETHBlance1.toString(10));

        let diff = assetETHBlance1.minus(assetETHBlance);
        console.log(" asset diff is : ", diff.toString(10));
        // ETH move to AssetVault
        assert.strictEqual(diff.toString(10), ethBalance.toString(10));
        let stETH_out = ethBalance.times(rate).div(MULTIPLIER).plus(ethBalance);
        let stETHBalance1 = BigNumber(await token.balanceOf(stETHHoldingStrategyAddr));
        console.log("stETHBalance1 of strategy is :.... ", stETHBalance1.toString(10));
        // The remaining stETH move back to strategy
        assert.strictEqual(stETHBalance.minus(stETHBalance1).toString(10), stETH_out.toString(10));

        // maker try to withdraw should fail
        await expectRevert.unspecified(testSwap.withdraw(1, true, { from: user1 }));
        // deposit again
        await testSwap.deposit({ value: amount1, from: user1 });
        await testSwap.deposit({ value: amount2, from: user2 });
        // let amount3 = BigNumber(101e16);
        let depositAmount1_user1 = BigNumber(await testSwap.depositAmount(user1));
        console.log("depositAmount1_user1 user1 is : ", depositAmount1_user1.toString(10));

        await expectRevert.unspecified(testSwap.withdraw(amount2, true, { from: user1 }));
        let user1_balance = BigNumber(await web3.eth.getBalance(user1));
        console.log(" user1_balance is : ", user1_balance.toString(10));
        await testSwap.withdraw(amount1, true, { from: user1 });
        let user1_balance1 = BigNumber(await web3.eth.getBalance(user1));
        console.log(" user1_balance1 is : ", user1_balance1.toString(10));
        // withdraw success before change
        let user2_balance = BigNumber(await web3.eth.getBalance(user2));
        console.log(" user2_balance is : ", user2_balance.toString(10));
        await testSwap.withdraw(amount2, true, { from: user2 });
        let user2_balance1 = BigNumber(await web3.eth.getBalance(user2));
        console.log(" user2_balance1 is : ", user2_balance1.toString(10));
        // withdraw success before change
        // assert.strictEqual(user1_balance1.minus(user1_balance).toString(10), amount1.toString(10));
        // assert.strictEqual(user2_balance1.minus(user2_balance).toString(10), amount2.toString(10));
        // withdraw stETH
        let stETH_user1 = BigNumber(await token.balanceOf(user1));
        console.log("stETH_user1 is :.... ", stETH_user1.toString(10));
        await testSwap.withdraw(amount1, false, { from: user1 });
        let stETH1_user1 = BigNumber(await token.balanceOf(user1));
        console.log("stETH1_user1 is :.... ", stETH1_user1.toString(10));
        // assert.strictEqual(stETH1_user1.minus(stETH_user1).toString(10), amount1.times(1.001).toString(10));

        let stETH_user2 = BigNumber(await token.balanceOf(user2));
        console.log("stETH_user2 is :.... ", stETH_user2.toString(10));
        await testSwap.withdraw(amount2, false, { from: user2 });
        let stETH1_user2 = BigNumber(await token.balanceOf(user2));
        console.log("stETH1_user2 is :.... ", stETH1_user2.toString(10));
        assert.strictEqual(stETH1_user2.minus(stETH_user2).toString(10), amount2.times(1.001).toString(10));


        callback();

    } catch (e) {
        callback(e);
    }
}