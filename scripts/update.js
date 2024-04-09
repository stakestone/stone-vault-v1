const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');

const Abi = web3.eth.abi;

const Proposal = artifacts.require("Proposal");
const StoneVault = artifacts.require("StoneVault");
const Stone = artifacts.require("Stone");
const ERC20 = artifacts.require("ERC20");
const Strategy = artifacts.require("Strategy");
const SwappingAggregator = artifacts.require("SwappingAggregator");
const StrategyController = artifacts.require("StrategyController");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");
const Roll = artifacts.require("Roll");


const config = require("./mainnet.json");


module.exports = async function (callback) {
    try {
        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
        const balAddr = "0xba100000625a3754423978a60c9317c58a424e3D";
        const auraAddr = "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF";

        const proposal = await Proposal.at(config.proposalAddr);
        const strategyController = await StrategyController.at(config.strategyControllerAddr);
        const vault = await StoneVault.at(config.stoneVaultAddr);
        const swapping = await SwappingAggregator.at(config.swappingAggregatorAddr);

        const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";

        const proposalID = "0xE7E6b20C96514c9bA720AdD0ffcC38eD85e388C7";

        // step -1: nothing
        await vault.currentSharePrice.call();
        await strategyController.getStrategies.call();
        await proposal.execProposal.call(proposalID);
        await swapping.slippage.call(stETHAddr);
        await vault.rollToNextRound.call();

        // step 0: check portfolio
        let strategies = await strategyController.getStrategies();
        console.log("Before exec...");
        for (var i = 0; i < strategies.addrs.length; i++) {
            console.log(`${strategies.addrs[i]} is: ${strategies.portions[i].toNumber()}`);
        }

        // step 1: exec proposal
        await proposal.execProposal(proposalID);

        // step 2: check portfolio
        strategies = await strategyController.getStrategies();
        console.log("After exec...");
        for (var i = 0; i < strategies.addrs.length; i++) {
            console.log(`${strategies.addrs[i]} is: ${strategies.portions[i].toNumber()}`);
        }

        // step 3: check slippage
        let slippage = await swapping.slippage(stETHAddr);
        console.log("stETH slippage is ", slippage.toNumber());
        slippage = await swapping.slippage(frxETHAddr);
        console.log("frxETH slippage is ", slippage.toNumber());

        // step 4: check value
        console.log("Before roll...")
        let currentSharePrice = await vault.currentSharePrice.call();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));
        let allValue = await strategyController.getAllStrategiesValue.call();
        console.log("allValue: ", BigNumber(allValue).div(1e18).toString(10));
        for (var i = 0; i < strategies.addrs.length; i++) {
            const s = await Strategy.at(strategies.addrs[i]);
            const value = await s.getAllValue.call();
            console.log(`${strategies.addrs[i]} value is: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        // step : set slippage
        await swapping.setSlippage(frxETHAddr, 997000);

        // step 5: roll
        // 0xcb8b644191993CA1e9ce94920f267ed7fb16E90C
        // const roll = await Roll.at("0xcb8b644191993CA1e9ce94920f267ed7fb16E90C");
        const roll = await Roll.new(config.stoneVaultAddr, config.rETHBalancerAuraStrategyAddr);
        console.log("Roll address: ", roll.address);
        const strategy = await RETHBalancerAuraStrategy.at(config.rETHBalancerAuraStrategyAddr);
        await strategy.setGovernance(roll.address);

        const rs = await roll.rollToNextRound.call(999000, deployer);
        console.log("oldPrice: ", BigNumber(rs.oldPrice).div(1e18).toString(10));
        console.log("newPrice: ", BigNumber(rs.newPrice).div(1e18).toString(10));

        await roll.rollToNextRound(999000, deployer);

        // step 6: check value after
        console.log("After roll...")
        currentSharePrice = await vault.currentSharePrice.call();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));
        allValue = await strategyController.getAllStrategiesValue.call();
        console.log("allValue: ", BigNumber(allValue).div(1e18).toString(10));
        for (var i = 0; i < strategies.addrs.length; i++) {
            const s = await Strategy.at(strategies.addrs[i]);
            const value = await s.getAllValue.call();
            console.log(`${strategies.addrs[i]} value is: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        // step 7: check extra rewards
        let token = await ERC20.at(balAddr);
        let balance = await token.balanceOf(deployer);
        console.log(`BAL is: ${BigNumber(balance).div(1e18).toString(10)}`);
        token = await ERC20.at(auraAddr);
        balance = await token.balanceOf(deployer);
        console.log(`AURA is: ${BigNumber(balance).div(1e18).toString(10)}`);

        // step 8: destroy strategies
        await vault.destroyStrategy(config.stETHHoldingStrategyAddr);
        await vault.destroyStrategy(config.sFraxETHHoldingStrategyAddr);
        await vault.destroyStrategy(config.rETHHoldingStrategyAddr);
        await vault.destroyStrategy(config.rETHBalancerAuraStrategyAddr);

        // step 9: check portfolio
        strategies = await strategyController.getStrategies();
        console.log("After destroy...");
        for (var i = 0; i < strategies.addrs.length; i++) {
            console.log(`${strategies.addrs[i]} is: ${strategies.portions[i].toNumber()}`);
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