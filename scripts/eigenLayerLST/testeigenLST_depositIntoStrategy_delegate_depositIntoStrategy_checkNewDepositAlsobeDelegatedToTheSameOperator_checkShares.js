const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const chai = require('chai');
const Abi = web3.eth.abi;
const IStrategyManager = artifacts.require("IStrategyManager");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");
const IERC20 = artifacts.require("IERC20");
const { ethers } = require("ethers");
const truffleAssert = require('truffle-assertions');
const { time } = require('@openzeppelin/test-helpers');
const TruffleConfig = require('../../truffle-config');
const EigenStrategy = artifacts.require('EigenStrategy');
const EigenLSTRestaking = artifacts.require('strategies/eigen/EigenLSTRestaking');
const layerZeroEndpoint = "0x6edce65403992e310a62460808c4b910d972f10f";
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
        await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
        let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

        let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

        const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
        await eigenLSTRestaking.setRouter(true, true); //

        const eth_deposit_amount = BigNumber(20).times(1e18);
        await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        console.log("deposit success");

        await eigenLSTRestaking.swapToToken(eth_deposit_amount);
        console.log("swapToToken success");

        // depositIntoStrategy
        await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));

        let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance ether amount1:", eigenLSTRestakingBalance1.toString());
        let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

        let strategy_balance1 = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
        console.log("strategy_balance1 is : ", strategy_balance1.toString());
        let strategy_balance_ETH1 = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
        console.log("strategy_balance_ETH1 is : ", strategy_balance_ETH1.toString());

        //delegate
        await eigenLSTRestaking.setEigenOperator(operator1);
        const approverSignatureAndExpiry = {
            signature: operator1, // 一个有效的签名
            expiry: 1234567890 // 过期时间戳
        };
        const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        
        // 调用合约方法delegate
        await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
        console.log("delegate success");

        // depositIntoStrategy again
        let result1 = await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));
        // console.log("result1 is : ", result1);

        console.log("result1.receipt.rawLogs is : ", result1.receipt.rawLogs);

        const emittedEvents00 = result1.logs.map(log => log.event);
        chai.expect(emittedEvents00).to.include('DepositIntoStrategy');
        // 存的记录
        assert.strictEqual(result1.logs[0].args[0], eigenStrategyAddr);
        assert.strictEqual(result1.logs[0].args[1], stETHAddr);
        assert.strictEqual(BigNumber(result1.logs[0].args[2]).toString(), eth_deposit_amount.div(2).toString());

        // //返回的 Transfer shares topic: 0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb
        const emittedEvents10 = result1.receipt.rawLogs.map(log => log.topics[0]);
        console.log("emittedEvents10 is : ", emittedEvents10);
        chai.expect(emittedEvents10[3]).to.match(new RegExp('0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb', 'i'));
        //share给owner
        const emittedEvents30 = result1.receipt.rawLogs.map(log => log.topics[1]);
        console.log("emittedEvents30 is : ", emittedEvents30);
        chai.expect(emittedEvents30[3]).to.match(new RegExp(eigenLSTRestakingAddr.slice(2), 'i'));
        // 自动delegate
        const emittedEvents40 = result1.receipt.rawLogs.map(log => log.topics[1]);
        console.log("emittedEvents40 is : ", emittedEvents40);
        chai.expect(emittedEvents40[5]).to.match(new RegExp(operator1.slice(2), 'i'));
        // // 验证返回的 shares 是否正确
        const emittedEvents20 = result1.receipt.rawLogs.map(log => log.data);
        console.log("new share is : ", emittedEvents20[3].toString(10));
        let diff1 = eth_deposit_amount.div(2).minus(parseInt(emittedEvents20[3].slice(-16), 16)).div(eth_deposit_amount.div(2));
        console.log("The diff1 between deposit and share is : ", diff1.toString());
        chai.assert.isTrue(diff1 < 1e16, 'Absolute diff is acceptable');

        //stETH给eigenStrategy
        let eigenLSTRestakingBalance10 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance ether amount10:", eigenLSTRestakingBalance10.toString());
        let eigenLSTRestakingBalance_stETH10 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance_stETH10 ether amount:", eigenLSTRestakingBalance_stETH10.toString());

        let strategy_balance10 = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
        console.log("strategy_balance10 is : ", strategy_balance10.toString());
        let strategy_balance_ETH10 = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
        console.log("strategy_balance_ETH10 is : ", strategy_balance_ETH10.toString());

        assert.strictEqual(eigenLSTRestakingBalance1.toString(), eigenLSTRestakingBalance10.toString());
        assert.strictEqual(strategy_balance10.toString(), strategy_balance1.toString());
        diff = strategy_balance_ETH10.minus(strategy_balance_ETH1).minus(eigenLSTRestakingBalance_stETH1.minus(eigenLSTRestakingBalance_stETH10));
        console.log("The diff between deposit and share is : ", diff.toString());
        chai.assert.isTrue(diff < 100, 'Absolute diff is acceptable');

        callback();
    } catch (e) {
        callback(e);
    }
}


