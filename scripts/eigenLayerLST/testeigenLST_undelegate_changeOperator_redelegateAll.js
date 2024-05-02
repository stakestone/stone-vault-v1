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
        console.log("stETH balance of bankAddr: ", BigNumber(await stETH.balanceOf(bankAddr)).toString(10));
        console.log("stETH balance of controller: ", BigNumber(await stETH.balanceOf(controllerAddr)).toString(10));

        await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
        let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

        let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

        const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking', { from: deployer });
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
        await eigenLSTRestaking.setRouter(true, true, { from: deployer }); //

        const eth_deposit_amount = BigNumber(20).times(1e18);
        await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        console.log("deposit success");

        await eigenLSTRestaking.swapToToken(eth_deposit_amount, { from: deployer });
        console.log("swapToToken success");

        // depositIntoStrategy
        await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2), { from: deployer });

        let userUnderlying = await eigenStrategy.userUnderlyingView(eigenLSTRestakingAddr);
        console.log("userUnderlying: ", BigNumber(userUnderlying).div(1e18).toString(10));

        let shares = BigNumber(await eigenStrategy.shares(eigenLSTRestakingAddr));
        console.log("shares: ", shares.div(1e18).toString(10));
        chai.assert.isTrue(Math.abs(eth_deposit_amount.div(2).minus(userUnderlying)) < 100, 'Absolute difference should be less than 100');
        chai.assert.isTrue(Math.abs(eth_deposit_amount.div(2).minus(shares)) < 8e15, 'Absolute difference should be less than 100');

        //delegate
        await eigenLSTRestaking.setEigenOperator(operator1, { from: deployer });
        const approverSignatureAndExpiry = {
            signature: operator1, // 一个有效的签名
            expiry: 1234567890 // 过期时间戳
        };
        const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        
        // 调用合约方法delegate
        await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt, { from: deployer });
        console.log("delegate success");

        let userUnderlying1 = await eigenStrategy.userUnderlyingView(eigenLSTRestakingAddr);
        console.log("userUnderlying1: ", BigNumber(userUnderlying1).div(1e18).toString(10));

        let shares1 = await eigenStrategy.shares(eigenLSTRestakingAddr);
        console.log("shares1: ", BigNumber(shares1).div(1e18).toString(10));

        // // 调用undelegate合约方法 【测试点：为避免eigenlayer修改接口，统一走unstake, undelegate空转】
        // await truffleAssert.fails(
        //     eigenLSTRestaking.undelegate({ from: deployer }),
        //     truffleAssert.ErrorType.REVERT,
        //     "active shares"
        // );
        // queueWithdrawals
        const queueWithdrawalsTx = await eigenLSTRestaking.queueWithdrawals(
            [
                {
                    strategies: [eigenStrategyAddr],
                    shares: [BigNumber(shares).toString(10)],
                    withdrawer: eigenLSTRestakingAddr
                }
            ], { from: deployer }
        );
        let res = BigNumber(await eigenLSTRestaking.getUnstakingValue());
        console.log("res is : ", res.toString(10));
        let res1 = await eigenLSTRestaking.getWithdrawalRoots();
        console.log("res1 is : ", res1);
        let rawLogs = queueWithdrawalsTx.receipt.rawLogs;
        let topic = "0x9009ab153e8014fbfb02f2217f5cde7aa7f9ad734ae85ca3ee3f4ca2fdd499f9";
        let log0;

        for (var i = 0; i < rawLogs.length; i++) {
            if (rawLogs[i].topics[0] == topic) {
                log0 = rawLogs[i];
            }
        }

        console.log("queueWithdrawals success");
        // //返回的 queueWithdrawalsTx topic: 0x9009ab153e8014fbfb02f2217f5cde7aa7f9ad734ae85ca3ee3f4ca2fdd499f9
        // const emittedEvents = result.receipt.rawLogs.map(log => log.topics[0]);
        // console.log("emittedEvents is : ", emittedEvents);
        // chai.expect(emittedEvents[2]).to.match(new RegExp('0x9009ab153e8014fbfb02f2217f5cde7aa7f9ad734ae85ca3ee3f4ca2fdd499f9', 'i'));
        // let log = result.receipt.rawLogs[2];
        let decodedEvent = Abi.decodeParameters(abi.inputs, log0.data);
        console.log("Decoded event: ", decodedEvent);
        assert.strictEqual(res1[0], decodedEvent[0]);

        assert.strictEqual(res.toString(10), userUnderlying.toString(10));

        let userUnderlying2 = await eigenStrategy.userUnderlyingView(eigenLSTRestakingAddr);
        console.log("userUnderlying2: ", BigNumber(userUnderlying2).div(1e18).toString(10));

        let shares2 = await eigenStrategy.shares(eigenLSTRestakingAddr);
        console.log("shares2: ", BigNumber(shares2).div(1e18).toString(10));
        assert.strictEqual(userUnderlying2.toString(10), '0');
        assert.strictEqual(shares2.toString(10), '0');

        let root = await eigenLSTRestaking.calculateWithdrawalRoot(
            {
                staker: decodedEvent.withdrawal.staker,
                delegatedTo: decodedEvent.withdrawal.delegatedTo,
                withdrawer: decodedEvent.withdrawal.withdrawer,
                nonce: decodedEvent.withdrawal.nonce,
                startBlock: decodedEvent.withdrawal.startBlock,
                strategies: decodedEvent.withdrawal.strategies,
                shares: decodedEvent.withdrawal.shares,
            }
        );
        console.log("root is : ", root);
        assert.strictEqual(res1[0], root);

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
        let userUnderlying3 = await eigenStrategy.userUnderlyingView(eigenLSTRestakingAddr);
        console.log("userUnderlying3: ", BigNumber(userUnderlying3).div(1e18).toString(10));

        let shares3 = await eigenStrategy.shares(eigenLSTRestakingAddr);
        console.log("shares3: ", BigNumber(shares3).div(1e18).toString(10));

        await eigenLSTRestaking.undelegate({ from: deployer });
        let amt = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("amt is : ", amt.toString(10));
        chai.assert.isTrue(eth_deposit_amount.minus(amt) < 10, "diff is acceptable.");

        // depositIntoStrategy again
        let result1 = await eigenLSTRestaking.depositIntoStrategy(amt, { from: deployer });
        console.log("depositIntoStrategy again success");
        console.log("result1 is : ", result1);

        //delegate another op
        await eigenLSTRestaking.setEigenOperator(operator2, { from: deployer });
        const approverSignatureAndExpiry1 = {
            signature: operator2, // 一个有效的签名
            expiry: 1234567890 // 过期时间戳
        };
        const approverSalt1 = web3.utils.keccak256("salt value1"); // 使用 web3 来生成一个盐值        
        // 调用合约方法delegate
        let tx = await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry1, approverSalt1, { from: deployer });
        console.log("delegate new op success: ", tx.receipt.rawLogs);

        // delegate topic: 0xc3ee9f2e5fda98e8066a1f745b2df9285f416fe98cf2559cd21484b3d8743304
        const emittedEvents1 = tx.receipt.rawLogs.map(log => log.topics[0]);
        console.log("emittedEvents1 is : ", emittedEvents1);
        chai.expect(emittedEvents1[0]).to.match(new RegExp('0xc3ee9f2e5fda98e8066a1f745b2df9285f416fe98cf2559cd21484b3d8743304', 'i'));
        // new operator: 0x4E8c2DfC2A8DcF3f7D2EDaEFcA5C907C7136F4BC
        const emittedEvents2 = tx.receipt.rawLogs.map(log => log.topics[2]);
        console.log("emittedEvents2 is : ", emittedEvents2);
        chai.expect(emittedEvents2[0]).to.include('4e8c2dfc2a8dcf3f7d2edaefca5c907c7136f4bc');

        let userUnderlying4 = await eigenStrategy.userUnderlyingView(eigenLSTRestakingAddr);
        console.log("userUnderlying4: ", BigNumber(userUnderlying4).div(1e18).toString(10));

        let shares4 = BigNumber(await eigenStrategy.shares(eigenLSTRestakingAddr));
        console.log("shares4: ", shares4.div(1e18).toString(10));
        chai.assert.isTrue(Math.abs(eth_deposit_amount.minus(userUnderlying4)) < 100, 'Absolute difference should be less than 100');
        chai.assert.isTrue(Math.abs(shares4.minus(shares.times(2))) < 100, 'Absolute difference should be less than 100');

        callback();
    } catch (e) {
        callback(e);
    }
}




