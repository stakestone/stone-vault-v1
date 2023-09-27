// truffle compile
// truffle exec scripts/proposalsFlow.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Proposal = artifacts.require("Proposal");
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const taker1 = "0x725B030882405f909fe2D6ab378543c39FF2C5c7";
const deployer = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
const Abi = web3.eth.abi;

module.exports = async function (callback) {
    try {
        const strategyController = await StrategyController.at("0x30CAD1dAA1bD1A6f92AA62F259cf3D00a606605D");
        console.log("strategyController: ", strategyController.address);
        const proposal = await Proposal.at("0xD172e923F593e9175EE18924F17842b100F65575");

        const period = 1 * 60; //1min
        await proposal.setVotePeriod(period);

        const stETHHoldingStrategyAddr = "0x1Ba189CBA10Af7fBf28Fc991D3d5Cdd945C21A94";
        const rETHHoldingStrategyAddr = "0x4cc700Ed0C9D76A8F7c082e4f17b675152B067d9";
        const sFraxETHHoldingStrategyAddr = "0xd470bc940E3699e9F5fe942373ebfE51E637282D";
        const rETHBalancerAuraStrategy = "0xEe856F34175064A7469BbEB89ec3717bEE45316F";

        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[stETHHoldingStrategyAddr, rETHHoldingStrategyAddr, sFraxETHHoldingStrategyAddr, rETHBalancerAuraStrategy], [3e5, 2e5, 3e5, 2e5]]

        );
        const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3);
        const vault = "0x49f2e87401B909070eef6E647841C4211daE14Ee";
        const stoneVault = await StoneVault.at(vault);

        const st = "0x3ebdc890d8Fc00FfD2E22055A8d9114f33124FC4";
        const stone = await Stone.at(st);

        proposals = await proposal.getProposals();
        console.log("proposals1 are : ", proposals);

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);

        await stone.approve(proposal.address, BigNumber(100000).times(1e18), {
            from: deployer
        });
        console.log("start vote");
        await proposal.voteFor(latestProposal, BigNumber(1e14), true, {
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