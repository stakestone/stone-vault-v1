// truffle compile
// truffle exec scripts/sepoliaTestLockStone.js --network sepolia
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const taker1 = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
const taker2 = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
const taker3 = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";
const deployer = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
const { time } = require("@openzeppelin/test-helpers");
const Stone = artifacts.require("Stone");
const MULTIPLIER = 1e18;
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StoneCarnival = artifacts.require("mining/StoneCarnival");
const StoneCarnivalETH = artifacts.require("StoneCarnivalETH");
const StrategyController = artifacts.require("StrategyController");

const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");

//结果比对，（taker1+taker2）*(withdrawETH之前的价格 - 1) == AssetsVault在withdrawETH之前和MakeDeposit结算之后的差
// 策略前后的金额差 + AssetsVault在withdrawETH之前和MakeDeposit结算之后的差 == 策略的盈亏
// 最后提取stone数量之和 == taker3 stone数量+（taker1+taker2）/withdrawETH之前的价格
// 三个用户stone的比例在提取前后比例不变
module.exports = async function (callback) {
    try {
        const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";
        const strategyController = await StrategyController.at(strategyControllerAddr);
        // console.log("strategyController: ", strategyController.address);

        const strategyAAddr = "0xE942cDd0AF66aB9AB06515701fa3707Ec7deB93e";
        // const strategyBAddr = "0x716d050515D7Ab43dfAcca81D2aDBf2F76591Cd4";

        const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572"
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const stoneAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(stoneAddr);
        // let price = await stoneVault.currentSharePrice.call();
        // console.log("current share price is : ", price.toString());

        const assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        const assetsVault = await AssetsVault.at(assetsVaultAddress);
        //check asset vault balance
        // let assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount:", assetsVaultBalance.toString());

        const stoneCarnivalAddr = "0x4d831e22F062b5327dFdB15f0b6a5dF20E2E3dD0";
        const stoneCarnival = await StoneCarnival.at(stoneCarnivalAddr);
        const stoneCarnivalETHAddr = "0xb3Fc739972795E0F2A8DA00173ee9Cf834b54541";
        const stoneCarnivalETH = await StoneCarnivalETH.at(stoneCarnivalETHAddr);

        // let stoneCarnival_stone = BigNumber(await stone.balanceOf(stoneCarnivalAddr));
        // console.log("stoneCarnival_stone stone : ", stoneCarnival_stone.toString(10));

        let cSTONE = stoneCarnival;

        const amount1 = BigNumber(26e16).toString(10);

        // await stoneCarnivalETH.depositETH({
        //     value: amount1,
        //     from: taker1
        // });
        // await stone.approve(stoneCarnivalETHAddr, BigNumber(1000).times(MULTIPLIER), {
        //     from: taker1
        // });
        // await stone.approve(stoneCarnival.address, BigNumber(1000).times(MULTIPLIER), {
        //     from: taker2
        // });
        // await stoneCarnival.depositStone(amount1, {
        //     from: taker2
        // });
        // await stone.approve(stoneFreezer.address, BigNumber(1000).times(MULTIPLIER), {
        //     from: taker3
        // });
        const gasPrice = await web3.eth.getGasPrice();
        await stoneCarnivalETH.claimCStoneByRound([0], { from: taker1, nonce: 71, gasPrice: gasPrice, gas: 500000 });

        let taker1_stone = BigNumber(await stone.balanceOf(taker1));
        let taker2_stone = BigNumber(await stone.balanceOf(taker2));
        // let taker3_stone = BigNumber(await stone.balanceOf(taker3));

        console.log("taker1 stone : ", taker1_stone.toString(10));
        console.log("taker2 stone : ", taker2_stone.toString(10));
        // console.log("taker3 stone : ", taker3_stone.toString(10));

        let taker1_cstone = BigNumber(await cSTONE.balanceOf(taker1));
        let taker2_cstone = BigNumber(await cSTONE.balanceOf(taker2));
        // let taker3_cstone = BigNumber(await cSTONE.balanceOf(taker3));

        console.log("taker1 cstone : ", taker1_cstone.toString(10));
        console.log("taker2 cstone : ", taker2_cstone.toString(10));
        // console.log("taker3 cstone : ", taker3_cstone.toString(10));

        // await stoneFreezer.depositStone(taker1_stone.toString(), {
        //     from: taker1
        // });

        // await stoneFreezer.depositStone(taker2_stone.toString(), {
        //     from: taker2
        // });

        // await stoneFreezer.depositStone(taker3_stone.toString(), {
        //     from: taker3
        // });

        // await sleep(2);
        // await stoneVault.rollToNextRound({
        //     from: taker1
        // });
        // console.log("settlement finished!");

        // let price1 = await stoneVault.currentSharePrice.call();
        // console.log("current share price1 is : ", price1.toString());

        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount1:", assetsVaultBalance.toString());

        // let strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
        // console.log("strategyA_value is : ", strategyA_value.toString(10));

        // let strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
        // console.log("strategyB_value is : ", strategyB_value.toString(10));

        // await stoneFreezer.pauseDeposit({ from: deployer });

        // let request_amount = taker1_stone.plus(taker2_stone);
        // console.log("request amount is : ", request_amount.toString());
        // let freezer_stoneAmount = BigNumber(await stone.balanceOf(stoneFreezerAddr));
        // console.log("freezer_stoneAmount : ", freezer_stoneAmount.toString(10));

        // await stoneFreezer.makeRequest(request_amount.toString(),
        //     {
        //         from: deployer
        //     });

        // await stoneFreezer.cancelWithdraw(request_amount.toString(),
        //     {
        //         from: deployer
        //     });

        // await sleep(2);
        // await time.advanceBlock();
        // await stoneVault.rollToNextRound();

        // await truffleAssert.fails(
        //     stoneFreezer.withdrawETH(request_amount.toString(),
        //         {
        //             from: deployer
        //         }),
        //     truffleAssert.ErrorType.REVERT,
        //     "exceed withdrawable"
        // );
        // await stoneFreezer.makeRequest(request_amount.toString(),
        //     {
        //         from: deployer
        //     });
        // // strategies earn
        // let interest1 = BigNumber(3e17);
        // await web3.eth.sendTransaction({
        //     from: taker2,
        //     to: strategyAAddr,
        //     value: interest1.toString(10)
        // })
        // await sleep(2);
        // await time.advanceBlock();
        // await stoneVault.rollToNextRound();
        // let price2 = BigNumber(await stoneVault.currentSharePrice.call());
        // console.log("current share price2 is : ", price2.toString());

        // let tx = await stoneFreezer.withdrawETH(request_amount.toString(),
        //     {
        //         from: deployer
        //     });
        // let freezerBalance1 = BigNumber(await web3.eth.getBalance(stoneFreezer.address));
        // console.log("After freezerBalance ether amount:", freezerBalance1.toString());
        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount2:", assetsVaultBalance.toString());

        // let strategyA_value1 = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
        // console.log("strategyA_value1 is : ", strategyA_value1.toString(10));

        // let strategyB_value1 = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
        // console.log("strategyB_value1 is : ", strategyB_value1.toString(10));

        // let freezer_stone1 = BigNumber(await stone.balanceOf(stoneFreezerAddr));
        // console.log("After withdrawETH freezer_stone amount:", freezer_stone1.toString());
        // // fix amount 
        // let tx1 = await stoneFreezer.makeDeposit(request_amount.toString(),
        //     {
        //         from: deployer
        //     });
        // let freezerBalance3 = BigNumber(await web3.eth.getBalance(stoneFreezer.address));
        // console.log("After freezerBalance3 ether amount:", freezerBalance3.toString());

        // await sleep(2);
        // await time.advanceBlock();
        // await stoneVault.rollToNextRound();

        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount3:", assetsVaultBalance.toString());

        // strategyA_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyAAddr));
        // console.log("strategyA_value3 is : ", strategyA_value.toString(10));

        // strategyB_value = BigNumber(await strategyController.getStrategyValidValue.call(strategyBAddr));
        // console.log("strategyB_value3 is : ", strategyB_value.toString(10));

        // await stoneFreezer.forceTerminate({ from: deployer });

        // let freezer_stone2 = BigNumber(await stone.balanceOf(stoneFreezerAddr));
        // console.log("After withdrawETH freezer_stone2 amount:", freezer_stone2.toString());

        // await stoneFreezer.withdrawStone({ from: taker1 });
        // await stoneFreezer.withdrawStone({ from: taker2 });
        // await stoneFreezer.withdrawStone({ from: taker3 });

        // taker1_stone = BigNumber(await stone.balanceOf(taker1));
        // taker2_stone = BigNumber(await stone.balanceOf(taker2));
        // taker3_stone = BigNumber(await stone.balanceOf(taker3));
        // console.log("taker1 stone : ", taker1_stone.toString(10));
        // console.log("taker2 stone : ", taker2_stone.toString(10));
        // console.log("taker3 stone : ", taker3_stone.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
    function sleep(s) {
        return new Promise((resolve) => {
            setTimeout(resolve, s * 1000);
        });
    }
}