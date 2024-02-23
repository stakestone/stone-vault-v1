// truffle compile
// truffle exec scripts/testRadom.js --network local
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312"
const Stone = artifacts.require("Stone");
const user1 = "0x3A3e47A28e53978bEa59830FAD6A0eb2Fc371091";
const taker1 = "0x9615508350341F9DC86CcDd610f40a3971b46965";
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
const Roll = artifacts.require("external/roll");

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
        await stoneVault.setRebaseInterval(1, { from: deployer });
        await sleep(1);
        const st = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(st);
        //check asset vault balance
        const assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        let latestRoundID = BigNumber(await stoneVault.latestRoundID());
        console.log("latestRoundID is : ", latestRoundID.toString(10));

        userStone = BigNumber(await stone.balanceOf(user1));
        console.log("userStone1 is : ", userStone.toString(10));

        // await time.advanceBlock();

        let price = await stoneVault.currentSharePrice.call();
        console.log("current share price is : ", price.toString());
        await web3.eth.sendTransaction({ from: taker1, to: user1, value: "900000000000000000000" });
        await web3.eth.sendTransaction({ from: taker1, to: deployer, value: "900000000000000000000" });

        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: user1
        });
        await stone.approve(stoneVault.address, BigNumber(10000).times(1e18), {
            from: taker1
        });

        // let rETHBalancerAuraStrategy = await RETHBalancerAuraStrategy.at("0x856EdF1B835ea02Bf11B16F041DF5A13Ef1EC3d1");
        // let value = BigNumber(await rETHBalancerAuraStrategy.getInvestedValue.call());
        // let allValue = BigNumber(await rETHBalancerAuraStrategy.getAllValue.call());
        // console.log("value of rETHBalancerAura is : ", value.toString(10));
        // console.log("allValue of rETHBalancerAura is : ", allValue.toString(10));
        // let sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.at("0xa66723D951F15423Ef2C9C11edcb821E38301836");
        // let value1 = BigNumber(await sFraxETHHoldingStrategy.getInvestedValue.call());
        // let allValue1 = BigNumber(await sFraxETHHoldingStrategy.getAllValue.call());
        // console.log("value1 of SFrax is : ", value1.toString(10));
        // console.log("allValue1 of SFrax is : ", allValue1.toString(10));

        // let sTETHHoldingStrategy = await STETHHoldingStrategy.at("0x363D200E54FE86985790f4E210dF9BfB14234202");
        // let value2 = BigNumber(await sTETHHoldingStrategy.getInvestedValue.call());
        // let PendingValue = BigNumber(await sTETHHoldingStrategy.getPendingValue.call());
        // let allValue2 = BigNumber(await sTETHHoldingStrategy.getAllValue.call());
        // console.log("value2  of sTETH is : ", value2.toString(10));
        // console.log("PendingValue  of sTETH is : ", PendingValue.toString(10));
        // console.log("allValue2  of sTETH is : ", allValue2.toString(10));

        const sTETHHoldingStrategy_new = await STETHHoldingStrategy.at("0xE942cDd0AF66aB9AB06515701fa3707Ec7deB93e");
        let value3 = BigNumber(await sTETHHoldingStrategy_new.getInvestedValue.call());
        let allValue3 = BigNumber(await sTETHHoldingStrategy_new.getAllValue.call());
        console.log("value3 of new stETH is : ", value3.toString(10));
        console.log("allValue3  of sTETH is : ", allValue3.toString(10));

        // await time.advanceBlock();

        await swappingAggregator.setSlippage(stETHAddr, 990000, { from: deployer });
        await swappingAggregator.setSlippage(frxETHAddr, 990000, { from: deployer });
        let assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("assetsVault 0 ether amount:", assetsVaultBalance.toString());

        user1Stone = BigNumber(await stone.balanceOf(user1));
        console.log("user1Stone before withdraw is : ", user1Stone.toString(10));
        await stoneVault.requestWithdraw(BigNumber(1e14), {
            from: user1
        });
        console.log("user withdraw!");
        // await sleep(10);

        let user1Balance = BigNumber(await web3.eth.getBalance(user1));
        console.log("user1Balance ether amount be instant withdraw:", user1Balance.toString());
        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault 1 ether amount:", assetsVaultBalance.toString());

        await time.advanceBlock();
        const result = await stoneVault.rollToNextRound();
        console.log("settlement finished!");
        // await stoneVault.instantWithdraw(0, BigNumber(1e15), {
        //     from: user1
        // });
        // console.log("user1 instant withdraw");

        user1Stone = BigNumber(await stone.balanceOf(user1));
        console.log("user1Stone after withdraw is : ", user1Stone.toString(10));
        let user1Balance1 = BigNumber(await web3.eth.getBalance(user1));
        console.log("user1Balance1 ether amount after instant withdraw:", user1Balance1.toString());
        assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("assetsVault 2 ether amount:", assetsVaultBalance.toString());
        let gas = BigNumber(user1Balance.minus(user1Balance1));
        console.log("gas is : ", gas.toString(10));

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