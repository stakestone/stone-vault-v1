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
const testUser = "0x47d7f7Fa8288b9367Eb5fA4E50fD1017E99608B1"; // 2892 stone

const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const stoneAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
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
let valuesAfterSwapToEther;
let queueTx;
const provider = ethers.getDefaultProvider("http://localhost:7777");

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

const fundAccount = async (account, amountInETH) => {
    console.log(`fund Account ${account} with ${amountInETH}...`);
    const amountInWei = ethers.utils.parseEther(amountInETH.toString());

    await provider.send("anvil_setBalance", [
        account,
        amountInWei.toHexString()
    ]);

    console.log(`成功充值 ${amountInETH} ETH 到地址 ${account}`);
};

const advanceTimeAndBlock = async (timeInSeconds) => {
    console.log(`Advancing time by ${timeInSeconds} seconds...`);
    await web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_increaseTime", params: [timeInSeconds], id: Date.now() + Math.random() });
    await web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_mine", params: [], id: Date.now() + Math.random() });
};

const getEigenStrategyShares = async (eigenStrategyContract, account) => new BigNumber(await eigenStrategyContract.shares(account));
const sharesToUnderlying = async (eigenStrategyContract, shares) => {
    if (new BigNumber(shares).isZero()) return new BigNumber(0);
    return new BigNumber(await eigenStrategyContract.sharesToUnderlyingView(shares.toFixed(0)));
};

