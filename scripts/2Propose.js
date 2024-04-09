// truffle compile
// truffle exec scripts/2Propose.js --network local
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const Stone = artifacts.require("Stone");
const taker1 = "0xFf8C215A2F85E0056c0FE2B57Fb10EdBe63Ccef8";
const taker2 = "0x3d86e40E12c1f962A26ADfAAE3fA19963787fbbb";
const user1 = "0x3A3e47A28e53978bEa59830FAD6A0eb2Fc371091";
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
const minVotePeriod = 24 * 60 * 60;
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const swappingAggregatorAddr = "0x15469528C11E8Ace863F3F9e5a8329216e33dD7d";
const SwappingAggregator = artifacts.require("SwappingAggregator");
module.exports = async function (callback) {
    try {
        const swappingAggregatorAddr = "0x15469528C11E8Ace863F3F9e5a8329216e33dD7d";
        const swappingAggregator = await SwappingAggregator.at(swappingAggregatorAddr);
        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
        const stETHSlippage = 500000;
        const stETHFee = 10000;

        const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        const rETHCurvePool = "0x0f3159811670c117c372428d4e69ac32325e4d0f";
        const rETHSlippage = 500000;
        const rETHFee = 500;

        const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
        const frxETHCurvePool = "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577";
        const frxETHSlippage = 500000;
        const frxETHFee = 500;
        const sfraxETHAddr = "0xac3E018457B222d93114458476f3E3416Abbe38F";
        await web3.eth.sendTransaction({ from: taker1, to: deployer, value: "90000000000000000000" });
        console.log("start....");
        const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(st);

        const strategyController = await StrategyController.at("0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2");
        const strategyControllerAddr = strategyController.address;
        console.log("strategyController addr is : ", strategyControllerAddr);

        const proposal = await Proposal.at("0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b");
        // let proposer = await proposal.proposer();
        // console.log("proposer is : ", proposer.toString(10));
        // let votePeriod = BigNumber(await proposal.votePeriod());
        // console.log("votePeriod is : ", votePeriod.toString(10));
        // await web3.eth.sendTransaction({ from: taker1, to: deployer, value: "900000000000000000000" });

        // await proposal.setVotePeriod(minVotePeriod, { from: deployer });

        // let stETHHoldingStrategyAddr = "0xE942cDd0AF66aB9AB06515701fa3707Ec7deB93e";
        // let sTETHHoldingStrategy = await STETHHoldingStrategy.at(strategyControllerAddr);

        // let sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.new(strategyControllerAddr, swappingAggregatorAddr, "SFraxETHHoldingStrategy");
        // let sFraxETHHoldingStrategyAddr = sFraxETHHoldingStrategy.address
        // console.log("sFraxETHHoldingStrategyAddr addr is : ", sFraxETHHoldingStrategyAddr);

        // const fn2 = "updatePortfolioConfig(address[],uint256[])";
        // const selector2 = Abi.encodeFunctionSignature(fn2);
        // const encodedParams2 = Abi.encodeParameters(
        //     ["address[]", "uint256[]"],
        //     [[stETHHoldingStrategyAddr, sFraxETHHoldingStrategyAddr], [4e5, 6e5]]
        // );
        // const data2 = `${selector2}${encodedParams2.split("0x")[1]}`
        // console.log("data2: ", data2);
        // await proposal.propose(data2, { from: deployer });

        proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals.toString(10));

        let latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);
        await time.advanceBlock();

        await web3.eth.sendTransaction({ from: taker1, to: user1, value: "900000000000000000000" });

        await stone.approve(proposal.address, BigNumber(1000).times(1e18), {
            from: user1
        });
        await time.advanceBlock();

        console.log("start vote");
        await proposal.voteFor(latestProposal, BigNumber(1e13), true, {
            from: user1
        })
        await time.advanceBlock();

        await sleep(5);
        console.log("can vote?");
        let canVote = await proposal.canVote(latestProposal);
        console.log("canVote or not : ", canVote);
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