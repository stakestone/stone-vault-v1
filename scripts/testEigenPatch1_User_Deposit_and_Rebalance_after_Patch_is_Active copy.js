// SPDX-License-Identifier: MIT
const BigNumber = require('bignumber.js');
const assert = require('assert');
const Abi = web3.eth.abi;
const ethers = require('ethers');

// --- Artifacts ---
const IERC20 = artifacts.require("IERC20");
const Stone = artifacts.require("Stone");
const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");

// --- Helper Functions ---
const toWei = (amount, decimals = 18) => new BigNumber(amount).times(new BigNumber(10).pow(decimals));
const fromWei = (amount, decimals = 18) => new BigNumber(amount.toString()).dividedBy(new BigNumber(10).pow(decimals));

const safeCall = async (contract, method, args = [], isView = true) => {
    try {
        if (isView) {
            return await contract.methods[method](...args).call();
        }
        return await contract[method](...args);
    } catch (e) {
        console.error(`Error calling ${method}:`, e);
        return isView ? '0' : null;
    }
};

const safeToBN = (value) => {
    if (value === undefined || value === null) return new BigNumber(0);
    try {
        return new BigNumber(value.toString());
    } catch (e) {
        console.error(`Failed to convert value to BigNumber:`, value);
        return new BigNumber(0);
    }
};

// --- Addresses ---
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const testUser = "0x22d130d251286e17b029d557d2928c5956efa8c4";

const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const stoneTokenAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
const assetsVaultAddr = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";

const originalEigenLSRAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddrForOEGLS = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";
const eigenLSTRestakingPatchAddr = "0xc13a36F134B5F08A39B1a972B7D2C934F6EE1c95";
const el_ratio = new BigNumber(0.87);
const tolerance = new BigNumber(100); // 100 wei tolerance
let valuesAfterUnstake;
let valuesAfterDeposit;
let valuesAfterRebalance;
let queueTx;
const queueAbi = {
    "inputs": [{
        "components": [{
            "internalType": "contract IStrategy[]",
            "name": "strategies",
            "type": "address[]"
        }, {
            "internalType": "uint256[]",
            "name": "depositShares",
            "type": "uint256[]"
        }, {
            "internalType": "address",
            "name": "__deprecated_withdrawer",
            "type": "address"
        }],
        "internalType": "struct IDelegationManagerTypes.QueuedWithdrawalParams[]",
        "name": "params",
        "type": "tuple[]"
    }],
    "name": "queueWithdrawals",
    "outputs": [{
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
    }],
    "stateMutability": "nonpayable",
    "type": "function"
};
const completeAbi = {
    "inputs": [{
        "components": [{
            "internalType": "address",
            "name": "staker",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "delegatedTo",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "withdrawer",
            "type": "address"
        }, {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
        }, {
            "internalType": "uint32",
            "name": "startBlock",
            "type": "uint32"
        }, {
            "internalType": "contract IStrategy[]",
            "name": "strategies",
            "type": "address[]"
        }, {
            "internalType": "uint256[]",
            "name": "scaledShares",
            "type": "uint256[]"
        }],
        "internalType": "struct IDelegationManagerTypes.Withdrawal",
        "name": "withdrawal",
        "type": "tuple"
    }, {
        "internalType": "contract IERC20[]",
        "name": "tokens",
        "type": "address[]"
    }, {
        "internalType": "bool",
        "name": "receiveAsTokens",
        "type": "bool"
    }],
    "name": "completeQueuedWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
};
const eventAbi = {
    "anonymous": false,
    "inputs": [{
        "indexed": false,
        "internalType": "bytes32",
        "name": "withdrawalRoot",
        "type": "bytes32"
    }, {
        "components": [{
            "internalType": "address",
            "name": "staker",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "delegatedTo",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "withdrawer",
            "type": "address"
        }, {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
        }, {
            "internalType": "uint32",
            "name": "startBlock",
            "type": "uint32"
        }, {
            "internalType": "contract IStrategy[]",
            "name": "strategies",
            "type": "address[]"
        }, {
            "internalType": "uint256[]",
            "name": "scaledShares",
            "type": "uint256[]"
        }],
        "indexed": false,
        "internalType": "struct IDelegationManagerTypes.Withdrawal",
        "name": "withdrawal",
        "type": "tuple"
    }, {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "sharesToWithdraw",
        "type": "uint256[]"
    }],
    "name": "SlashingWithdrawalQueued",
    "type": "event"
};
const impersonateAccount = async (account) => {
    console.log(`Impersonating ${account}...`);
    await web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "anvil_setBalance",
        params: [account, "0x56BC75E2D63100000"],
        id: Date.now()
    });
    await web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "anvil_impersonateAccount",
        params: [account],
        id: Date.now() + 1
    });
};

