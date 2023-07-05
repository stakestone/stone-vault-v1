// truffle exec scripts/deployment.js --network goerli
// eslint-disable-next-line no-undef

const MockNullStrategy = artifacts.require("MockNullStrategy");
const StrategyController = artifacts.require("StrategyController");
const Proposal = artifacts.require("Proposal");
const Abi = web3.eth.abi;
module.exports = async function (callback) {
    try {

        // const strategyController = await StrategyController.at("0xe4297F86ab71484c3BeBe5DeDaD6e48FB36e9aeb");
        // console.log("strategyController: ", strategyController.address);
        const proposal = await Proposal.at("0x3149e58f500ae2d23a037bc510387b565744a7dc");

        await proposal.execProposal("0xa0330BF9F8cE1b0D571e2b16fd34349629e5D8fa");
        // const period = 5 * 60;
        // await proposal.setVotePeriod(period);

        // // // const mockNullStrategyE = await MockNullStrategy.new(strategyController.address, "Mock Strategy E",
        // // //     { nonce: 452 });
        // const mockNullStrategyI = await MockNullStrategy.new(strategyController.address, "Mock Strategy I");
        // console.log("mockNullStrategyI: ", mockNullStrategyI.address);

        // const mockNullStrategyJ = await MockNullStrategy.new(strategyController.address, "Mock Strategy J");
        // console.log("mockNullStrategyJ: ", mockNullStrategyJ.address);

        // // const fn1 = "addStrategy(address)";
        // // const selector1 = Abi.encodeFunctionSignature(fn1);
        // // const encodedParams1 = Abi.encodeParameters(["address"], [mockNullStrategyE.address]);
        // // const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
        // // const encodedParams2 = Abi.encodeParameters(["address"], [mockNullStrategyF.address]);
        // // const data2 = `${selector1}${encodedParams2.split("0x")[1]}`

        // // await proposal.propose(data1);
        // // await proposal.propose(data2);

        // let proposals = await proposal.getProposals();
        // console.log("proposals are : ", proposals);

        // const fn2 = "updatePortfolioConfig(address[],uint256[])";
        // const selector2 = Abi.encodeFunctionSignature(fn2);
        // const encodedParams3 = Abi.encodeParameters(
        //     ["address[]", "uint256[]"],
        //     [[mockNullStrategyI.address, mockNullStrategyJ.address], [3e5, 7e5]]
        // );
        // const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        // console.log("data3: ", data3);

        // await proposal.propose(data3);

        // proposals = await proposal.getProposals();
        // console.log("proposals1 are : ", proposals);

        // // let strategies = await strategyController.getStrategies();
        // // console.log("length is : ", strategies[0].length);

        // // for (i = 0; i < strategies[0].length; i++) {
        // //     console.log("strategy" + i + " is : ", strategies[0][i]);
        // // }

        callback();
    } catch (e) {
        callback(e);
    }

}