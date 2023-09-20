// truffle compile
// truffle exec scripts/proposalsFlow.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Proposal = artifacts.require("Proposal");
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const taker1 = "0x725B030882405f909fe2D6ab378543c39FF2C5c7";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
const Abi = web3.eth.abi;

module.exports = async function (callback) {
    try {
        const strategyController = await StrategyController.at("0x52Df50Fb1de14c3D2b239eE59e3997b946934443");
        console.log("strategyController: ", strategyController.address);
        const proposal = await Proposal.at("0xD081BE7f329e13c4097cFa3668f1E690Cde9c08d");

        const period = 1 * 60; //1min
        await proposal.setVotePeriod(period);

        const stETHHoldingStrategyAddr = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
        const rETHHoldingStrategyAddr = "0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef";
        const sFraxETHHoldingStrategyAddr = "0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853";
        const rETHBalancerAuraStrategy = "0xf60b394638Ecbc2020Ac3E296E04Fd955A3eB460";

        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[stETHHoldingStrategyAddr, rETHBalancerAuraStrategy, sFraxETHHoldingStrategyAddr], [3e5, 2e5, 3e5]]

        );
        const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3);
        const vault = "0xD682C2b9814FB096c843984Da9810916CB2206e0";
        const stoneVault = await StoneVault.at(vault);

        const st = "0x9964C9a0F5c0Fd5E86Cf2d86765E0ae1eeCa680D";
        const stone = await Stone.at(st);

        proposals = await proposal.getProposals();
        console.log("proposals1 are : ", proposals);

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);

        await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
            from: deployer
        });
        console.log("start vote");
        await proposal.voteFor(latestProposal, BigNumber(1e16), true, {
            from: deployer
        })
        await sleep(60);
        console.log("can vote?");
        let canVote = await proposal.canVote(latestProposal);
        console.log("canVote or not : ", canVote);

        let bal = BigNumber(await stone.balanceOf(deployer));
        console.log("before balance is : ", bal.toString(10));
        if (!canVote) {

            await proposal.retrieveTokenFor(latestProposal, {
                from: deployer
            });
            bal = BigNumber(await stone.balanceOf(deployer));
            console.log("after balance is : ", bal.toString(10));
            await proposal.execProposal(latestProposal, {
                from: deployer
            });
            console.log("execProposal! ");

            const result = await stoneVault.rollToNextRound();
            console.log("settlement finished!");
            console.log("rollToNext transaction : ", result);

        }
        else {
            console.log("still can vote! ");
        }

        callback();
    } catch (e) {
        callback(e);
    }
}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });

}