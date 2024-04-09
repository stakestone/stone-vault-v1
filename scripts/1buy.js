// truffle compile
// truffle exec scripts/1buy.js --network local
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312"
const Stone = artifacts.require("Stone");
const taker1 = "0xa2e2A52eDCF1CCcab411A0A95912157F061B9514";
const taker2 = "0x0B8a32840633d64c3DD5e13D46193ec28Ca5c55b";
const AssetsVault = artifacts.require("AssetsVault");
const { time } = require("@openzeppelin/test-helpers");
require("@openzeppelin/test-helpers/configure")({
    provider: "http://localhost:8545",
});
const BalancerLPAuraStrategy = artifacts.require("BalancerLPAuraStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");
const RETHHoldingStrategy = artifacts.require("RETHHoldingStrategy");
const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const StrategyController = artifacts.require("StrategyController");
const SwappingAggregator = artifacts.require("SwappingAggregator");
const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
// const Roll = artifacts.require("external/roll");

//要交易的token的pool设置成0地址，想只从curve交易就把uni的设置成0地址，想只从uni交易就用setCurveRouter把curvePool设置成0地址
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
        // await web3.eth.sendTransaction({ from: taker2, to: deployer, value: "900000000000000000000" });
        // console.log("start....");
        // await swappingAggregator.setUniRouter(
        //     stETHAddr,
        //     ZERO_ADDRESS,
        //     stETHSlippage,
        //     stETHFee, { from: deployer }
        // );
        // await swappingAggregator.setUniRouter(
        //     frxETHAddr,
        //     ZERO_ADDRESS,
        //     frxETHSlippage,
        //     frxETHFee, { from: deployer }
        // );

        const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(st);
        //check asset vault balance
        const assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        let assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("assetsVault ether amount:", assetsVaultBalance.toString());

        // await time.advanceBlock();
        // await stoneVault.setRebaseInterval(1, { from: deployer });
        // console.log("setRebaseInterval ok0....");
        let price = await stoneVault.currentSharePrice.call();
        console.log("current share price is : ", price.toString());
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker2
        });

        await stoneVault.deposit({
            value: BigNumber(40000e18),
            from: taker1
        });
        await stoneVault.deposit({
            value: BigNumber(50000e18),
            from: taker2
        });

        console.log("/////userStone");

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