// truffle compile
// truffle exec scripts/3exePropse.js --network local
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312"
const Stone = artifacts.require("Stone");
const taker1 = "0x67E037C1f22B568A71661e5Bb799D9ddA6815CC3";

const { time } = require("@openzeppelin/test-helpers");
require("@openzeppelin/test-helpers/configure")({
    provider: "http://localhost:8545",
});

const Proposal = artifacts.require("Proposal");

const BalancerLPAuraStrategy = artifacts.require("BalancerLPAuraStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");
const RETHHoldingStrategy = artifacts.require("RETHHoldingStrategy");
const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const StrategyController = artifacts.require("StrategyController");
const Strategy = artifacts.require("Strategy");
const Abi = web3.eth.abi;
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const swappingAggregatorAddr = "0x15469528C11E8Ace863F3F9e5a8329216e33dD7d";
const SwappingAggregator = artifacts.require("SwappingAggregator");
module.exports = async function (callback) {
    try {
        const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(st);

        const strategyController = await StrategyController.at("0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2");
        const strategyControllerAddr = strategyController.address;
        console.log("strategyController addr is : ", strategyControllerAddr);

        const proposal = await Proposal.at("0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b");
        let stETHHoldingStrategyAddr = "0x363d200e54fe86985790f4e210df9bfb14234202";
        let sTETHHoldingStrategy = await STETHHoldingStrategy.at(stETHHoldingStrategyAddr);

        // let latestUpdateTime_ba1 = BigNumber(await sTETHHoldingStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba1 is :", latestUpdateTime_ba1.toString(10));
        await time.advanceBlock();

        proposals = await proposal.getProposals();
        // console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);
        let proposalDetail = await proposal.proposalDetails(latestProposal);
        console.log("deadline is : ", BigNumber(proposalDetail.deadline).toString(10));

        // latestUpdateTime_ba1 = BigNumber(await sTETHHoldingStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba1 is :", latestUpdateTime_ba1.toString(10));

        await time.advanceBlock();
        let canVote = await proposal.canVote(latestProposal);
        await web3.eth.sendTransaction({ from: taker1, to: deployer, value: "900000000000000000000" });

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