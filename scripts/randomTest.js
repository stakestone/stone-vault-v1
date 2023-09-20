// truffle compile
// truffle exec scripts/randomTest.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Proposal = artifacts.require("Proposal");
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const taker1 = "0x725B030882405f909fe2D6ab378543c39FF2C5c7";
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
const Abi = web3.eth.abi;
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const RETHHoldingStrategy = artifacts.require("RETHHoldingStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");
const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");
const stETHHoldingStrategyAddr = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
const rETHHoldingStrategyAddr = "0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef";
const sFraxETHHoldingStrategyAddr = "0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853";
const rETHBalancerAuraStrategy = "0xf60b394638Ecbc2020Ac3E296E04Fd955A3eB460";
async function myfunction(st_buyOnDex, st_sellOnDex, r_buyOnDex, r_sellOnDex, sF_buyOnDex, sF_sellOnDex) {
    const stETHHoldingStrategy = await STETHHoldingStrategy.at(stETHHoldingStrategyAddr);
    // const gover = await stETHHoldingStrategy.governance();
    console.log(".......st: ");
    await stETHHoldingStrategy.setRouter(st_buyOnDex, st_sellOnDex);
    console.log(".......st");
    const rETHHoldingStrategy = await RETHHoldingStrategy.at(rETHHoldingStrategyAddr);
    //r_sellOnDex should always be false
    console.log(".......st");
    await rETHHoldingStrategy.setRouter(r_buyOnDex, r_sellOnDex);
    console.log(".......st");
    const sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.at(sFraxETHHoldingStrategyAddr);
    await sFraxETHHoldingStrategy.setRouter(sF_buyOnDex, sF_sellOnDex);

    let st_buyOnDex_ = await stETHHoldingStrategy.buyOnDex();
    let st_sellOnDex_ = await stETHHoldingStrategy.sellOnDex();
    let r_buyOnDex_ = await rETHHoldingStrategy.buyOnDex();
    let r_sellOnDex_ = await rETHHoldingStrategy.sellOnDex();

    let sF_buyOnDex_ = await sFraxETHHoldingStrategy.buyOnDex();
    let sF_sellOnDex_ = await sFraxETHHoldingStrategy.sellOnDex();

    console.log("st_buyOnDex is : ", st_buyOnDex_.toString(10));
    console.log("st_sellOnDex is : ", st_sellOnDex_.toString(10));

    console.log("r_buyOnDex is : ", r_buyOnDex_.toString(10));
    console.log("r_sellOnDex is : ", r_sellOnDex_.toString(10));

    console.log("sF_buyOnDex is : ", sF_buyOnDex_.toString(10));
    console.log("sF_sellOnDex is : ", sF_sellOnDex_.toString(10));


    const proposal = await Proposal.at("0xD081BE7f329e13c4097cFa3668f1E690Cde9c08d");

    const period = 1 * 60; //1min
    await proposal.setVotePeriod(period);

    const fn2 = "updatePortfolioConfig(address[],uint256[])";
    const selector2 = Abi.encodeFunctionSignature(fn2);
    for (const stETHRatio of [0, 2e5, 5e5, 10e5])
        for (const rETHRatio of [0, 3e5, 5e5, 10e5])
            for (const SFraxETHRatio of [0, 2e5, 5e5, 10e5])
                for (const rETHBalancerAuraRatio of [0, 3e5, 5e5, 10e5]) {
                    if ((stETHRatio + rETHRatio + SFraxETHRatio + rETHBalancerAuraRatio) > 10e5) {
                        continue;
                    }

                    const encodedParams3 = Abi.encodeParameters(
                        ["address[]", "uint256[]"],
                        [[rETHHoldingStrategyAddr, stETHHoldingStrategyAddr, rETHBalancerAuraStrategy, sFraxETHHoldingStrategyAddr], [rETHRatio, stETHRatio, rETHBalancerAuraRatio, SFraxETHRatio]]

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
                        // strategy portion
                        const strategyController = await StrategyController.at("0x52Df50Fb1de14c3D2b239eE59e3997b946934443");
                        strategies = await strategyController.getStrategies();
                        console.log("strategies are : ", strategies);
                        console.log("strategy length is : ", strategies[0].length);
                        // const stoneVault = await StoneVault.at("");
                        let strategy1 = strategies[0][0];
                        console.log("strategy1 is : ", strategies[0][0]);
                        let strategy2 = strategies[0][1];
                        console.log("strategy2 is : ", strategies[0][1]);
                        let strategy3 = strategies[0][2];
                        console.log("strategy3 is : ", strategies[0][2]);
                        let strategy4 = strategies[0][3];
                        console.log("strategy4 is : ", strategies[0][3]);

                        console.log("strategy1's portion is : ", strategies[1][0].toString(10));
                        console.log("strategy2's portion is : ", strategies[1][1].toString(10));
                        console.log("strategy3's portion is : ", strategies[1][2].toString(10));
                        console.log("strategy4's portion is : ", strategies[1][3].toString(10));

                        // user deposit
                        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
                            from: deployer
                        });
                        await stoneVault.deposit({
                            value: BigNumber(11e17),
                            from: deployer
                        });
                        console.log("deposit finished!");
                    }
                    else {
                        console.log("still can vote! ");
                    }
                }
}

module.exports = async function (callback) {
    try {
        for (const st_buyOnDex of [0])
            for (const st_sellOnDex of [0])
                for (const r_buyOnDex of [1])
                    for (const r_sellOnDex of [0, 1])
                        for (const sF_buyOnDex of [0, 1])
                            for (const sF_sellOnDex of [0, 1]) {
                                await myfunction(st_buyOnDex, st_sellOnDex, r_buyOnDex, r_sellOnDex, sF_buyOnDex, sF_sellOnDex);
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