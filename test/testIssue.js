// truffle compile
// truffle exec scripts/testIssue.js --network local
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xB1F3f7Dcf485b27BCE137e5a265A29cbB16dc575"
const Stone = artifacts.require("Stone");
const taker2 = "0x1C22858f56EC41088A87BE5471e3F462496253Bc";
const taker3 = "0xF893f3a904B0e184fE9dAe4953458e61586c5df0";
const taker4 = "0xd8Ad70703Aa1c909554d80be3c2C9B8355f788a9";

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
const minVotePeriod = 1 * 60 * 60;
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const swappingAggregatorAddr = "";
const SwappingAggregator = artifacts.require("SwappingAggregator");
module.exports = async function (callback) {
    try {
        const vault = "0x4DBF2259858CB83e59AB4cFF7980Dc30017901DE";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x0F0f8f8480C1A569F89f7D01266Ce6BCbdB9f4b7";
        const stone = await Stone.at(st);
        console.log("s...");
        // let supply = BigNumber(await stone.totalSupply());
        // console.log("supply...", supply.toString(10));
        // let quota = BigNumber(await stone.getQuota());
        // console.log("quota...", quota.toString(10));
        // await web3.eth.sendTransaction({ from: taker4, to: taker2, value: "100000000000000000000" });
        // console.log("s1...");
        // await stone.approve(stoneVault.address, BigNumber(1000).times(1e18), {
        //     from: taker2
        // });
        // await web3.eth.sendTransaction({ from: taker4, to: deployer, value: "10000000000000000000" });
        // console.log("s2...");
        const strategyController = await StrategyController.at("0x25Fc8d2752D793B596E5d3D4e39D404B700Ff8eb");
        const strategyControllerAddr = strategyController.address;
        console.log("strategyController addr is : ", strategyControllerAddr);

        const proposal = await Proposal.at("0x15A5060297c6A3C2EF43fcf0ff227d7D2F258100");
        let proposer = await proposal.proposer();
        console.log("proposer is : ", proposer.toString(10));
        let votePeriod = BigNumber(await proposal.votePeriod());
        console.log("votePeriod is : ", votePeriod.toString(10));

        await proposal.setVotePeriod(minVotePeriod, { from: deployer });

        // const balancerLPAuraStrategy = await BalancerLPAuraStrategy.new(strategyControllerAddr, swappingAggregatorAddr, "BalancerLPAuraStrategy");
        // let balancerLPAuraStrategyAddr = balancerLPAuraStrategy.address;
        // console.log("balancerLPAuraStrategy addr is : ", balancerLPAuraStrategyAddr);
        // const rETHBalancerAuraStrategy = await RETHBalancerAuraStrategy.new(strategyControllerAddr, swappingAggregatorAddr, "RETHBalancerAuraStrategy");
        // let rETHBalancerAuraStrategyAddr = rETHBalancerAuraStrategy.address;
        // console.log("rETHBalancerAuraStrategy addr is : ", rETHBalancerAuraStrategyAddr);
        // const rETHHoldingStrategy = await RETHHoldingStrategy.new(strategyControllerAddr, swappingAggregatorAddr, "RETHHoldingStrategy");
        // let rETHHoldingStrategyAddr = rETHHoldingStrategy.address;
        // console.log("rETHHoldingStrategy addr is : ", rETHHoldingStrategyAddr);
        // const sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.new(strategyControllerAddr, swappingAggregatorAddr, "SFraxETHHoldingStrategy");
        // let sFraxETHHoldingStrategyAddr = sFraxETHHoldingStrategy.address;
        // console.log("sFraxETHHoldingStrategy addr is : ", sFraxETHHoldingStrategyAddr);
        // const sTETHHoldingStrategy = await STETHHoldingStrategy.new(strategyControllerAddr, "STETHHoldingStrategy", stETHAddr, lidoWithdrawalQueueAddr, swappingAggregatorAddr);
        // let stETHHoldingStrategyAddr = sTETHHoldingStrategy.address
        // console.log("sTETHHoldingStrategy addr is : ", stETHHoldingStrategyAddr);
        let rETHBalancerAuraStrategyAddr = "0x160b7a183E7D07e9467B876fb6A569EC3574d8F9";
        let rETHHoldingStrategyAddr = "0x95b6c53e09EFFCbC26AB4805Fa426f7F32c52838";
        let sFraxETHHoldingStrategyAddr = "0x0aF426d103823C314ab41A24Fcfbce52E8234E9e";
        let stETHHoldingStrategyAddr = "0x74e47ee2527089c26A670A2c968f9719EFA6F593";

        // const fn2 = "updatePortfolioConfig(address[],uint256[])";
        // const selector2 = Abi.encodeFunctionSignature(fn2);
        // const encodedParams2 = Abi.encodeParameters(
        //     ["address[]", "uint256[]"],
        //     [[stETHHoldingStrategyAddr, rETHHoldingStrategyAddr, sFraxETHHoldingStrategyAddr, rETHBalancerAuraStrategyAddr], [0, 0, 10e5, 0]]
        // );
        // const data2 = `${selector2}${encodedParams2.split("0x")[1]}`
        // console.log("data2: ", data2);
        // await proposal.propose(data2, { from: deployer });

        proposals = await proposal.getProposals();
        // console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);

        // await stone.transfer(deployer, BigNumber(1e14), {
        //     from: taker2
        // });
        // await stone.approve(proposal.address, BigNumber(1000).times(1e18), {
        //     from: deployer
        // });
        // console.log("start vote");
        // await proposal.voteFor(latestProposal, BigNumber(1e14), true, {
        //     from: deployer
        // })
        // await sleep(5);
        console.log("can vote?");
        let canVote = await proposal.canVote(latestProposal);
        console.log("canVote or not : ", canVote);

        // let bal = BigNumber(await stone.balanceOf(deployer));
        // console.log("before balance is : ", bal.toString(10));
        // if (!canVote) {
        //     console.log("before exe proposal !");
        //     await proposal.execProposal(latestProposal, {
        //         from: deployer
        //     });
        //     console.log("execProposal! ");

        //     const result = await stoneVault.rollToNextRound();
        //     console.log("settlement finished!");
        //     console.log("rollToNext transaction : ", result);
        // }
        // else {
        //     console.log("still can vote! ");
        // }
        // /////
        // await stoneVault.setRebaseInterval(1);
        // console.log("setRebaseInterval ok0....");
        // await stoneVault.instantWithdraw(0, BigNumber(1e16), {
        //     from: taker2
        // });
        // let allValue = BigNumber(await strategyController.getAllStrategiesValue.call());
        // let allValidValue = BigNumber(await strategyController.getAllStrategyValidValue.call());
        // console.log("allValue is : ", allValue.toString(10));
        // console.log("allValidValue is : ", allValidValue.toString(10));

        // let rETHBalancerAuraStrategy = await RETHBalancerAuraStrategy.at("0x7BF7BCc6f4B2dfA02fD2acED1175284Cc1212cf0");
        // let rETHBalancerAuraStrategy_old = await RETHBalancerAuraStrategy.at("0x856edf1b835ea02bf11b16f041df5a13ef1ec3d1");
        // await rETHBalancerAuraStrategy.setSlippage(995000);

        // let value_ra = BigNumber(await rETHBalancerAuraStrategy.getAllValue.call());
        // console.log("value_ra is : ", value_ra.toString(10));
        // let latestUpdateTime_ba = BigNumber(await rETHBalancerAuraStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba is :", latestUpdateTime_ba.toString(10));

        // let buf = BigNumber(await rETHBalancerAuraStrategy.bufferTime());
        // console.log("buf time is :", buf.toString(10));
        // await rETHBalancerAuraStrategy_old.setSlippage(995000, { from: deployer });
        // console.log("ok1....");
        // const rETHHoldingStrategy = await RETHHoldingStrategy.at("0x12B638B1422b14168b1139Df93CbF7141c516B97");
        // let value_rt = BigNumber(await rETHHoldingStrategy.getAllValue.call());
        // console.log("value_rt is : ", value_rt.toString(10));
        // const sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.at("0xAE6176a194786Abe1e04eEddB3D0112499eD2D40");
        // let value_sf = BigNumber(await sFraxETHHoldingStrategy.getAllValue.call());
        // console.log("value_sf is : ", value_sf.toString(10));
        // const sTETHHoldingStrategy = await STETHHoldingStrategy.at("0x85293f675e6C8cDa5aA0c9B987BCB2DF27E855Ad");
        // let value_st = BigNumber(await sTETHHoldingStrategy.getAllValue.call());
        // console.log("value_st is : ", value_st.toString(10));
        // // const rETHHoldingStrategy_old = await RETHHoldingStrategy.at("0x9221fbe66be06f43dcbda3fc17cdd66ef1b236f9");
        // let latestUpdateTime_r = BigNumber(await rETHBalancerAuraStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_r is :", latestUpdateTime_r.toString(10));

        // await rETHHoldingStrategy.setRouter(1, 1);
        // await rETHHoldingStrategy_old.setRouter(1, 1);
        // //  几个staking pool的lsd资产是可以选择走dex路由，curve或者uniswap v2/v3
        // const swappingAggregator = await SwappingAggregator.at("0x5Acc26a5D43BD7235000f0FDC6c8C3d6Dc6ba172");
        // const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        // await swappingAggregator.setSlippage(rETHAddr, 190000);
        // console.log(".......rETH");
        // const result = await stoneVault.rollToNextRound();
        // console.log("settlement finished!");
        // let price = await stoneVault.currentSharePrice.call();

        // console.log("current share price is : ", price.toString());
        // await time.advanceBlock();

        // await stoneVault.instantWithdraw(0, BigNumber(1e16), {
        //     from: taker2
        // });
        // console.log("instantWithdraw1!");
        // await time.advanceBlock();

        // await stoneVault.deposit({
        //     value: BigNumber(10e18),
        //     from: taker2
        // });
        // console.log(".... deposit");
        // await time.advanceBlock();
        // let block = BigNumber(await web3.eth.getBlockNumber());
        // console.log("block is : ", block.toString(10));
        // // // await sleep(500);
        // await stoneVault.rollToNextRound();

        // await time.advanceBlock();
        // block = BigNumber(await web3.eth.getBlockNumber());
        // console.log("block is : ", block.toString(10));

        // await stoneVault.instantWithdraw(0, BigNumber(1e16), {
        //     from: taker2
        // });
        // console.log("instantWithdraw1!");
        // let block1 = BigNumber(await web3.eth.getBlockNumber());
        // console.log("block1 is : ", block1.toString(10));

        // // let latestUpdateTime_ba0 = BigNumber(await rETHBalancerAuraStrategy.latestUpdateTime());
        // // console.log("latestUpdateTime_ba0 is :", latestUpdateTime_ba0.toString(10));
        // await time.advanceBlock();
        // await stoneVault.instantWithdraw(0, BigNumber(1e18), {
        //     from: taker2
        // });
        // console.log("instantWithdraw2!");
        // let latestUpdateTime_ba2 = BigNumber(await rETHBalancerAuraStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba2 is :", latestUpdateTime_ba2.toString(10));



        // await sleep(1);
        // // // ////////
        // await stoneVault.rollToNextRound();
        // let latestUpdateTime_ba1 = BigNumber(await rETHBalancerAuraStrategy.latestUpdateTime());
        // console.log("latestUpdateTime_ba1 is :", latestUpdateTime_ba1.toString(10));

        // console.log("settlement finished1!");
        // await sleep(1);
        // await stoneVault.requestWithdraw(BigNumber(1e18), {
        //     from: taker2
        // });
        // console.log("requestWithdraw!");


        // await stoneVault.instantWithdraw(0, BigNumber(1e18), {
        //     from: taker2
        // });
        // console.log("instantWithdraw2!");

        // await stoneVault.instantWithdraw(0, BigNumber(7e17), {
        //     from: taker2
        // });
        // console.log("instantWithdraw finished!");

        // await sleep(1);
        // await time.advanceBlock();
        // await stoneVault.rollToNextRound();
        // console.log("settlement finished2!");
        // await time.advanceBlock();

        // await stoneVault.instantWithdraw(0, BigNumber(1e18), {
        //     from: taker2
        // });
        // console.log("instantWithdraw2!");

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