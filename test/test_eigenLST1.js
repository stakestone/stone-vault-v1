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
let stETH, swappingAggregator, swappingAggregatorAddr, strategyManager, delegationManager, eigenStrategy;

contract("test_eigenLST1", async ([]) => {
    // const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
    // console.log('Gas price:', gasPrice);
    beforeEach(async () => {
        swappingAggregator = await SwappingAggregator.new(wethAddr);
        swappingAggregatorAddr = swappingAggregator.address;
        console.log("swappingAggregatorAddr is : ", swappingAggregatorAddr);
        strategyManager = await IStrategyManager.at(strategyManagerAddr);
        delegationManager = await IDelegationManager.at(delegationManagerAddr);
        eigenStrategy = await IEigenStrategy.at(eigenStrategyAddr);
        stETH = await IERC20.at(stETHAddr);
        await stETH.approve(strategyManager.address, MAX_UINT256);

    });

    // it("test1_user deposit ETH", async () => {
    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     let controllerBalance0 = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     let controllerBalance_stETH0 = BigNumber(await stETH.balanceOf(controllerAddr));
    //     console.log("controllerBalance ether amount0:", controllerBalance0.toString());
    //     console.log("controllerBalance_stETH ether amount0:", controllerBalance_stETH0.toString());

    //     let eigenLSTRestakingBalance0 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     let eigenLSTRestakingBalance_stETH0 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount0:", eigenLSTRestakingBalance0.toString());
    //     console.log("eigenLSTRestakingBalance_stETH ether amount0:", eigenLSTRestakingBalance_stETH0.toString());

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let tx = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     console.log("controllerBalance ether amount:", controllerBalance.toString());

    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
    //     let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());

    //     assert.strictEqual(eigenLSTRestakingBalance0.toString(), '0');
    //     assert.strictEqual(eigenLSTRestakingBalance.toString(), eth_deposit_amount.toString());
    //     let gasUsed = tx.receipt.gasUsed;
    //     console.log('Gas used:', gasUsed.toString());
    //     let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
    //     chai.assert.isTrue(Math.abs(controllerBalance0.minus(controllerBalance).minus(eth_deposit_amount).minus(gas)) < 100, 'Absolute difference should be less than 100');

    //     let tx1 = await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");
    //     let swappingAggregatorBalance1 = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account1 : ", swappingAggregatorBalance1.toString());

    //     let swappingAggregatorBalance_stETH1 = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH1 : ", swappingAggregatorBalance_stETH1.toString());

    //     let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance1 ether amount:", eigenLSTRestakingBalance1.toString());
    //     let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

    //     let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     let controllerBalance_stETH1 = BigNumber(await stETH.balanceOf(controllerAddr));
    //     console.log("controllerBalance1 ether amount:", controllerBalance1.toString());
    //     console.log("controllerBalance_stETH1 ether amount:", controllerBalance_stETH1.toString());

    //     assert.strictEqual(eigenLSTRestakingBalance.minus(eigenLSTRestakingBalance1).toString(), eth_deposit_amount.toString());
    //     chai.assert.isTrue(Math.abs(eigenLSTRestakingBalance_stETH1.minus(eigenLSTRestakingBalance_stETH).minus(eth_deposit_amount)) < 10, 'Absolute difference should be less than 10');
    //     chai.assert.isTrue(Math.abs(swappingAggregatorBalance_stETH.minus(swappingAggregatorBalance_stETH1).minus(eth_deposit_amount)) < 10, 'Absolute difference should be less than 10');
    //     assert.strictEqual(swappingAggregatorBalance1.minus(swappingAggregatorBalance).toString(), eth_deposit_amount.toString());
    //     assert.strictEqual(controllerBalance1.toString(), controllerBalance.toString());

    // });

    // it("test2_user deposit ETH_buffer enough_withdraw ETH", async () => {
    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     let controllerBalance0 = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     let controllerBalance_stETH0 = BigNumber(await stETH.balanceOf(controllerAddr));
    //     console.log("controllerBalance ether amount0:", controllerBalance0.toString());
    //     console.log("controllerBalance_stETH ether amount0:", controllerBalance_stETH0.toString());

    //     let eigenLSTRestakingBalance0 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     let eigenLSTRestakingBalance_stETH0 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount0:", eigenLSTRestakingBalance0.toString());
    //     console.log("eigenLSTRestakingBalance_stETH ether amount0:", eigenLSTRestakingBalance_stETH0.toString());

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let tx = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     console.log("controllerBalance ether amount:", controllerBalance.toString());

    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
    //     let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());

    //     let gasUsed = BigNumber(tx.receipt.gasUsed);
    //     console.log('Gas used:', gasUsed.toString());

    //     let tx1 = await eigenLSTRestaking.instantWithdraw(
    //         eth_deposit_amount, {
    //         from: controllerAddr
    //     });
    //     let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance1 ether amount:", eigenLSTRestakingBalance1.toString());
    //     let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

    //     let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     let gasUsed1 = BigNumber(tx1.receipt.gasUsed);
    //     console.log('Gas used:', gasUsed1.toString());

    //     gas = BigNumber(gasPrice).times(gasUsed.plus(gasUsed1));
    //     console.log("gas is : ", BigNumber(gas).toString(10));

    //     let diff = Math.abs(controllerBalance.minus(controllerBalance1).minus(gas));
    //     console.log("diff is : ", BigNumber(diff).toString(10));
    //     assert.isTrue(Math.abs(controllerBalance.minus(controllerBalance1).minus(gas)) < 10, 'Absolute difference should be less than 10');
    //     assert.strictEqual(eigenLSTRestakingBalance.minus(eigenLSTRestakingBalance1).toString(), eth_deposit_amount.toString());
    //     assert.strictEqual(eigenLSTRestakingBalance_stETH1.toString(), eigenLSTRestakingBalance_stETH.toString());

    // });
    // it("test3_user deposit ETH_buffer enough_negative scenarios_withdraw ETH", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     let eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(10).times(1e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     let tx1 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });

    //     await truffleAssert.fails(
    //         eigenLSTRestaking.withdraw(
    //             eth_deposit_amount, {
    //             from: controllerAddr
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "at the same block"
    //     );
    //     await truffleAssert.fails(
    //         eigenLSTRestaking.withdraw(
    //             eth_deposit_amount, {
    //             from: taker1
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "not controller"
    //     );
    // });
    // it("test4_get all value: user deposit ETH twice_buffer enough_withdraw ETH", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     let eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(5e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     let tx1 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     let tx2 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount.times(2),
    //         from: controllerAddr
    //     });
    //     // set UserUnderlyingValue on Eigen 
    //     const mockEigenUserValue = BigNumber(100e18);
    //     await eigenStrategy.setUserUnderlyingViewMockValue(mockEigenUserValue);
    //     let value = BigNumber(await eigenLSTRestaking.getAllValue.call({
    //         from: controllerAddr
    //     }));
    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     assert.strictEqual(eigenLSTRestakingBalance.plus(mockEigenUserValue).toString(), value.toString());
    //     assert.strictEqual(eth_deposit_amount.times(3).plus(mockEigenUserValue).toString(), value.toString());

    //     let tx3 = await eigenLSTRestaking.instantWithdraw(
    //         eth_deposit_amount, {
    //         from: controllerAddr
    //     });
    //     let value1 = BigNumber(await eigenLSTRestaking.getAllValue.call({
    //         from: controllerAddr
    //     }));
    //     assert.strictEqual(eth_deposit_amount.toString(), value.minus(value1).toString());

    // });
    // it("test11_depositIntoStrategy_delegate_undelegate and check value ", async () => {

    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     const eth_deposit_amount = BigNumber(20).times(1e18);
    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");

    //     // depositIntoStrategy
    //     await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));

    //     //delegate
    //     await eigenLSTRestaking.setEigenOperator(operator1);
    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };
    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        
    //     // 调用合约方法delegate
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     console.log("delegate success");
    //     // 调用undelegate合约方法
    //     await eigenLSTRestaking.undelegate();
    //     console.log("undelegate success");
    //     let value = BigNumber(await eigenLSTRestaking.getInvestedValue.call({
    //         from: controllerAddr
    //     }));
    //     console.log("value is : ", value.toString());
    //     assert.strictEqual(value.toString(), eth_deposit_amount.toString());
    // });

    it("test12_depositIntoStrategy_unstaking and check value ", async () => {

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

        let value = BigNumber(await eigenLSTRestaking.getInvestedValue.call({
            from: controllerAddr
        }));
        console.log("value is : ", value.toString());
        assert.strictEqual(value.toString(), eth_deposit_amount.toString());

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
        value = BigNumber(await eigenLSTRestaking.getInvestedValue.call({
            from: controllerAddr
        }));
        console.log("value is : ", value.toString());
        assert.strictEqual(value.toString(), eth_deposit_amount.toString());


    });

    // it("test6_get all value: PendingAssets", async () => {};

    // it("test7_delegateTo_before depositIntoStrategy", async () => {

    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let tx = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");
    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
    //     let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());

    //     await eigenLSTRestaking.setEigenOperator(operator1);

    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };

    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        

    //     // 调用合约方法
    //     let result = await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     // console.log("result is : ", result);
    //     console.log("result.logs is : ", result.logs);

    //     const emittedEvents = result.logs.map(log => log.args[0]);
    //     expect(emittedEvents).to.include('0x8065fF35ef6dfc63eBe1005f017Ec2139FE4C581');

    //     let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance1 ether amount:", eigenLSTRestakingBalance1.toString());
    //     let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());
    //     let operator1Balance = BigNumber(await web3.eth.getBalance(operator1));
    //     console.log("operator1Balance ether amount:", operator1Balance.toString());
    //     let operator1_stETH = BigNumber(await stETH.balanceOf(operator1));
    //     console.log("operator1_stETH ether amount:", operator1_stETH.toString());
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     const approverSignatureAndExpiry1 = {
    //         signature: operator2, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };

    //     const approverSalt1 = web3.utils.keccak256("salt1 value"); // 使用 web3 来生成一个盐值        
    //     //not operator已测过
    //     //已经delegated如下
    //     await truffleAssert.fails(
    //         eigenLSTRestaking.delegateTo(approverSignatureAndExpiry1, approverSalt1),
    //         truffleAssert.ErrorType.REVERT,
    //         "DelegationManager._delegate: staker is already actively delegated"
    //     );
    // });
    // it("test8_undelegate", async () => {

    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     let tx = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");
    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
    //     let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());
    //     //delegate
    //     await eigenLSTRestaking.setEigenOperator(operator1);

    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };

    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        

    //     // 调用合约方法delegate
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     console.log("delegate success");
    //     // 调用undelegate合约方法
    //     const result = await eigenLSTRestaking.undelegate();
    //     console.log("result is : ", result);
    //     // console.log("result.receipt is : ", result.receipt);
    //     // console.log("result.receipt.rawLogs is : ", result.receipt.rawLogs);

    //     // 验证返回值是否正确
    //     const emittedEvents = result.receipt.rawLogs.map(log => log.topics[0]);
    //     //undelegate topic : '0xfee30966a256b71e14bc0ebfc94315e28ef4a97a7131a9e2b7a310a73af44676' 
    //     expect(emittedEvents).to.include('0xfee30966a256b71e14bc0ebfc94315e28ef4a97a7131a9e2b7a310a73af44676');

    //     const emittedEvents1 = result.receipt.rawLogs.map(log => log.topics[1]);
    //     //undelegate sender : staker
    //     expect(emittedEvents1).to.match(new RegExp(eigenLSTRestakingAddr.slice(2), 'i'));
    //     //operator
    //     const emittedEvents2 = result.receipt.rawLogs.map(log => log.topics[2]);
    //     expect(emittedEvents2).to.match(new RegExp(operator1.slice(2), 'i'));
    //     // 不能重复执行
    //     await expectRevert.unspecified(eigenLSTRestaking.undelegate());

    // });
    // it("test9_depositIntoStrategy without delegate", async () => {

    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(20).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     const eth_deposit_amount = BigNumber(1).times(1e18);
    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");
    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
    //     let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH ether amount:", eigenLSTRestakingBalance_stETH.toString());

    //     let strategy_balance = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
    //     console.log("strategy_balance is : ", strategy_balance.toString());
    //     let strategy_balance_ETH = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
    //     console.log("strategy_balance_ETH is : ", strategy_balance_ETH.toString());

    //     let result = await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount);
    //     // console.log("result is : ", result);
    //     console.log("result.receipt.logs is : ", result.receipt.logs);
    //     console.log("result.receipt.rawLogs is : ", result.receipt.rawLogs);

    //     const emittedEvents = result.logs.map(log => log.event);
    //     expect(emittedEvents).to.include('DepositIntoStrategy');
    //     // 存的记录
    //     assert.strictEqual(result.logs[0].args[0], eigenStrategyAddr);
    //     assert.strictEqual(result.logs[0].args[1], stETHAddr);
    //     assert.strictEqual(BigNumber(result.logs[0].args[2]).toString(), eth_deposit_amount.toString());

    //     //返回的 Transfer shares topic: 0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb
    //     const emittedEvents1 = result.receipt.rawLogs.map(log => log.topics[0]);
    //     console.log("emittedEvents1 is : ", emittedEvents1);
    //     expect(emittedEvents1[3]).to.match(new RegExp('0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb', 'i'));
    //     //share给owner
    //     const emittedEvents3 = result.receipt.rawLogs.map(log => log.topics[1]);
    //     console.log("emittedEvents3 is : ", emittedEvents3);
    //     expect(emittedEvents3[3]).to.match(new RegExp(eigenLSTRestakingAddr.slice(2), 'i'));

    //     // // 验证返回的 shares 是否正确
    //     const emittedEvents2 = result.receipt.rawLogs.map(log => log.data);
    //     console.log("share is : ", emittedEvents2[3].toString(10));
    //     let diff = BigNumber(eth_deposit_amount).minus(parseInt(emittedEvents2[3].slice(-16), 16));
    //     console.log("The diff between deposit and share is : ", diff.toString());
    //     chai.assert.isTrue(diff < 1e16, 'Absolute diff is acceptable');

    //     //stETH给eigenStrategy
    //     let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount1:", eigenLSTRestakingBalance1.toString());
    //     let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

    //     let strategy_balance1 = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
    //     console.log("strategy_balance1 is : ", strategy_balance1.toString());
    //     let strategy_balance_ETH1 = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
    //     console.log("strategy_balance_ETH1 is : ", strategy_balance_ETH1.toString());

    //     assert.strictEqual(eigenLSTRestakingBalance.toString(), eigenLSTRestakingBalance1.toString());
    //     assert.strictEqual(strategy_balance1.toString(), strategy_balance.toString());
    //     diff = strategy_balance_ETH1.minus(strategy_balance_ETH).minus(eigenLSTRestakingBalance_stETH.minus(eigenLSTRestakingBalance_stETH1));
    //     console.log("The diff between deposit and share is : ", diff.toString());
    //     chai.assert.isTrue(diff < 100, 'Absolute diff is acceptable');

    // });
    // it("test10_depositIntoStrategy_delegate_depositIntoStrategy_check new deposit also be delegated to the same operator_check shares", async () => {

    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     const eth_deposit_amount = BigNumber(20).times(1e18);
    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");

    //     // depositIntoStrategy
    //     await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));

    //     let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount1:", eigenLSTRestakingBalance1.toString());
    //     let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH1 ether amount:", eigenLSTRestakingBalance_stETH1.toString());

    //     let strategy_balance1 = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
    //     console.log("strategy_balance1 is : ", strategy_balance1.toString());
    //     let strategy_balance_ETH1 = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
    //     console.log("strategy_balance_ETH1 is : ", strategy_balance_ETH1.toString());

    //     //delegate
    //     await eigenLSTRestaking.setEigenOperator(operator1);
    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };
    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        
    //     // 调用合约方法delegate
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     console.log("delegate success");

    //     // depositIntoStrategy again
    //     let result1 = await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));
    //     // console.log("result1 is : ", result1);

    //     console.log("result1.receipt.rawLogs is : ", result1.receipt.rawLogs);

    //     const emittedEvents00 = result1.logs.map(log => log.event);
    //     expect(emittedEvents00).to.include('DepositIntoStrategy');
    //     // 存的记录
    //     assert.strictEqual(result1.logs[0].args[0], eigenStrategyAddr);
    //     assert.strictEqual(result1.logs[0].args[1], stETHAddr);
    //     assert.strictEqual(BigNumber(result1.logs[0].args[2]).toString(), eth_deposit_amount.div(2).toString());

    //     // //返回的 Transfer shares topic: 0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb
    //     const emittedEvents10 = result1.receipt.rawLogs.map(log => log.topics[0]);
    //     console.log("emittedEvents10 is : ", emittedEvents10);
    //     expect(emittedEvents10[3]).to.match(new RegExp('0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb', 'i'));
    //     //share给owner
    //     const emittedEvents30 = result1.receipt.rawLogs.map(log => log.topics[1]);
    //     console.log("emittedEvents30 is : ", emittedEvents30);
    //     expect(emittedEvents30[3]).to.match(new RegExp(eigenLSTRestakingAddr.slice(2), 'i'));
    //     // 自动delegate
    //     const emittedEvents40 = result1.receipt.rawLogs.map(log => log.topics[1]);
    //     console.log("emittedEvents40 is : ", emittedEvents40);
    //     expect(emittedEvents40[5]).to.match(new RegExp(operator1.slice(2), 'i'));
    //     // // 验证返回的 shares 是否正确
    //     const emittedEvents20 = result1.receipt.rawLogs.map(log => log.data);
    //     console.log("new share is : ", emittedEvents20[3].toString(10));
    //     let diff1 = eth_deposit_amount.div(2).minus(parseInt(emittedEvents20[3].slice(-16), 16)).div(eth_deposit_amount.div(2));
    //     console.log("The diff1 between deposit and share is : ", diff1.toString());
    //     chai.assert.isTrue(diff1 < 1e16, 'Absolute diff is acceptable');

    //     //stETH给eigenStrategy
    //     let eigenLSTRestakingBalance10 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance ether amount10:", eigenLSTRestakingBalance10.toString());
    //     let eigenLSTRestakingBalance_stETH10 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     console.log("eigenLSTRestakingBalance_stETH10 ether amount:", eigenLSTRestakingBalance_stETH10.toString());

    //     let strategy_balance10 = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
    //     console.log("strategy_balance10 is : ", strategy_balance10.toString());
    //     let strategy_balance_ETH10 = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
    //     console.log("strategy_balance_ETH10 is : ", strategy_balance_ETH10.toString());

    //     assert.strictEqual(eigenLSTRestakingBalance1.toString(), eigenLSTRestakingBalance10.toString());
    //     assert.strictEqual(strategy_balance10.toString(), strategy_balance1.toString());
    //     diff = strategy_balance_ETH10.minus(strategy_balance_ETH1).minus(eigenLSTRestakingBalance_stETH1.minus(eigenLSTRestakingBalance_stETH10));
    //     console.log("The diff between deposit and share is : ", diff.toString());
    //     chai.assert.isTrue(diff < 100, 'Absolute diff is acceptable');

    // });
    // it("test11_depositIntoStrategy_delegate_undelegate and check withdraw queue_add more to depositIntoStrategy_delegate to new operator_check redelegatable token_redelegate ", async () => {

    //     await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
    //         from: bankAddr
    //     });
    //     await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
    //     let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
    //     console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

    //     let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
    //     console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

    //     const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     const eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
    //     await eigenLSTRestaking.setRouter(true, true); //

    //     const eth_deposit_amount = BigNumber(20).times(1e18);
    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log("deposit success");

    //     await eigenLSTRestaking.swapToToken(eth_deposit_amount);
    //     console.log("swapToToken success");

    //     // depositIntoStrategy
    //     await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));

    //     //delegate
    //     await eigenLSTRestaking.setEigenOperator(operator1);
    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };
    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        
    //     // 调用合约方法delegate
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     console.log("delegate success");
    //     // 调用undelegate合约方法
    //     // await eigenLSTRestaking.undelegate();
    //     // console.log("undelegate success");
    //     let value = BigNumber(await eigenLSTRestaking.getAllValue.call({
    //         from: controllerAddr
    //     }));
    //     console.log("value is : ", value.toString());
    //     // let startBlock = await getCurrentBlockNumber();
    //     // console.log("start block is : ", startBlock);
    //     // await eigenLSTRestaking.completeQueuedWithdrawal(
    //     //     {
    //     //         strategies: [eigenStrategyAddr],
    //     //         shares: [100],
    //     //         staker: eigenLSTRestakingAddr,
    //     //         withdrawer: eigenLSTRestakingAddr,
    //     //         nonce: 0,
    //     //         startBlock: startBlock,
    //     //         delegatedTo: operator1
    //     //     },
    //     //     [stETHAddr],
    //     //     1,
    //     //     true
    //     // )

    //     // // depositIntoStrategy again
    //     // let result1 = await eigenLSTRestaking.depositIntoStrategy(eth_deposit_amount.div(2));
    //     // console.log("depositIntoStrategy again success");
    //     // console.log("result1 is : ", result1);

    //     // //delegate another op
    //     // await eigenLSTRestaking.setEigenOperator(operator2);
    //     // const approverSignatureAndExpiry1 = {
    //     //     signature: operator2, // 一个有效的签名
    //     //     expiry: 1234567890 // 过期时间戳
    //     // };
    //     // const approverSalt1 = web3.utils.keccak256("salt value1"); // 使用 web3 来生成一个盐值        
    //     // // 调用合约方法delegate
    //     // await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry1, approverSalt1);
    //     // console.log("delegate new op success");


    //     // // depositIntoStrategy that undelegated part
    //     // let result2 = await eigenLSTRestaking.depositIntoStrategy(BigNumber(1e17));
    //     // console.log("depositIntoStrategy that undelegated part success");

    //     // console.log("result2 is : ", result2);

    //     // console.log("result1.receipt.logs is : ", result1.receipt.logs);
    //     // console.log("result1.receipt.rawLogs is : ", result1.receipt.rawLogs);

    //     // const emittedEvents00 = result.logs.map(log => log.event);
    //     // expect(emittedEvents00).to.include('DepositIntoStrategy');
    //     // // 存的记录
    //     // assert.strictEqual(result1.logs[0].args[0], eigenStrategyAddr);
    //     // assert.strictEqual(result1.logs[0].args[1], stETHAddr);
    //     // assert.strictEqual(BigNumber(result1.logs[0].args[2]).toString(), eth_deposit_amount.div(2).toString());

    //     // //返回的 Transfer shares topic: 0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb
    //     // const emittedEvents10 = result.receipt.rawLogs.map(log => log.topics[0]);
    //     // console.log("emittedEvents10 is : ", emittedEvents10);
    //     // expect(emittedEvents10[3]).to.match(new RegExp('0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb', 'i'));
    //     // //share给owner
    //     // const emittedEvents30 = result.receipt.rawLogs.map(log => log.topics[1]);
    //     // console.log("emittedEvents30 is : ", emittedEvents30);
    //     // expect(emittedEvents30[3]).to.match(new RegExp(eigenLSTRestakingAddr.slice(2), 'i'));

    //     // // // 验证返回的 shares 是否正确
    //     // const emittedEvents20 = result.receipt.rawLogs.map(log => log.data);
    //     // console.log("new share is : ", emittedEvents20[3].toString(10));
    //     // let diff1 = eth_deposit_amount.div(2).minus(parseInt(emittedEvents20[3].slice(-16), 16)).div(eth_deposit_amount.div(2));
    //     // console.log("The diff1 between deposit and share is : ", diff1.toString());
    //     // chai.assert.isTrue(diff1 < 1e16, 'Absolute diff is acceptable');

    //     // //stETH给eigenStrategy
    //     // let eigenLSTRestakingBalance10 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     // console.log("eigenLSTRestakingBalance ether amount10:", eigenLSTRestakingBalance10.toString());
    //     // let eigenLSTRestakingBalance_stETH10 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
    //     // console.log("eigenLSTRestakingBalance_stETH10 ether amount:", eigenLSTRestakingBalance_stETH10.toString());

    //     // let strategy_balance10 = BigNumber(await web3.eth.getBalance(eigenStrategyAddr));
    //     // console.log("strategy_balance10 is : ", strategy_balance10.toString());
    //     // let strategy_balance_ETH10 = BigNumber(await stETH.balanceOf(eigenStrategyAddr));
    //     // console.log("strategy_balance_ETH10 is : ", strategy_balance_ETH10.toString());

    //     // assert.strictEqual(eigenLSTRestakingBalance.toString(), eigenLSTRestakingBalance10.toString());
    //     // assert.strictEqual(strategy_balance10.toString(), strategy_balance.toString());
    //     // diff = strategy_balance_ETH10.minus(strategy_balance_ETH1).minus(eigenLSTRestakingBalance_stETH1.minus(eigenLSTRestakingBalance_stETH10));
    //     // console.log("The diff between deposit and share is : ", diff.toString());
    //     // chai.assert.isTrue(diff < 100, 'Absolute diff is acceptable');


    // });

    // it("test13_depositIntoStrategy_delegate_instant withdraw_", async () => { });
    //it("test14_deposit_token swap(lido_add referral)", async () => { });
});
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