async function printAllValues(logPrefix = "", ...usersToLogReceipts) {
    console.log(`${logPrefix}--- VALUES ---`);
    const sv_currentSharePrice = await stoneVault.currentSharePrice.call();
    const sv_totalStoneSupply = await stoneToken.totalSupply();
    const sv_withdrawableAmountInPast = await stoneVault.withdrawableAmountInPast();
    const sv_withdrawingSharesInPast = await stoneVault.withdrawingSharesInPast();
    const sv_withdrawingSharesInRound = await stoneVault.withdrawingSharesInRound();
    const sv_latestRoundID = await stoneVault.latestRoundID();
    const sv_rebaseTime = await stoneVault.rebaseTime();
    console.log(`${logPrefix}StoneVault - Current Share Price:`, fromWei(sv_currentSharePrice).toString(10));
    console.log(`${logPrefix}StoneVault - Total Stone Supply:`, fromWei(sv_totalStoneSupply).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawable Amount (Past Rounds Total):`, fromWei(sv_withdrawableAmountInPast).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawing Shares (Past Rounds Total):`, fromWei(sv_withdrawingSharesInPast).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawing Shares (Current Round Total):`, fromWei(sv_withdrawingSharesInRound).toString(10));
    console.log(`${logPrefix}StoneVault - Latest Round ID: ${sv_latestRoundID.toString()}, Rebase Time: ${sv_rebaseTime.toString()}`);

    for (const user of usersToLogReceipts) {
        if (user.address && user.name) {
            const receipt = await stoneVault.userReceipts(user.address);
            console.log(`${logPrefix}StoneVault - User Receipt (${user.name} ${user.address}): Round=${receipt.withdrawRound}, Shares=${fromWei(receipt.withdrawShares)}, Amount=${fromWei(receipt.withdrawableAmount)}`);
        }
    }

    const sc_totalValue = await strategyController.getAllStrategiesValue.call();
    console.log(`${logPrefix}StrategyController - Total Value (from SC):`, fromWei(sc_totalValue).toString(10));

    const oEGLS_getAllValue = await originalEigenLSR.getAllValue.call();
    const oEGLS_getRestakingValue = await originalEigenLSR.getRestakingValue.call();
    const oEGLS_getUnstakingValue = await originalEigenLSR.getUnstakingValue.call();
    const oEGLS_stETHBalance = await stETH.balanceOf(originalEigenLSRAddr);
    const oEGLS_ETHBalance = await web3.eth.getBalance(originalEigenLSRAddr);
    console.log(`${logPrefix}Original oEGLS - Reported getAllValue:`, fromWei(oEGLS_getAllValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - ETH Balance:`, fromWei(oEGLS_ETHBalance).toString(10));
    console.log(`${logPrefix}Original oEGLS - stETH Balance (liquid):`, fromWei(oEGLS_stETHBalance).toString(10));
    console.log(`${logPrefix}Original oEGLS - Restaking Value (stETH in EL):`, fromWei(oEGLS_getRestakingValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - Unstaking Value (its internal view):`, fromWei(oEGLS_getUnstakingValue).toString(10));

    const pEGLS_getAllValue = await patchEigenLSR.getAllValue.call();
    const pEGLS_ETHBalance = await web3.eth.getBalance(eigenLSTRestakingPatchAddr);
    console.log(`${logPrefix}Patch pEGLS - Reported getAllValue:`, fromWei(pEGLS_getAllValue).toString(10));
    console.log(`${logPrefix}Patch pEGLS - ETH Balance (should be 0):`, fromWei(pEGLS_ETHBalance).toString(10));

    const assetsVault_ETHBalance = await web3.eth.getBalance(assetsVaultAddr);
    console.log(`${logPrefix}AssetsVault - ETH Balance:`, fromWei(assetsVault_ETHBalance).toString(10));
    console.log(`${logPrefix}----------------`);

    return {
        sv_currentSharePrice: safeToBN(sv_currentSharePrice),
        oEGLS_getAllValue: safeToBN(oEGLS_getAllValue),
        oEGLS_getRestakingValue: safeToBN(oEGLS_getRestakingValue),
        oEGLS_getUnstakingValue: safeToBN(oEGLS_getUnstakingValue),
        oEGLS_ETHBalance: safeToBN(oEGLS_ETHBalance),
        oEGLS_stETHBalance: safeToBN(oEGLS_stETHBalance),
        pEGLS_getAllValue: safeToBN(pEGLS_getAllValue),
        pEGLS_ETHBalance: safeToBN(pEGLS_ETHBalance)
    };
}

let stoneVault, stone, strategyController, originalEigenLSR, patchEigenLSR, stETH, stoneToken, eigenLayerStETHStrategy, originalEigenLSROwner;

module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };

    try {
        await fundAccount(deployer, 1000);
        await fundAccount(testUser, 10000);

        console.log("======== Test Case 3.1.1: Unsettled, New Large Withdraw (EL ETH is not Sufficient for new large part),add patch strategy,owner start queue withdraw... =========");
        // --- Initialize Contracts ---
        stone = await Stone.at(stoneAddr);
        stoneVault = await StoneVault.at(stoneVaultAddr);
        strategyController = await StrategyController.at(strategyControllerAddr);
        originalEigenLSR = await EigenLSTRestaking.at(originalEigenLSRAddr);
        patchEigenLSR = await EigenLSTRestakingPatch.at(eigenLSTRestakingPatchAddr);
        stETH = await IERC20.at(stETHAddr);
        stoneToken = await Stone.at(stoneAddr);
        eigenLayerStETHStrategy = await IEigenStrategy.at(eigenStrategyAddrForOEGLS);

        console.log("--- Step 0: Initial state ---");
        const initialState = await printAllValues("Initial State ");
        assert(fromWei(initialState.pEGLS_getAllValue).toString(10) === "0", "Initial patch getAllValue should be 0");
        const initialscValue = safeToBN(await strategyController.getAllStrategiesValue.call());

        console.log("--- Step 1: Deposit to Strategy ---");
        await impersonateAccount(deployer);
        let reservedAmount = toWei(100);
        let depositAmount = safeToBN(initialState.oEGLS_ETHBalance).minus(reservedAmount);
        console.log(`depositAmount is : ${depositAmount.toString(10)}`);

        await originalEigenLSR.swapToToken(depositAmount, { from: deployer });
        console.log("swapToToken success");
        const shares = await originalEigenLSR.depositIntoStrategy(depositAmount, { from: deployer });
        console.log("depositIntoStrategy success");

        // Check SC value no change after deposit to strategy
        const scValueAfterDepositIntoStrategy = safeToBN(await strategyController.getAllStrategiesValue.call());
        let diff = fromWei(scValueAfterDepositIntoStrategy).minus(fromWei(initialscValue)).abs();
        assert(
            diff.lte(tolerance),
            `scValueAfterDepositIntoStrategy差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        const AfterDepositIntoStrategy = await printAllValues("After Deposit Into Strategy ");
        diff = safeToBN(AfterDepositIntoStrategy.oEGLS_getRestakingValue)
            .minus(safeToBN(initialState.oEGLS_getRestakingValue))
            .minus(depositAmount)
            .abs();
        assert(
            diff.lte(tolerance),
            `AfterDepositIntoStrategy oEGLS_getRestakingValue差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        assert(fromWei(AfterDepositIntoStrategy.oEGLS_getUnstakingValue).toString(10) === "0", "AfterDepositIntoStrategy.oEGLS_getUnstakingValue should be 0");
        assert(AfterDepositIntoStrategy.oEGLS_ETHBalance.toString(10) === reservedAmount.toString(10), "AfterDepositIntoStrategy.oEGLS_ETHBalance is not correct");
        assert(fromWei(AfterDepositIntoStrategy.pEGLS_getAllValue).toString(10) === "0", "AfterDepositIntoStrategy patch getAllValue should be 0");
        assert(
            fromWei(AfterDepositIntoStrategy.oEGLS_stETHBalance).toString(10) === fromWei(initialState.oEGLS_stETHBalance).toString(10),
            `AfterDepositIntoStrategy.oEGLS_stETHBalance should be 0`
        );
        await stopImpersonatingAccount(deployer);

        console.log("--- Step 3: User withdraw a large amount ---");
        await impersonateAccount(testUser);
        let withdrawAmount = toWei(1000);
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: testUser
        });
        await stoneVault.requestWithdraw(withdrawAmount.toFixed(0), { from: testUser });
        let withdrawingSharesInRound = await stoneVault.withdrawingSharesInRound.call();
        console.log(`withdrawingSharesInRound is : ${fromWei(withdrawingSharesInRound).toString(10)}`);
        await stopImpersonatingAccount(testUser);

        console.log("--- Step 4: Owner initiates unstaking ---");
        const oeglsRestakedShares = safeToBN(await eigenLayerStETHStrategy.shares.call(originalEigenLSRAddr));
        console.log(`oEGLS shares in EigenLayer: ${fromWei(oeglsRestakedShares).toString(10)}`);

        if (oeglsRestakedShares.gt(0)) {
            const sharesToUnstake = oeglsRestakedShares.div(2).integerValue();
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

            valuesAfterUnstake = await printAllValues("After Unstaking ");
            const deltaPatch = fromWei(valuesAfterUnstake.pEGLS_getAllValue).minus(fromWei(AfterDepositIntoStrategy.pEGLS_getAllValue));
            const deltaOriginal = fromWei(AfterDepositIntoStrategy.oEGLS_getRestakingValue).minus(fromWei(valuesAfterUnstake.oEGLS_getRestakingValue));
            const absoluteDifference = deltaPatch.minus(deltaOriginal).abs();
            assert(
                absoluteDifference.lte(tolerance),
                `valuesAfterUnstake.pEGLS_getAllValue差值超出允许范围！实际差值: ${absoluteDifference.toString(10)}，允许最大值: ${tolerance.toString(10)}`
            );
            assert(fromWei(valuesAfterUnstake.oEGLS_getUnstakingValue).toString(10) === "0", "After Unstake oEGLS_getUnstakingValue should be 0");
            console.log("差值在允许范围内！");
        } else {
            console.warn("No shares to unstake, skipping unstaking step");
        }

        console.log("--- Step 5:completeQueuedWithdrawal --------");
        console.log("batch mining");
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

        const CompleteQueuedWithdrawal = await printAllValues("Complete Queued Withdrawal ");
        assert(
            CompleteQueuedWithdrawal.oEGLS_stETHBalance.gt(valuesAfterUnstake.oEGLS_stETHBalance),
            `CompleteQueuedWithdrawal.oEGLS_stETHBalanceis not correct`
        );
        assert(fromWei(CompleteQueuedWithdrawal.oEGLS_getUnstakingValue).toString(10) === "0", "CompleteQueuedWithdrawal.oEGLS_getUnstakingValue should be 0");
        assert(fromWei(CompleteQueuedWithdrawal.pEGLS_getAllValue).toString(10) === "0", "CompleteQueuedWithdrawal.pEGLS_getAllValue should be 0");
        assert(fromWei(CompleteQueuedWithdrawal.pEGLS_ETHBalance).toString(10) === "0", "CompleteQueuedWithdrawal.pEGLS_ETHBalance should be 0");

        const stETHAmount = CompleteQueuedWithdrawal.oEGLS_stETHBalance.toString(10);
        await originalEigenLSR.swapToEther(stETHAmount, { from: deployer });
        let etherAmount = BigNumber(await web3.eth.getBalance(originalEigenLSRAddr));
        console.log("swapToEther success, amount is: ", etherAmount.toString());

        // Convert values to BigNumber before calculation
        const stETHBalanceBN = safeToBN(CompleteQueuedWithdrawal.oEGLS_stETHBalance);
        const ethBalanceBN = safeToBN(AfterDepositIntoStrategy.oEGLS_ETHBalance);
        const totalToFund = stETHBalanceBN.plus(ethBalanceBN);

        await fundAccount(originalEigenLSRAddr, fromWei(totalToFund));

        valuesAfterSwapToEther = await printAllValues("After swap To Ether ");
        const expectedETHBalance = safeToBN(AfterDepositIntoStrategy.oEGLS_ETHBalance).plus(safeToBN(CompleteQueuedWithdrawal.oEGLS_stETHBalance));
        assert(
            expectedETHBalance.toString(10) === valuesAfterSwapToEther.oEGLS_ETHBalance.toString(10),
            "valuesAfterSwapToEther.oEGLS_ETHBalance is not correct"
        );
        assert(fromWei(valuesAfterSwapToEther.oEGLS_stETHBalance).lte(tolerance), "After valuesAfterSwapToEther oEGLS_stETHBalance should be 0");

        console.log("--- Step 6: Execute rollToNextRound ---");
        const rollTx = await stoneVault.rollToNextRound({
            from: deployer,
            gas: 3000000
        });
        console.log("Rebalance successful. TX:", rollTx.tx);
        valuesAfterRebalance = await printAllValues("After Rebalance ");

        const scValueAfterRebalance = safeToBN(await strategyController.getAllStrategiesValue.call());
        const expectedValue = scValueAfterDepositIntoStrategy.minus(withdrawingSharesInRound);
        assert(
            scValueAfterRebalance.minus(expectedValue).abs().lte(tolerance),
            `SC value should decrease by ${withdrawingSharesInRound.toString()}. ` +
            `Expected: ${expectedValue.toString()}, Actual: ${scValueAfterRebalance.toString()}`
        );
        console.log("scValueAfterRebalance Check success");
        assert(fromWei(valuesAfterRebalance.oEGLS_getUnstakingValue).toString(10) === "0", "valuesAfterRebalance.oEGLS_getUnstakingValue should be 0");
        assert(fromWei(valuesAfterRebalance.pEGLS_getAllValue).toString(10) === "0", "valuesAfterRebalance.pEGLS_getAllValue should be 0");

        diff = valuesAfterSwapToEther.oEGLS_getAllValue
            .minus(valuesAfterRebalance.oEGLS_getAllValue)
            .minus(withdrawingSharesInRound.times(el_ratio))
            .abs();
        assert(
            diff.lte(tolerance),
            `差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        diff = valuesAfterSwapToEther.oEGLS_ETHBalance
            .minus(valuesAfterRebalance.oEGLS_ETHBalance)
            .minus(withdrawingSharesInRound.times(el_ratio))
            .abs();
        assert(
            diff.lte(tolerance),
            `差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );

        diff = fromWei(valuesAfterRebalance.oEGLS_getRestakingValue).minus(fromWei(CompleteQueuedWithdrawal.oEGLS_getRestakingValue)).abs();
        assert(
            diff.lte(tolerance),
            `valuesAfterRebalance.oEGLS_getRestakingValue差值超出允许范围！实际差值: ${diff.toString(10)}，允许最大值: ${tolerance.toString(10)}`
        );
        assert(fromWei(valuesAfterRebalance.oEGLS_getUnstakingValue).toString(10) === "0", "After Rebalance.oEGLS_getUnstakingValue should be 0");
        assert(fromWei(valuesAfterRebalance.pEGLS_getAllValue).toString(10) === "0", "After Rebalance.pEGLS_getAllValue should be 0");

        console.log("======== Test Case 3.1.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 3.1.1: ${e.message}`, e);
        safeExit(e);
    }
};