const stopImpersonatingAccount = async (account) => {
    console.log(`Stopping impersonation for ${account}...`);
    await web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "anvil_stopImpersonatingAccount",
        params: [account],
        id: Date.now()
    });
};

module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };

    try {
        console.log("======== Test Case 1.1.1: User Deposit and Rebalance after Patch is Active =========");

        // --- Get Contract Instances ---
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const strategyController = await StrategyController.at(strategyControllerAddr);
        const originalEigenLSR = await EigenLSTRestaking.at(originalEigenLSRAddr);
        const patchEigenLSR = await EigenLSTRestakingPatch.at(eigenLSTRestakingPatchAddr);
        const stETH = await IERC20.at(stETHAddr);
        const stoneToken = await Stone.at(stoneTokenAddr);
        const eigenLayerStETHStrategy = await IEigenStrategy.at(eigenStrategyAddrForOEGLS);

        // --- Helper to print all relevant values ---
        async function printAllValues(logPrefix = "") {
            console.log(`\n${logPrefix}--- VALUES ---`);

            let currentSharePrice;
            try {
                currentSharePrice = safeToBN(await stoneVault.currentSharePrice.call());
            } catch (e) {
                console.error("Error getting currentSharePrice:", e);
                currentSharePrice = new BigNumber(0);
            }
            console.log(`${logPrefix}StoneVault - Current Share Price:`, fromWei(currentSharePrice).toString(10));

            const totalStoneSupply = safeToBN(await stoneToken.totalSupply.call());
            console.log(`${logPrefix}StoneVault - Total Stone Supply:`, fromWei(totalStoneSupply).toString(10));

            let scTotalValue;
            try {
                scTotalValue = safeToBN(await strategyController.getAllStrategiesValue.call());
            } catch (e) {
                console.error("Error getting getAllStrategiesValue:", e);
                scTotalValue = new BigNumber(0);
            }
            console.log(`${logPrefix}StrategyController - Total Strategies Value (from SC):`, fromWei(scTotalValue).toString(10));

            const oEGLS_getAllValue = safeToBN(await originalEigenLSR.getAllValue.call());
            const oEGLS_getRestakingValue = safeToBN(await originalEigenLSR.getRestakingValue.call());
            const oEGLS_getUnstakingValue = safeToBN(await originalEigenLSR.getUnstakingValue.call());
            const oEGLS_stETHBalance = safeToBN(await stETH.balanceOf.call(originalEigenLSRAddr));
            const oEGLS_ETHBalance = safeToBN(await web3.eth.getBalance(originalEigenLSRAddr));

            let pendingAssets;
            try {
                pendingAssets = await originalEigenLSR.checkPendingAssets.call();
            } catch (e) {
                console.error("Error getting pendingAssets:", e);
                pendingAssets = [0, 0, 0];
            }

            const oEGLS_claimableValue = safeToBN(pendingAssets[1]);
            const oEGLS_pendingValue = safeToBN(pendingAssets[2]);

            console.log(`${logPrefix}Original oEGLS - Reported getAllValue:`, fromWei(oEGLS_getAllValue).toString(10));
            console.log(`${logPrefix}Original oEGLS - ETH Balance:`, fromWei(oEGLS_ETHBalance).toString(10));
            console.log(`${logPrefix}Original oEGLS - stETH Balance:`, fromWei(oEGLS_stETHBalance).toString(10));
            console.log(`${logPrefix}Original oEGLS - Restaking Value:`, fromWei(oEGLS_getRestakingValue).toString(10));
            console.log(`${logPrefix}Original oEGLS - Unstaking Value:`, fromWei(oEGLS_getUnstakingValue).toString(10));
            console.log(`${logPrefix}Original oEGLS - lido claimable ETH Value:`, fromWei(oEGLS_claimableValue).toString(10));
            console.log(`${logPrefix}Original oEGLS - lido pending stETH Value:`, fromWei(oEGLS_pendingValue).toString(10));

            const pEGLS_getAllValue = safeToBN(await patchEigenLSR.getAllValue.call());
            const pEGLS_ETHBalance = safeToBN(await web3.eth.getBalance(eigenLSTRestakingPatchAddr));

            console.log(`${logPrefix}Patch pEGLS - Reported getAllValue:`, fromWei(pEGLS_getAllValue).toString(10));
            console.log(`${logPrefix}Patch pEGLS - ETH Balance:`, fromWei(pEGLS_ETHBalance).toString(10));

            const assetsVaultEthBalance = safeToBN(await web3.eth.getBalance(assetsVaultAddr));
            console.log(`${logPrefix}AssetsVault - ETH Balance:`, fromWei(assetsVaultEthBalance).toString(10));

            console.log(`${logPrefix}----------------`);

            return {
                currentSharePrice,
                scTotalValue,
                oEGLS_getAllValue,
                oEGLS_getRestakingValue,
                oEGLS_getUnstakingValue,
                oEGLS_ETHBalance,
                oEGLS_stETHBalance,
                pEGLS_getAllValue,
                pEGLS_ETHBalance
            };
        }

        console.log("\n--- Step 0: Initial state ---");
        const initialState = await printAllValues("Initial State ");
        assert(fromWei(initialState.pEGLS_getAllValue).toString(10) === "0", "Initial patch getAllValue should be 0");

        // --- Step 1: Owner initiates unstaking ---
        console.log("\n--- Step 1: Owner initiates unstaking ---");

        const oeglsRestakedShares = safeToBN(await eigenLayerStETHStrategy.shares.call(originalEigenLSRAddr));
        console.log(`oEGLS shares in EigenLayer: ${fromWei(oeglsRestakedShares).toString(10)}`);

        if (oeglsRestakedShares.gt(0)) {
            const sharesToUnstake = oeglsRestakedShares.div(10).integerValue();
            console.log(`Unstaking ${fromWei(sharesToUnstake).toString(10)} shares`);

            await impersonateAccount(deployer);

            const queueData = web3.eth.abi.encodeFunctionCall(queueAbi, [
                [{
                    strategies: [eigenStrategyAddrForOEGLS],
                    depositShares: [sharesToUnstake.toString(10)],
                    __deprecated_withdrawer: originalEigenLSRAddr
                }]
            ]);

            queueTx = await originalEigenLSR.invoke(
                delegationManagerAddr,
                queueData,
                { from: deployer, gas: 500000 }
            );
            console.log("Unstaking queued. TX:", queueTx.tx);

            await stopImpersonatingAccount(deployer);

            valuesAfterUnstake = await printAllValues("After Unstaking ");
            const deltaPatch = fromWei(valuesAfterUnstake.pEGLS_getAllValue).minus(fromWei(initialState.pEGLS_getAllValue));
            const deltaOriginal = fromWei(initialState.oEGLS_getRestakingValue).minus(fromWei(valuesAfterUnstake.oEGLS_getRestakingValue));

            const absoluteDifference = deltaPatch.minus(deltaOriginal).abs();

            assert(
                absoluteDifference.lte(tolerance),
                `差值超出允许范围！实际差值: ${absoluteDifference.toString(10)}，允许最大值: ${tolerance.toString(10)}`
            );
            assert(fromWei(valuesAfterUnstake.oEGLS_getUnstakingValue).toString(10) === "0", "After Unstake oEGLS_getUnstakingValue should be 0");

            console.log("差值在允许范围内！");
        } else {
            console.warn("No shares to unstake, skipping unstaking step");
        }

        // --- Step 2: User deposits ETH ---
        console.log("\n--- Step 2: User deposits 1 ETH ---");

        const depositAmount = toWei(1);
        const initialSharePrice = (await printAllValues("Before Deposit ")).currentSharePrice;
        const initialScValue = safeToBN(await strategyController.getAllStrategiesValue.call());

        await impersonateAccount(testUser);
        const depositTx = await stoneVault.deposit({
            from: testUser,
            value: depositAmount.toString()
        });
        console.log("Deposit successful. TX:", depositTx.tx);
        await stopImpersonatingAccount(testUser);

        valuesAfterDeposit = await printAllValues("After Deposit ");

        // Check share price stability
        assert(
            fromWei(valuesAfterDeposit.currentSharePrice).gte(fromWei(initialSharePrice).times(0.9999)) &&
            fromWei(valuesAfterDeposit.currentSharePrice).lte(fromWei(initialSharePrice).times(1.0001)),
            "Share price changed too much after deposit"
        );

        // Check SC value unchanged before rebalance
        const scValueAfterDeposit = safeToBN(await strategyController.getAllStrategiesValue.call());
        assert(
            scValueAfterDeposit.eq(initialScValue),
            `SC value should not change before rebalance. Before: ${initialScValue.toString()}, After: ${scValueAfterDeposit.toString()}`
        );

        console.log("\n--- Step 3: Execute rollToNextRound ---");
        await impersonateAccount(deployer);

        // Advance time if needed
        const rebaseTime = safeToBN(await stoneVault.rebaseTime.call());
        const rebaseInterval = safeToBN(await stoneVault.rebaseTimeInterval.call());
        let currentTime = safeToBN((await web3.eth.getBlock('latest')).timestamp);

        if (currentTime.lt(rebaseTime.plus(rebaseInterval))) {
            const timeNeeded = rebaseTime.plus(rebaseInterval).minus(currentTime).plus(5).toNumber();
            console.log(`Advancing time by ${timeNeeded} seconds`);
            await web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [timeNeeded],
                id: 0
            });
            await web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [],
                id: 0
            });
        }

        const rollTx = await stoneVault.rollToNextRound({
            from: deployer,
            gas: 3000000
        });
        console.log("Rebalance successful. TX:", rollTx.tx);
        await stopImpersonatingAccount(deployer);

        valuesAfterRebalance = await printAllValues("After Rebalance ");
        // Check SC value increased by deposit amount
        const scValueAfterRebalance = safeToBN(await strategyController.getAllStrategiesValue.call());
        const expectedValue = initialScValue.plus(depositAmount);
        console.log("Value Check:");
        assert(
            scValueAfterRebalance.minus(expectedValue).abs().lte(tolerance),
            `SC value should increase by ${depositAmount.toString()}. ` +
            `Expected: ${expectedValue.toString()}, Actual: ${scValueAfterRebalance.toString()}`
        );
        // pEGLS_getAllValue expect no change after rebalance
        let diff = fromWei(valuesAfterUnstake.pEGLS_getAllValue).minus(fromWei(valuesAfterRebalance.pEGLS_getAllValue)).abs();
        assert(
            diff.lte(tolerance),
            `差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        // oEGLS_getAllValue/oEGLS_ETHBalance expect change after rebalance
        diff = valuesAfterRebalance.oEGLS_getAllValue
            .minus(valuesAfterUnstake.oEGLS_getAllValue)
            .minus(depositAmount.times(el_ratio))
            .abs();
        assert(
            diff.lte(tolerance),
            `差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        diff = valuesAfterRebalance.oEGLS_ETHBalance
            .minus(valuesAfterUnstake.oEGLS_ETHBalance)
            .minus(depositAmount.times(el_ratio))
            .abs();
        assert(
            diff.lte(tolerance),
            `差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        // oEGLS_getRestakingValue expect no change after rebalance
        diff = fromWei(valuesAfterRebalance.oEGLS_getRestakingValue).minus(fromWei(valuesAfterUnstake.oEGLS_getRestakingValue)).abs();
        assert(
            diff.lte(tolerance),
            `差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        assert(fromWei(valuesAfterRebalance.oEGLS_getUnstakingValue).toString(10) === "0", "After Rebalance.oEGLS_getUnstakingValue should be 0");

        console.log("\n--- Step 4: depositToStrategy ---");
        await impersonateAccount(deployer);
        await originalEigenLSR.swapToToken(depositAmount.times(el_ratio), { from: deployer });
        console.log("swapToToken success");
        const shares = await originalEigenLSR.depositIntoStrategy(depositAmount.times(el_ratio).div(2), { from: deployer });
        console.log("depositIntoStrategy success");

        // Check SC value no change after deposit to strategy
        const scValueAfterDepositIntoStrategy = safeToBN(await strategyController.getAllStrategiesValue.call());
        diff = fromWei(scValueAfterDepositIntoStrategy).minus(fromWei(scValueAfterRebalance)).abs();
        assert(
            diff.lte(tolerance),
            `scValueAfterDepositIntoStrategy差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        const AfterDepositIntoStrategy = await printAllValues("After Deposit Into Strategy ");
        // oEGLS_getRestakingValue expect increase after rebalance
        diff = AfterDepositIntoStrategy.oEGLS_getRestakingValue
            .minus(valuesAfterRebalance.oEGLS_getRestakingValue)
            .minus(depositAmount.times(el_ratio).div(2))
            .abs();
        assert(
            diff.lte(tolerance),
            `oEGLS_getRestakingValue差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        assert(fromWei(AfterDepositIntoStrategy.oEGLS_getUnstakingValue).toString(10) === "0", "AfterDepositIntoStrategy.oEGLS_getUnstakingValue should be 0");
        assert(valuesAfterRebalance.oEGLS_ETHBalance
            .gt(AfterDepositIntoStrategy.oEGLS_ETHBalance), "AfterDepositIntoStrategy oEGLS_ETHBalance is not correct");

        diff = fromWei(AfterDepositIntoStrategy.pEGLS_getAllValue).minus(fromWei(valuesAfterRebalance.pEGLS_getAllValue)).abs();
        assert(
            diff.lte(tolerance),
            `pEGLS_getAllValue差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        diff = AfterDepositIntoStrategy.oEGLS_stETHBalance
            .minus(valuesAfterRebalance.oEGLS_stETHBalance)
            .minus(depositAmount.times(el_ratio).div(2))
            .abs();
        assert(
            diff.lte(tolerance),
            `AfterDepositIntoStrategy.oEGLS_stETHBalance差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        console.log("-------- completeQueuedWithdrawal --------");
        const provider = ethers.getDefaultProvider("http://localhost:7777");

        // 延时100800块
        console.log("batch mining");
        // 分批处理
        const batchSize = 10080;
        const batches = 10;
        for (let i = 0; i < batches; i++) {
            await provider.send("anvil_mine", [batchSize.toString()]);
            console.log(`Mined ${(i + 1) * batchSize} blocks`);
        }
        const withdrawTxHash = queueTx.tx;
        const txResult = await web3.eth.getTransactionReceipt(withdrawTxHash);
        let topic = "0x26b2aae26516e8719ef50ea2f6831a2efbd4e37dccdf0f6936b27bc08e793e30";

        let log;
        for (var i = 0; i < txResult.logs.length; i++) {
            if (txResult.logs[i].topics[0] == topic) {
                log = txResult.logs[i];
            }
        }

        let decodedEvent = Abi.decodeParameters(eventAbi.inputs, log.data);
        let completeData = web3.eth.abi.encodeFunctionCall(completeAbi, [
            {
                staker: decodedEvent.withdrawal.staker,
                delegatedTo: decodedEvent.withdrawal.delegatedTo,
                withdrawer: decodedEvent.withdrawal.withdrawer,
                nonce: decodedEvent.withdrawal.nonce,
                startBlock: decodedEvent.withdrawal.startBlock,
                strategies: decodedEvent.withdrawal.strategies,
                scaledShares: decodedEvent.withdrawal.scaledShares,
            },
            [stETHAddr],
            true,
        ]);

        await originalEigenLSR.invoke(delegationManagerAddr, completeData,
            { from: deployer }
        );
        console.log("completeQueuedWithdrawal success");

        const CompleteQueuedWithdrawal = await printAllValues("CompleteQueuedWithdrawal");
        // oEGLS_stETHBalance expect increase after rebalance
        assert(
            CompleteQueuedWithdrawal.oEGLS_stETHBalance.gt(AfterDepositIntoStrategy.oEGLS_stETHBalance),
            `ompleteQueuedWithdrawal.oEGLS_stETHBalanceis not correct`
        );
        assert(fromWei(CompleteQueuedWithdrawal.oEGLS_getUnstakingValue).toString(10) === "0", "CompleteQueuedWithdrawal.oEGLS_getUnstakingValue should be 0");
        assert(fromWei(CompleteQueuedWithdrawal.pEGLS_getAllValue).toString(10) === "0", "CompleteQueuedWithdrawal.pEGLS_getAllValue should be 0");
        assert(fromWei(CompleteQueuedWithdrawal.pEGLS_ETHBalance).toString(10) === "0", "CompleteQueuedWithdrawal.pEGLS_ETHBalance should be 0");

        // Check SC value increased by deposit amount
        const scValueFinal = safeToBN(await strategyController.getAllStrategiesValue.call());
        assert(
            scValueFinal.eq(initialScValue.plus(depositAmount)),
            `SC value should not change after deposit to strategy.`
        );
        console.log("SC Value Check success");
        console.log("\n======== Test Case 1.1.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error("Error in test case:", e);
        safeExit(e);
    }
};