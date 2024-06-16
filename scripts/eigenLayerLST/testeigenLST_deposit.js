const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const chai = require('chai');
const Abi = web3.eth.abi;
const IStrategyManager = artifacts.require("IStrategyManager");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");
const IERC20 = artifacts.require("IERC20");
const { time } = require('@openzeppelin/test-helpers');
const EigenLSTRestaking = artifacts.require('strategies/eigen/EigenLSTRestaking');
const lidoWithdrawalQueueAddr = "0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50";
const stETHAddr = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";
const SwappingAggregator = artifacts.require("MockSwappingAggregator");
const controllerAddr = "0xAFbf909a63CD97B131d99F2d1898717A0ac236ce"; //eigenTest1
const delegationManagerAddr = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
const eigenStrategyAddr = "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3"; //for stETH
const strategyManagerAddr = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";
const bankAddr = "0x613670cC9D11e8cB6ea297bE7Cac08187400C936"; // testbuteigen
const assert = require('assert');
const wethAddr = "0x94373a4919B3240D86eA41593D5eBa789FEF3848";
const operator1 = "0x8065ff35ef6dfc63ebe1005f017ec2139fe4c581"; //real
const operator2 = "0x4E8c2DfC2A8DcF3f7D2EDaEFcA5C907C7136F4BC";
//"0x693385E040a9b038f6e87bc49a34D5645EAf66e5" "0xff8f90A22b5D6d209D3a97100AB0F8f0a8520c6C" 自己的
const abi = {
    "anonymous": false,
    "inputs": [
        {
            "indexed": false,
            "internalType": "bytes32",
            "name": "withdrawalRoot",
            "type": "bytes32"
        },
        {
            "components": [
                {
                    "internalType": "address",
                    "name": "staker",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "delegatedTo",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "withdrawer",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "nonce",
                    "type": "uint256"
                },
                {
                    "internalType": "uint32",
                    "name": "startBlock",
                    "type": "uint32"
                },
                {
                    "internalType": "address[]",
                    "name": "strategies",
                    "type": "address[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "shares",
                    "type": "uint256[]"
                }
            ],
            "indexed": false,
            "internalType": "struct IDelegationManager.Withdrawal",
            "name": "withdrawal",
            "type": "tuple"
        }
    ],
    "name": "WithdrawalQueued",
    "type": "event"
}
module.exports = async function (callback) {
    try {
        let stETH = await IERC20.at(stETHAddr);
        let eigenStrategy = await IEigenStrategy.at(eigenStrategyAddr);
        const strategyManager = await IStrategyManager.at(strategyManagerAddr);
        const delegationManager = await IDelegationManager.at(delegationManagerAddr);
        await stETH.approve(strategyManager.address, MAX_UINT256);

        let swappingAggregator = await SwappingAggregator.new({ from: deployer });
        swappingAggregatorAddr = swappingAggregator.address;
        console.log("swappingAggregatorAddr is : ", swappingAggregatorAddr);


        await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
            from: bankAddr
        });
        await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
        let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

        let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

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
        let diff = controllerBalance0.minus(controllerBalance).minus(eth_deposit_amount);
        console.log("diff is :", diff.toString());

        chai.assert.isTrue(diff < 2e14, 'Absolute difference should be less than 100');

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
        callback();
    } catch (e) {
        callback(e);
    }
}
