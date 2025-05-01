// truffle compile
// truffle exec scripts/3exePropse.js --network local
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const proposer = "0x83000EF01eD5C15462ef20066091Abd3654e523f";
const Stone = artifacts.require("Stone");
const taker1 = "0x66f1c92b29441bcba925c07abbba2e23676b79a4";
const { time } = require("@openzeppelin/test-helpers");
const Web3 = require('web3');
// const Propose = require('./2Propose');
const web3 = new Web3('http://127.0.0.1:8545');
const Proposal = artifacts.require("Proposal");

const MellowDepositWstETHStrategy = artifacts.require("MellowDepositWstETHStrategy");
const NativeLendingETHStrategy = artifacts.require("NativeLendingETHStrategy");
const EigenStrategy = artifacts.require("EigenLSTRestaking");
const SymbioticDepositWBETHStrategy = artifacts.require("SymbioticDepositWBETHStrategy");
const SymbioticDepositWstETHStrategy = artifacts.require("SymbioticDepositWstETHStrategy");
const StrategyController = artifacts.require("StrategyController");
const Strategy = artifacts.require("Strategy");
const Abi = web3.eth.abi;
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const swappingAggregatorAddr = "0x15469528C11E8Ace863F3F9e5a8329216e33dD7d";
const SwappingAggregator = artifacts.require("SwappingAggregator");
module.exports = async function (callback) {
    try {
        // 启用 taker1 的 impersonation
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [taker1],
            id: 1,
        });

        // 启用 deployer 的 impersonation
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [deployer],
            id: 2,
        });
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [proposer],
            id: 3,
        });
        const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(st);

        const strategyController = await StrategyController.at("0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2");
        const strategyControllerAddr = strategyController.address;
        console.log("strategyController addr is : ", strategyControllerAddr);

        const proposal = await Proposal.at("0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b");
        let mellowDepositWstETHStrategy = await MellowDepositWstETHStrategy.at("0xe9b7ccFc7d05028bD8214bd04F9B4fa7C734d574");
        let nativeLendingETHStrategy = await NativeLendingETHStrategy.at("0x2D70868f12A05b8C347974415baC5de053DAa376");
        let eigenStrategy = await EigenStrategy.at("0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982");
        let symbioticDepositWBETHStrategy = await SymbioticDepositWBETHStrategy.at("0x58907ad5c7eD1EaB5FdCc0Cc347F25bF5BC0e7da");
        let symbioticDepositWstETHStrategy = await SymbioticDepositWstETHStrategy.at("0xc20dB8e8a23F5Ec02126617C4B76f6092A27Ce4b");

        // let latestUpdateTime_ba1 = BigNumber(await sTETHHoldingStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba1 is :", latestUpdateTime_ba1.toString(10));
        await time.advanceBlock();

        proposals = await proposal.getProposals();
        // console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);
        // const proposalDetail = await proposal.proposalDetails(latestProposal);

        // console.log("Proposal Detail:");
        // console.log("Proposer:", proposalDetail.proposer);
        // console.log("Deadline:", proposalDetail.deadline.toString()); // deadline 是 uint256，需转换为字符串

        // latestUpdateTime_ba1 = BigNumber(await sTETHHoldingStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba1 is :", latestUpdateTime_ba1.toString(10));

        await time.advanceBlock();
        // 获取当前区块时间
        const currentBlockTime = await time.latest();

        // 增加 1 天的时间（86400 秒）
        await time.increase(time.duration.days(1));

        // 获取新的区块时间
        const newBlockTime = await time.latest();

        console.log("Current block time before increase:", currentBlockTime.toString());
        console.log("New block time after increase:", newBlockTime.toString());

        let canVote = await proposal.canVote(latestProposal);
        // await web3.eth.sendTransaction({ from: taker1, to: deployer, value: "900000000000000000000" });

        if (!canVote) {
            console.log("before exe proposal !");
            await proposal.execProposal(latestProposal, {
                from: deployer
            });
            console.log("execProposal! ");
        }
        else {
            console.log("still can vote! ");
        }
        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        console.log("strategy length is : ", strategies[0].length);
        // // const stoneVault = await StoneVault.at("");
        let strategy1 = strategies[0][0];
        console.log("strategy1 is : ", strategies[0][0]);
        let strategy2 = strategies[0][1];
        console.log("strategy2 is : ", strategies[0][1]);
        let strategy3 = strategies[0][2];
        console.log("strategy3 is : ", strategies[0][2]);
        let strategy4 = strategies[0][3];
        console.log("strategy4 is : ", strategies[0][3]);
        let strategy5 = strategies[0][4];
        console.log("strategy5 is : ", strategies[0][4]);

        console.log("strategy1's portion is : ", strategies[1][0].toString(10));
        console.log("strategy2's portion is : ", strategies[1][1].toString(10));
        console.log("strategy3's portion is : ", strategies[1][2].toString(10));
        console.log("strategy4's portion is : ", strategies[1][3].toString(10));
        console.log("strategy5's portion is : ", strategies[1][4].toString(10));

        let assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        let assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("assetsVault0 ether amount:", assetsVaultBalance.toString());

        let eigenStrategyValue = await eigenStrategy.getAllValue.call();
        console.log("eigenStrategyValue ether amount:", BigNumber(eigenStrategyValue).toString(10));
        let mellowDepositWstETHStrategyValue = await mellowDepositWstETHStrategy.getAllValue.call();
        console.log("mellowDepositWstETHStrategy ether amount:", BigNumber(mellowDepositWstETHStrategyValue).toString(10));
        let getWstETHValue = await mellowDepositWstETHStrategy.getWstETHValue.call();
        console.log("getWstETHValue amount:", BigNumber(getWstETHValue).toString(10));

        let nativeLendingETHStrategyValue = await nativeLendingETHStrategy.getAllValue.call();
        console.log("nativeLendingETHStrategyValue ether amount:", BigNumber(nativeLendingETHStrategyValue).toString(10));
        let symbioticDepositWBETHStrategyValue = await symbioticDepositWBETHStrategy.getAllValue.call();
        console.log("symbioticDepositWBETHStrategyValue ether amount:", BigNumber(symbioticDepositWBETHStrategyValue).toString(10));
        let symbioticDepositWstETHStrategyValue = await symbioticDepositWstETHStrategy.getAllValue.call();
        console.log("symbioticDepositWstETHStrategyValue ether amount:", BigNumber(symbioticDepositWstETHStrategyValue).toString(10));

        await stoneVault.rollToNextRound();
        console.log("settlement finished!");

        assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("assetsVault1 ether amount:", assetsVaultBalance.toString());
        eigenStrategyValue = await eigenStrategy.getAllValue.call();
        console.log("eigenStrategyValue1 ether amount:", BigNumber(eigenStrategyValue).toString(10));
        mellowDepositWstETHStrategyValue = await mellowDepositWstETHStrategy.getAllValue.call();
        console.log("mellowDepositWstETHStrategy1 ether amount:", BigNumber(mellowDepositWstETHStrategyValue).toString(10));
        getWstETHValue = await mellowDepositWstETHStrategy.getWstETHValue.call();
        console.log("getWstETHValue1 amount:", BigNumber(getWstETHValue).toString(10));

        nativeLendingETHStrategyValue = await nativeLendingETHStrategy.getAllValue.call();
        console.log("nativeLendingETHStrategyValue1 ether amount:", BigNumber(nativeLendingETHStrategyValue).toString(10));
        symbioticDepositWBETHStrategyValue = await symbioticDepositWBETHStrategy.getAllValue.call();
        console.log("symbioticDepositWBETHStrategyValue1 ether amount:", BigNumber(symbioticDepositWBETHStrategyValue).toString(10));
        symbioticDepositWstETHStrategyValue = await symbioticDepositWstETHStrategy.getAllValue.call();
        console.log("symbioticDepositWstETHStrategyValue1 ether amount:", BigNumber(symbioticDepositWstETHStrategyValue).toString(10));

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