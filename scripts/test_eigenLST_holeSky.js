const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const { expect } = require('chai');
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


module.exports = async function (callback) {
    try {
        stETH = await MockToken.at(stETHAddr);

        // it("test1_user deposit ETH", async () => {
        const wethAddr = "0x94373a4919B3240D86eA41593D5eBa789FEF3848";
        const swappingAggregator = SwappingAggregator.new(wethAddr);
        const swappingAggregatorAddr = swappingAggregator.address;

        const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        await eigenLSTRestaking.setRouter(true, true); //

        const stETH_deposit_amount = BigNumber(1).times(1e17);

        let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
        let controllerBalance_stETH = BigNumber(await stETH.balanceOf(controllerAddr));
        console.log("controllerBalance ether amount:", controllerBalance.toString());
        console.log("controllerBalance_stETH ether amount:", controllerBalance_stETH.toString());

        let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
        console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());

        let tx = await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });

        await eigenLSTRestaking.swapToToken(eth_deposit_amount);

        let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        // assert.strictEqual(eigenLSTRestakingBalance1.minus(eigenLSTRestakingBalance).toString(), eth_deposit_amount.toString());
        console.log("eigenLSTRestakingBalance1 ether amount:", eigenLSTRestakingBalance1.toString());
        let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

        let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
        let controllerBalance_stETH1 = BigNumber(await stETH.balanceOf(controllerAddr));
        console.log("controllerBalance1 ether amount:", controllerBalance1.toString());
        console.log("controllerBalance_stETH1 ether amount:", controllerBalance_stETH1.toString());


        // const gasUsed = tx.receipt.gasUsed;
        // console.log('Gas used:', gasUsed.toString());
        // let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        // assert.isTrue(Math.abs(controllerBalance.minus(controllerBalance1).minus(eth_deposit_amount).minus(gas)) < 10, 'Absolute difference should be less than 10');



    } catch (e) {
        callback(e);
    }
    function sleep(s) {
        return new Promise((resolve) => {
            setTimeout(resolve, s * 1000);
        });
    }
}
