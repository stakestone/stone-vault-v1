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
const TruffleConfig = require('../truffle-config');
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
const { Console } = require("console");
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
        console.log("bankAddr steth: ", BigNumber(await stETH.balanceOf(bankAddr)).toString(10));

        await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
        console.log("stETh transfer success");
        console.log("bankAddr eth: ", BigNumber(await web3.eth.getBalance(bankAddr).toString(10)));
        await web3.eth.sendTransaction({
            from: bankAddr,
            to: swappingAggregatorAddr,
            value: BigNumber(100).times(1e18)
        })
        console.log("ETh transfer success");

        let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

        let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

        const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking', { from: deployer });
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
        await eigenLSTRestaking.setRouter(true, true, { from: deployer });

        const eth_deposit_amount = BigNumber(20).times(1e18);
        await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        console.log("deposit success");

        await eigenLSTRestaking.swapToToken(eth_deposit_amount, { from: deployer });
        console.log("swapToToken success");

        // depositIntoStrategy
        await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount, { from: deployer });
        let shares = BigNumber(await eigenStrategy.shares(eigenLSTRestakingAddr));
        console.log("share is : ", shares.toString());
        // queueWithdrawals and completed
        const queueWithdrawalsTx = await eigenLSTRestaking.queueWithdrawals(
            [
                {
                    strategies: [eigenStrategyAddr],
                    shares: [BigNumber(shares.div(5).toFixed(0)).toString(10)],
                    withdrawer: eigenLSTRestakingAddr
                }
            ], { from: deployer }
        );
        console.log("root0 is : ", queueWithdrawalsTx.receipt.logs[0].args.withdrawalRoot);
        root0 = queueWithdrawalsTx.receipt.logs[0].args.withdrawalRoot;
        let rawLogs = queueWithdrawalsTx.receipt.rawLogs;
        let topic = "0x9009ab153e8014fbfb02f2217f5cde7aa7f9ad734ae85ca3ee3f4ca2fdd499f9";
        let log;

        for (var i = 0; i < rawLogs.length; i++) {
            if (rawLogs[i].topics[0] == topic) {
                log = rawLogs[i];
            }
        }
        let decodedEvent = Abi.decodeParameters(abi.inputs, log.data);
        console.log("Decoded event: ", decodedEvent);

        for (i = 0; i < 10; i++) {
            await time.advanceBlock();
        }
        await eigenLSTRestaking.completeQueuedWithdrawal(
            {
                staker: decodedEvent.withdrawal.staker,
                delegatedTo: decodedEvent.withdrawal.delegatedTo,
                withdrawer: decodedEvent.withdrawal.withdrawer,
                nonce: decodedEvent.withdrawal.nonce,
                startBlock: decodedEvent.withdrawal.startBlock,
                strategies: decodedEvent.withdrawal.strategies,
                shares: decodedEvent.withdrawal.shares,
            },
            [stETHAddr],
            0,
            true,
            { from: deployer }
        );
        // unstaked
        const queueWithdrawalsTx1 = await eigenLSTRestaking.queueWithdrawals(
            [
                {
                    strategies: [eigenStrategyAddr],
                    shares: [BigNumber(shares.div(4).toFixed(0)).toString(10)],
                    withdrawer: eigenLSTRestakingAddr
                }
            ], { from: deployer }
        );
        console.log("root1 is : ", queueWithdrawalsTx1.receipt.logs[0].args.withdrawalRoot);
        for (i = 0; i < 10; i++) {
            await time.advanceBlock();
        }
        // unstaking
        const queueWithdrawalsTx2 = await eigenLSTRestaking.queueWithdrawals(
            [
                {
                    strategies: [eigenStrategyAddr],
                    shares: [BigNumber(shares.div(2).toFixed(0)).toString(10)],
                    withdrawer: eigenLSTRestakingAddr
                }
            ], { from: deployer }
        );
        console.log("root2 is : ", queueWithdrawalsTx2.receipt.logs[0].args.withdrawalRoot);
        root2 = queueWithdrawalsTx2.receipt.logs[0].args.withdrawalRoot;

        let userUnderlying = await eigenStrategy.userUnderlyingView(eigenLSTRestakingAddr);
        console.log("userUnderlying: ", BigNumber(userUnderlying).div(1e18).toString(10));

        let res = BigNumber(await eigenLSTRestaking.getUnstakingValue({ from: deployer }));
        console.log("res is : ", res.toString(10));
        chai.assert.isTrue(Math.abs(eth_deposit_amount.div(4).plus(eth_deposit_amount.div(2)).minus(res)) < 100, 'Absolute difference should be less than 100');

        value = BigNumber(await eigenLSTRestaking.getAllValue.call({
            from: controllerAddr
        }));
        console.log("value is : ", value.toString());
        chai.assert.isTrue(Math.abs(eth_deposit_amount.minus(value)) < 100, 'Absolute difference should be less than 100');
        let amt = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("amt is : ", amt.toString());
        let ethAmt = BigNumber(await eigenLSTRestaking.swapToEther(amt.toString(10), { from: deployer }));
        console.log("amt is : ", amt.toString());
        console.log("ethAmt is : ", ethAmt.toString());

        let bef = BigNumber(await web3.eth.getBalance(controllerAddr));
        let result = BigNumber(await eigenLSTRestaking.clear({ from: controllerAddr }));
        console.log("result is : ", result.toString());
        let aft = BigNumber(await web3.eth.getBalance(controllerAddr));
        let diff = aft.minus(bef);
        console.log("diff is : ", diff.toString());
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

// 定义函数来获取当前区块高度
async function getCurrentBlockNumber() {
    try {
        // 使用异步函数获取当前区块高度
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('Current block number:', blockNumber);
        return blockNumber;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

//造统计数据1： 主合约中未swap的ETH余额，stETH余额，Lido 中 Pending 的 stETH，Lido 中 Claimable 的 ETH，Eigenlayer中如果之前有delegate, 合约主动发起的unstake(unstaking) + 之前已经unstaked + delegated 
//造统计数据2： 主合约中未swap的ETH余额，stETH余额，Lido 中 Pending 的 stETH，Lido 中 Claimable 的 ETH，Eigenlayer中如果之前没有delegate, 合约主动发起的unstake(unstaking) + 之前已经unstaked +剩余质押的stEH
//用例1：delegate后主合约owner直接unstake后取款，再次depositIntoStrategy 
//用例2：通过undelegate来unstake后主合约owner取款，再次depositIntoStrategy 
//用例3：没有做过delegate，主合约owner主动发起unstake并取款
// 试试unstake之前undelegate的额度
// let queuedWithdrawalParams = [{
//     strategies: [eigenStrategyAddr],
//     shares: [100],
//     withdrawer: eigenLSTRestakingAddr
// }];
// await eigenLSTRestaking.queueWithdrawals(queuedWithdrawalParams);


