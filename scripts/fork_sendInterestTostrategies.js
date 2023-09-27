// truffle compile
// truffle exec scripts/fork_sendInterestTostrategies.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const deployer = "0x72632d09c2d7cd5009f3a8541f47803ec4baf535";

const StrategyController = artifacts.require("StrategyController");

module.exports = async function (callback) {
    try {
        // const strategyController = await StrategyController.at("0x30CAD1dAA1bD1A6f92AA62F259cf3D00a606605D");
        // strategies = await strategyController.getStrategies();
        // console.log("strategies are : ", strategies);
        // console.log("strategy length is : ", strategies[0].length);
        const stoneVault = await StoneVault.at("0xA62F9C5af106FeEE069F38dE51098D9d81B90572");
        let assetsVaultAddress = "0xad8bfcdC4a75aEA6759488C44735E132ffbACa38";
        const stoneToken = await Stone.at("0x3ebdc890d8Fc00FfD2E22055A8d9114f33124FC4");

        // let strategy1 = strategies[0][1];
        // console.log("strategy1 is : ", strategies[0][1]);
        // // let interest = BigNumber(4e18);

        // let strategy_value = BigNumber(await strategyController.getStrategyValue.call(strategy1));
        // console.log("strategy_value1 is : ", strategy_value.toString(10));
        // let pending_value = BigNumber(await strategyController.getAllStrategyPendingValue.call());
        // console.log("pending_value is : ", pending_value.toString(10));
        // let allStrategyValidValue = BigNumber(await strategyController.getAllStrategyValidValue.call());
        // console.log("allStrategyValidValue is : ", allStrategyValidValue.toString(10));
        // let strategy_pending_value = BigNumber(await strategyController.getStrategyPendingValue.call(strategy1));
        // console.log("strategy_pending_value is : ", strategy_pending_value.toString(10));
        // let strategy_valid_value = BigNumber(await strategyController.getStrategyValidValue.call(strategy1));
        // console.log("strategy_valid_value is : ", strategy_valid_value.toString(10));

        // // await web3.eth.sendTransaction({
        // //     from: deployer,
        // //     to: strategy1,
        // //     value: interest.toString(10)
        // // })
        // let strategy_value2 = BigNumber(await strategyController.getStrategyValidValue.call(strategy1));
        // console.log("strategy_value2 is : ", strategy_value2.toString(10));

        // await stoneVault.requestWithdraw(BigNumber(2e14), {
        //     from: deployer
        // });
        // console.log("user withdraw!");
        // const result = await stoneVault.rollToNextRound();
        // console.log("settlement finished!");
        // console.log("rollToNext transaction : ", result);
        // assetsVaultBalance = BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        // console.log("assetsVault ether amount:", assetsVaultBalance.toString());

        // let allStrategyValue = BigNumber(await strategyController.getAllStrategiesValue.call());
        // console.log("allStrategyValidValue is : ", allStrategyValue.toString(10));

        // let withdrawableAmountInPast = BigNumber(await stoneVault.withdrawableAmountInPast());
        // let totalAmount = assetsVaultBalance.plus(allStrategyValue).minus(withdrawableAmountInPast);

        // totalStone = BigNumber(await stoneToken.totalSupply());

        // let withdrawingSharesInPast = BigNumber(await stoneVault.withdrawingSharesInPast());

        // let cur_Stone = BigNumber(totalStone.minus(withdrawingSharesInPast));
        // let price = BigNumber(totalAmount.div(totalStone.minus(withdrawingSharesInPast)));
        // console.log("price calc is : ", price.toString(10));

        let latestRoundID = BigNumber(await stoneVault.latestRoundID());
        console.log("latestRoundID is : ", latestRoundID.toString(10));
        for (i = 0; i < latestRoundID; i++) {
            let pricePerRound = BigNumber(await stoneVault.roundPricePerShare(i));
            console.log(i, "price is : ", pricePerRound.toString(10));
        }
        let curSharePrice = BigNumber(await stoneVault.currentSharePrice.call());
        console.log("curSharePrice is : ", curSharePrice.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }

}