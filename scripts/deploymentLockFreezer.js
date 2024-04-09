// truffle exec scripts/deploymentLockFreezer.js --network sepolia
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const AssetsVault = artifacts.require("AssetsVault");
const StrategyController = artifacts.require("StrategyController");

const StoneFreezer = artifacts.require("StoneFreezer");
const taker1 = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";
const taker2 = "0xAC5CC232D28257b30d79d3b26760499BD33bC978";
const taker3 = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";
const vault = "0xfbbe4d65bd61b778161ed71ec9416988ee21e911";
const stone = "0x0D26Efb8bb3122DEd52e814b4B428133Efc82272";
const deployer = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";

module.exports = async function (callback) {
    try {
        // let strategyController = await StrategyController.at("0xfC119BE82d07382074C14f277498bCB2176e5Ea6");
        // strategies = await strategyController.getStrategies();
        // console.log("strategies are : ", strategies);

        // console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        // console.log("strategyB's portion is : ", strategies[1][1].toString(10));

        const stoneFreezer = await StoneFreezer.new(
            stone,
            vault,
            BigNumber(200000).times(1e18).toString(10),
            BigNumber(0.25).times(1e18).toString(10)
        );
        console.log("stoneFreezer: ", stoneFreezer.address);
        // const stoneAddr = "0x0D26Efb8bb3122DEd52e814b4B428133Efc82272";
        // const stone = await Stone.at(stoneAddr);
        // const stoneFreezerAddr = "0x5c9fd1Fd9FF79F8BaDd00D06149087Ff6fDDd199";
        // const stoneFreezer = await StoneFreezer.at(stoneFreezerAddr);
        // const stoneVaultAddr = "0xfbbe4d65bd61b778161ed71ec9416988ee21e911"
        // const stoneVault = await StoneVault.at(stoneVaultAddr);
        // let stoneFreezerBalance = await web3.eth.getBalance(stoneFreezerAddr);
        // console.log("stoneFreezer ether amount:", stoneFreezerBalance.toString());
        // let stoneVaultBalance = await web3.eth.getBalance(stoneVaultAddr);
        // console.log("stoneVaultBalance ether amount:", stoneVaultBalance.toString());
        // const assetsVaultAddress = "0x940afc1c7b792f7afed70beb7fc40bc2d09bf916";
        // const assetsVault = await AssetsVault.at(assetsVaultAddress);
        // //check asset vault balance
        // let assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount:", assetsVaultBalance.toString());

        // let withdrawableAmountInPast = BigNumber(await stoneVault.withdrawableAmountInPast());
        // console.log("withdrawableAmountInPast is : ", withdrawableAmountInPast.toString(10));

        // let price2 = BigNumber(await stoneVault.currentSharePrice.call());
        // console.log("current share price2 is : ", price2.toString());

        // await stoneFreezer.pauseDeposit({ from: deployer });
        // await stoneFreezer.forceTerminate({ from: deployer });
        // console.log("terminated!!!")

        // await stoneFreezer.withdrawStone({ from: taker1 });
        // await stoneFreezer.withdrawStone({ from: taker2 });
        // await stoneFreezer.withdrawStone({ from: taker3 });

        // let taker1_stone = BigNumber(await stone.balanceOf(taker1));
        // let taker2_stone = BigNumber(await stone.balanceOf(taker2));
        // let taker3_stone = BigNumber(await stone.balanceOf(taker3));
        // console.log("taker1 stone : ", taker1_stone.toString(10));
        // console.log("taker2 stone : ", taker2_stone.toString(10));
        // console.log("taker3 stone : ", taker3_stone.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}