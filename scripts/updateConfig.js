// truffle compile
// truffle exec scripts/updateConfig.js --network test
// eslint-disable-next-line no-undef

const MockNullStrategy = artifacts.require("MockNullStrategy");
const StrategyController = artifacts.require("StrategyController");
const Proposal = artifacts.require("Proposal");
const Abi = web3.eth.abi;
module.exports = async function (callback) {
    try {

        const strategyController = await StrategyController.at("0x52Df50Fb1de14c3D2b239eE59e3997b946934443");
        console.log("strategyController: ", strategyController.address);
        const proposal = await Proposal.at("0xD081BE7f329e13c4097cFa3668f1E690Cde9c08d");

        const period = 2 * 60; //1min
        await proposal.setVotePeriod(period);

        const stETHHoldingStrategyAddr = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
        const rETHHoldingStrategyAddr = "0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef";
        const sFraxETHHoldingStrategyAddr = "0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853";
        const rETHBalancerAuraStrategy = "0xf60b394638Ecbc2020Ac3E296E04Fd955A3eB460";//deposit rETH+wETH
        // const mockNullStrategyL = await MockNullStrategy.new(strategyController.address, "Mock Strategy L");
        // console.log("mockNullStrategyL: ", mockNullStrategyL.address);

        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[stETHHoldingStrategyAddr, sFraxETHHoldingStrategyAddr, rETHBalancerAuraStrategy], [1e5, 4e5, 2e5]]

        );
        const data3 = `${selector2}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3);

        proposals = await proposal.getProposals();
        console.log("proposals1 are : ", proposals);

        callback();
    } catch (e) {
        callback(e);
    }

}