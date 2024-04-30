const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const chai = require('chai');
const { ethers } = require("ethers");
const MockToken = artifacts.require("MockToken");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');
const TruffleConfig = require('../truffle-config');
const EigenLSTRestaking = artifacts.require('strategies/eigen/EigenLSTRestaking');
const layerZeroEndpoint = "0x6edce65403992e310a62460808c4b910d972f10f";
const lidoWithdrawalQueueAddr = "0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50";
const stETHAddr = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";
const SwappingAggregator = artifacts.require("MockSwappingAggregator");
const controllerAddr = "0xAFbf909a63CD97B131d99F2d1898717A0ac236ce"; //eigenTest1
const delegationManagerAddr = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
const eigenStrategyAddr = "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3"; //for stETH
const strategyManagerAddr = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
const bankAddr = "0x613670cC9D11e8cB6ea297bE7Cac08187400C936"; //testbuteigen
const assert = require('assert');

module.exports = async function (callback) {
    try {
        stETH = await MockToken.at(stETHAddr);
        const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
        console.log('Gas price:', gasPrice.toString());
        // it("test1_user deposit ETH", async () => {
        const wethAddr = "0x94373a4919B3240D86eA41593D5eBa789FEF3848";
        const swappingAggregator = await SwappingAggregator.new(wethAddr);
        const swappingAggregatorAddr = swappingAggregator.address;
        console.log("swappingAggregatorAddr is : ", swappingAggregatorAddr);
        await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
            from: bankAddr
        });
        await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
        let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH : ", swappingAggregatorBalance_stETH.toString());

        let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account : ", swappingAggregatorBalance.toString());

        const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        await eigenLSTRestaking.setRouter(true, true); //

        let controllerBalance0 = BigNumber(await web3.eth.getBalance(controllerAddr));
        let controllerBalance_stETH0 = BigNumber(await stETH.balanceOf(controllerAddr));
        console.log("controllerBalance ether amount0:", controllerBalance0.toString());
        console.log("controllerBalance_stETH ether amount0:", controllerBalance_stETH0.toString());

        let eigenLSTRestakingBalance0 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        let eigenLSTRestakingBalance_stETH0 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance ether amount0:", eigenLSTRestakingBalance0.toString());
        console.log("eigenLSTRestakingBalance_stETH ether amount0:", eigenLSTRestakingBalance_stETH0.toString());

        const eth_deposit_amount = BigNumber(1).times(1e18);
        let tx = await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        console.log("deposit success");

        let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
        console.log("controllerBalance ether amount:", controllerBalance.toString());

        let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
        let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());

        assert.strictEqual(eigenLSTRestakingBalance0.toString(), '0');
        assert.strictEqual(eigenLSTRestakingBalance.toString(), eth_deposit_amount.toString());
        let gasUsed = tx.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        chai.assert.isTrue(Math.abs(controllerBalance0.minus(controllerBalance).minus(eth_deposit_amount).minus(gas)) < 100, 'Absolute difference should be less than 100');

        let tx1 = await eigenLSTRestaking.swapToToken(eth_deposit_amount);
        console.log("swapToToken success");
        let swappingAggregatorBalance1 = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account1 : ", swappingAggregatorBalance1.toString());

        let swappingAggregatorBalance_stETH1 = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH1 : ", swappingAggregatorBalance_stETH1.toString());

        let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance1 ether amount:", eigenLSTRestakingBalance1.toString());
        let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

        let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
        let controllerBalance_stETH1 = BigNumber(await stETH.balanceOf(controllerAddr));
        console.log("controllerBalance1 ether amount:", controllerBalance1.toString());
        console.log("controllerBalance_stETH1 ether amount:", controllerBalance_stETH1.toString());

        assert.strictEqual(eigenLSTRestakingBalance.minus(eigenLSTRestakingBalance1).toString(), eth_deposit_amount.toString());
        chai.assert.isTrue(Math.abs(eigenLSTRestakingBalance_stETH1.minus(eigenLSTRestakingBalance_stETH).minus(eth_deposit_amount)) < 10, 'Absolute difference should be less than 10');
        chai.assert.isTrue(Math.abs(swappingAggregatorBalance_stETH.minus(swappingAggregatorBalance_stETH1).minus(eth_deposit_amount)) < 10, 'Absolute difference should be less than 10');
        assert.strictEqual(swappingAggregatorBalance1.minus(swappingAggregatorBalance).toString(), eth_deposit_amount.toString());
        assert.strictEqual(controllerBalance1.toString(), controllerBalance.toString());

    } catch (e) {
        callback(e);
    }
    function sleep(s) {
        return new Promise((resolve) => {
            setTimeout(resolve, s * 1000);
        });
    }
}
