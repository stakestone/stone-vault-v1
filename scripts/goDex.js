// truffle compile
// truffle exec scripts/goDex.js --network test
// eslint-disable-next-line no-undef

const { default: BigNumber } = require("bignumber.js");

const StrategyController = artifacts.require("StrategyController");
const SwappingAggregator = artifacts.require("SwappingAggregator");


module.exports = async function (callback) {
    try {

        const swappingAggregator = await SwappingAggregator.at("0x9bB2a4B892A1c3C7E111050916B122646E9F2533");

        const stETHHoldingStrategyAddr = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
        const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        const sFraxETHHoldingStrategyAddr = "0xc6f830BB162e6CFb7b4Bac242B0E43cF1984c853";
        console.log("---buy on Uni----")
        let swapOnUniv3 = await swappingAggregator.swapOnUniV3.call(rETHAddr, BigNumber(1e18).toString(10), false,
            {
                value: BigNumber(1e18).toString(10)
            })
        console.log("swapOnUniv3", BigNumber(swapOnUniv3).div(1e18).toString(10));
        // console.log("---sell on Uni----")
        // swapOnUniv3 = await swappingAggregator.swapOnUniV3.call(rETHHoldingStrategyAddr, BigNumber(1e18).toString(10), true,
        //     {
        //         value: BigNumber(1e18).toString(10)
        //     })
        // console.log("swapOnUniv3", BigNumber(swapOnUniv3).div(1e18).toString(10));


        // console.log("---buy on Curve----")
        // let swapOnCurve = await swappingAggregator.swapOnCurve.call(rETHHoldingStrategyAddr, BigNumber(1e18).toString(10), false)
        // console.log("swapOnCurve", BigNumber(swapOnCurve).div(1e18).toString(10));
        // console.log("---sell on OnCurve----")
        // swapOnCurve = await swappingAggregator.swapOnCurve.call(rETHHoldingStrategyAddr, BigNumber(1e18).toString(10), true)
        // console.log("swapOnCurve", BigNumber(swapOnCurve).div(1e18).toString(10));

        callback();
    } catch (e) {
        callback(e);
    }

}