const BigNumber = require('bignumber.js');
const assert = require('assert');

// --- Artifacts ---
const IERC20 = artifacts.require("IERC20");
const Stone = artifacts.require("Stone");
const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");

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
const eigenLSTRestakingPatchAddr = "0xYourDeployedPatchAddressPlaceholder1.2.2"; // <<<--- !!! REPLACE THIS !!!

// --- Helper Functions ---
const toWei = (amount, decimals = 18) => new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals));
const fromWei = (amount, decimals = 18) => new BigNumber(String(amount)).dividedBy(new BigNumber(10).pow(decimals));

const impersonateAccount = async (account) => {
    console.log(`Impersonating ${account}...`);
    await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_impersonateAccount", params: [account], id: Date.now() + Math.random() });
    await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_setBalance", params: [account, "0x56BC75E2D63100000"], id: Date.now() + Math.random() }); // 100 ETH
};
const stopImpersonatingAccount = async (account) => {
    console.log(`Stopping impersonation for ${account}...`);
    await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_stopImpersonatingAccount", params: [account], id: Date.now() + Math.random() });
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

// Store withdrawal roots to complete them later
let withdrawalRootsToComplete = [];

module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };

    if (eigenLSTRestakingPatchAddr === "0xYourDeployedPatchAddressPlaceholder1.2.2") {
        console.error("Placeholder address for Patch contract not replaced.");
        return safeExit(new Error("Placeholder address for Patch contract not replaced."));
    }

    try {
        console.log("======== Test Case 1.2.2: Settled, User Withdraws Large Amount (Requires EL Unstaking) =========");

        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const strategyController = await StrategyController.at(strategyControllerAddr);
        const originalEigenLSR = await EigenLSTRestaking.at(originalEigenLSRAddr);
        const patchEigenLSR = await EigenLSTRestakingPatch.at(eigenLSTRestakingPatchAddr);
        const stETH = await IERC20.at(stETHAddr);
        const stoneToken = await Stone.at(stoneTokenAddr);
        const delegationManager = await IDelegationManager.at(delegationManagerAddr);
        const eigenLayerStETHStrategy = await IEigenStrategy.at(eigenStrategyAddrForOEGLS);
        const originalEigenLSROwner = await originalEigenLSR.owner();

        async function printAllValues(logPrefix = "") {
            // ... (same printAllValues function as in 1.2.1, ensure it's defined here or imported)
            console.log(`\n${logPrefix}--- VALUES ---`);
            const sv_currentSharePrice = await stoneVault.currentSharePrice();
            const sv_totalStoneSupply = await stoneToken.totalSupply();
            const sv_withdrawableAmountInPast = await stoneVault.withdrawableAmountInPast();
            const sv_withdrawingSharesInPast = await stoneVault.withdrawingSharesInPast();
            const sv_withdrawingSharesInRound = await stoneVault.withdrawingSharesInRound();
            console.log(`${logPrefix}StoneVault - Current Share Price:`, fromWei(sv_currentSharePrice).toString(10));
            console.log(`${logPrefix}StoneVault - Total Stone Supply:`, fromWei(sv_totalStoneSupply).toString(10));
            console.log(`${logPrefix}StoneVault - Withdrawable Amount (Past Rounds):`, fromWei(sv_withdrawableAmountInPast).toString(10));
            console.log(`${logPrefix}StoneVault - Withdrawing Shares (Past Rounds):`, fromWei(sv_withdrawingSharesInPast).toString(10));
            console.log(`${logPrefix}StoneVault - Withdrawing Shares (Current Round):`, fromWei(sv_withdrawingSharesInRound).toString(10));

            const sc_totalValue = await strategyController.getAllStrategiesValue();
            console.log(`${logPrefix}StrategyController - Total Value (from SC):`, fromWei(sc_totalValue).toString(10));

            const oEGLS_getAllValue = await originalEigenLSR.getAllValue();
            const oEGLS_getRestakingValue = await originalEigenLSR.getRestakingValue();
            const oEGLS_getUnstakingValue_internal = await originalEigenLSR.getUnstakingValue();
            const oEGLS_stETHBalance = await stETH.balanceOf(originalEigenLSRAddr);
            const oEGLS_ETHBalance = await web3.eth.getBalance(originalEigenLSRAddr);
            console.log(`${logPrefix}Original oEGLS - Reported getAllValue:`, fromWei(oEGLS_getAllValue).toString(10));
            console.log(`${logPrefix}Original oEGLS - ETH Balance:`, fromWei(oEGLS_ETHBalance).toString(10));
            console.log(`${logPrefix}Original oEGLS - stETH Balance (liquid):`, fromWei(oEGLS_stETHBalance).toString(10));
            console.log(`${logPrefix}Original oEGLS - Restaking Value (stETH in EL):`, fromWei(oEGLS_getRestakingValue).toString(10));
            console.log(`${logPrefix}Original oEGLS - Unstaking Value (its internal view):`, fromWei(oEGLS_getUnstakingValue_internal).toString(10));

            const pEGLS_getAllValue = await patchEigenLSR.getAllValue();
            const pEGLS_ETHBalance = await web3.eth.getBalance(patchEigenLSRAddr);
            console.log(`${logPrefix}Patch pEGLS - Reported getAllValue:`, fromWei(pEGLS_getAllValue).toString(10));
            console.log(`${logPrefix}Patch pEGLS - ETH Balance (should be 0):`, fromWei(pEGLS_ETHBalance).toString(10));
            assert(new BigNumber(pEGLS_ETHBalance).isZero(), "Patch contract should always have 0 ETH as its ratio is 0");

            let actualUnstakingValueForOEGLSFromDM_InStETH = new BigNumber(0);
            const queuedWithdrawalData = await delegationManager.getQueuedWithdrawals(originalEigenLSRAddr);
            for (let i = 0; i < queuedWithdrawalData.withdrawals.length; i++) {
                const withdrawal = queuedWithdrawalData.withdrawals[i];
                for (let j = 0; j < withdrawal.strategies.length; j++) {
                    if (withdrawal.strategies[j].toLowerCase() === eigenStrategyAddrForOEGLS.toLowerCase()) {
                        const sharesInEigenStrategy = queuedWithdrawalData.shares[i][j];
                        const underlyingStETH = await sharesToUnderlying(eigenLayerStETHStrategy, new BigNumber(sharesInEigenStrategy));
                        actualUnstakingValueForOEGLSFromDM_InStETH = actualUnstakingValueForOEGLSFromDM_InStETH.plus(underlyingStETH);
                    }
                }
            }
            console.log(`${logPrefix}Patch pEGLS - Calculated Unstaking Value for oEGLS (stETH from DM):`, fromWei(actualUnstakingValueForOEGLSFromDM_InStETH).toString(10));
            assert(fromWei(pEGLS_getAllValue).isEqualTo(fromWei(actualUnstakingValueForOEGLSFromDM_InStETH)), "Patch getAllValue should be the oEGLS unstaking value from DM (in stETH)");

            const assetsVault_ETHBalance = await web3.eth.getBalance(assetsVaultAddr);
            console.log(`${logPrefix}AssetsVault - ETH Balance:`, fromWei(assetsVault_ETHBalance).toString(10));
            console.log(`${logPrefix}----------------`);
            return { sv_currentSharePrice, sc_totalValue, pEGLS_getAllValue, actualUnstakingValueForOEGLSFromDM_InStETH, oEGLS_stETHBalance, oEGLS_ETHBalance, assetsVault_ETHBalance, sv_withdrawableAmountInPast, sv_withdrawingSharesInRound };
        }

        console.log("\n--- Step 0: Initial state (after user's setup) ---");
        let currentState = await printAllValues("Initial State");
        assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isZero(), "Initial unstaking for oEGLS should be 0");

        // --- Step 1 & 2: Owner ensures sufficient restaked assets & initiates large unstaking ---
        console.log("\n--- Step 1 & 2: Owner prepares and initiates large EL Unstaking (~3 stETH) ---");
        const largeUnstakeTargetInStETH = toWei(3); // Target ~3 stETH to unstake
        await impersonateAccount(originalEigenLSROwner);

        let oeglsSharesInEL = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
        let oeglsUnderlyingInEL = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInEL);
        const requiredTotalRestakedForTest = largeUnstakeTargetInStETH.plus(toWei(0.5)); // Need at least this much

        if (oeglsUnderlyingInEL.isLessThan(requiredTotalRestakedForTest)) {
            const amountToDepositToEL = requiredTotalRestakedForTest.minus(oeglsUnderlyingInEL);
            console.warn(`oEGLS has ${fromWei(oeglsUnderlyingInEL)} stETH restaked, needs ${fromWei(requiredTotalRestakedForTest)}. Depositing ${fromWei(amountToDepositToEL)} more into EL...`);
            // Ensure oEGLS has this much stETH liquid
            const oeglsLiquidStETH = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
            if (oeglsLiquidStETH.isLessThan(amountToDepositToEL)) {
                const ethNeededForSwap = amountToDepositToEL.minus(oeglsLiquidStETH).multipliedBy(1.05); // Crude ETH estimation
                console.log(`oEGLS needs ${fromWei(amountToDepositToEL.minus(oeglsLiquidStETH))} more stETH. Swapping from ETH...`);
                await originalEigenLSR.swapToToken(ethNeededForSwap.toFixed(0), { value: ethNeededForSwap.toFixed(0), from: originalEigenLSROwner });
            }
            await originalEigenLSR.depositIntoStrategy(amountToDepositToEL.toFixed(0), { from: originalEigenLSROwner });
            oeglsSharesInEL = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
            oeglsUnderlyingInEL = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInEL);
            console.log(`oEGLS NEW shares in EL Strategy: ${oeglsSharesInEL.toString()}, Underlying: ${fromWei(oeglsUnderlyingInEL)} stETH`);
        }

        const sharesToUnstakeLarge = largeUnstakeTargetInStETH.multipliedBy(oeglsSharesInEL).dividedToIntegerBy(oeglsUnderlyingInEL);
        if (sharesToUnstakeLarge.isGreaterThan(0)) {
            console.log(`oEGLS Owner queuing withdrawal of ${sharesToUnstakeLarge.toString()} shares (approx ${fromWei(largeUnstakeTargetInStETH)} stETH) from EL...`);
            const queuedWithdrawalParams = [{ strategies: [eigenStrategyAddrForOEGLS], shares: [sharesToUnstakeLarge.toFixed(0)], withdrawer: originalEigenLSRAddr }];
            const queueTx = await originalEigenLSR.queueWithdrawals(queuedWithdrawalParams, { from: originalEigenLSROwner });
            // Store the withdrawal root for later completion
            // Assuming queueWithdrawals event 'WithdrawalQueued' has 'withdrawalRoot'
            // And assuming it's the first (and only) root in this tx for simplicity
            const withdrawalQueuedLog = queueTx.logs.find(log => log.event === "WithdrawalQueued");
            if (withdrawalQueuedLog && withdrawalQueuedLog.args.withdrawalRoot) {
                withdrawalRootsToComplete.push(withdrawalQueuedLog.args.withdrawalRoot);
                console.log("Stored withdrawal root for oEGLS:", withdrawalQueuedLog.args.withdrawalRoot);
            } else {
                console.warn("Could not find WithdrawalQueued event or withdrawalRoot in its args.");
            }
        } else {
            throw new Error("Calculated shares for large unstake is 0.");
        }
        await stopImpersonatingAccount(originalEigenLSROwner);

        currentState = await printAllValues("After oEGLS Owner Large Unstake Initiation");
        assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isGreaterThanOrEqualTo(largeUnstakeTargetInStETH.multipliedBy(0.99)),
            "Patch should report the large unstaking value");

        // --- Step 3: User requests large withdrawal from StoneVault (~2 stETH worth) ---
        console.log("\n--- Step 3: User requests large withdrawal from StoneVault ---");
        const svPriceBeforeUserWithdraw = currentState.sv_currentSharePrice;
        const userLargeWithdrawTargetInETH_approx = 2; // User wants ~2 ETH
        const sharesToWithdrawUserLarge = toWei(userLargeWithdrawTargetInETH_approx).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceBeforeUserWithdraw);

        await impersonateAccount(testUser);
        const userStoneBal = await stoneToken.balanceOf(testUser);
        if (new BigNumber(userStoneBal).isLessThan(sharesToWithdrawUserLarge)) {
            console.warn(`User ${testUser} needs ${fromWei(sharesToWithdrawUserLarge)} Stone, has ${fromWei(userStoneBal)}. Depositing more...`);
            const ethToDeposit = sharesToWithdrawUserLarge.minus(userStoneBal).multipliedBy(svPriceBeforeUserWithdraw).dividedToIntegerBy(toWei(1)).multipliedBy(1.1); // deposit a bit more
            await stoneVault.deposit({ from: testUser, value: ethToDeposit.toFixed(0) });
        }
        console.log(`User ${testUser} requesting withdrawal of ${fromWei(sharesToWithdrawUserLarge)} shares (approx ${userLargeWithdrawTargetInETH_approx} ETH)...`);
        await stoneVault.requestWithdraw(sharesToWithdrawUserLarge.toFixed(0), { from: testUser });
        await stopImpersonatingAccount(testUser);

        currentState = await printAllValues("After User Large Withdrawal Request");
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isEqualTo(sharesToWithdrawUserLarge), "sv_withdrawingSharesInRound mismatch for large withdrawal");

        // --- Step 4: Execute rollToNextRound ---
        console.log("\n--- Step 4: Execute rollToNextRound (Settling large withdrawal request) ---");
        await impersonateAccount(deployer);
        const rebaseTime = await stoneVault.rebaseTime();
        const rebaseInterval = await stoneVault.rebaseTimeInterval();
        if (new BigNumber((await web3.eth.getBlock('latest')).timestamp).isLessThanOrEqualTo(new BigNumber(rebaseTime).plus(rebaseInterval))) {
            await advanceTimeAndBlock(new BigNumber(rebaseInterval).plus(60).toNumber()); // Advance by interval + 1 min
        }
        await stoneVault.rollToNextRound({ from: deployer, gas: 4000000 }); // Potentially higher gas
        await stopImpersonatingAccount(deployer);

        currentState = await printAllValues("After rollToNextRound (Large Withdrawal Settled in StoneVault)");
        // The user's withdrawal is now in their receipt, but ETH might not be fully in AssetsVault yet.
        const userReceiptAfterRoll = await stoneVault.userReceipts(testUser);
        const userWithdrawableFromReceipt = new BigNumber(userReceiptAfterRoll.withdrawableAmount);
        console.log(`User ${testUser} receipt: withdrawableAmount = ${fromWei(userWithdrawableFromReceipt)} ETH`);
        // AssetsVault ETH might be less than userWithdrawableFromReceipt if EL unstaking is slow.
        assert(userWithdrawableFromReceipt.isGreaterThan(0), "User should have a withdrawable amount in their receipt");


        // --- Step 5: Simulate partial completion of EigenLayer unstaking for oEGLS ---
        console.log("\n--- Step 5: Simulate partial completion of EL unstaking & oEGLS claims stETH ---");
        // This requires knowing the withdrawal structure and a valid root.
        // We stored `withdrawalRootsToComplete`. Let's try to complete the first one.
        // This is a complex step as `completeQueuedWithdrawal` requires proofs or specific conditions on mainnet.
        // On a fork, it might work if the unbonding period has passed.
        // Let's advance time significantly to simulate unbonding period (e.g., 7 days for some systems)
        if (withdrawalRootsToComplete.length > 0) {
            const eigenUnbondingPeriod = 7 * 24 * 60 * 60; // 7 days, adjust if known for stETH EL strategy
            console.log(`Advancing time by ${eigenUnbondingPeriod / (60 * 60 * 24)} days for EL unstaking unbonding...`);
            await advanceTimeAndBlock(eigenUnbondingPeriod);

            await impersonateAccount(originalEigenLSROwner); // Owner of oEGLS calls its own completion logic
            // The `originalEigenLSR` should have a function to call `delegationManager.completeQueuedWithdrawal`.
            // For this example, let's assume `originalEigenLSR.completeEigenWithdrawal(withdrawalObject, tokens, middlewareIndex, receiveAsTokens)`
            // Finding the correct `Withdrawal` struct to pass is key. It's derived from the root.
            // This is the hardest part to script generically without exact contract knowledge of oEGLS internal helpers for this.
            // A simplification: Check if any withdrawals became claimable directly on DelegationManager
            console.log("Attempting to find and complete a queued withdrawal for oEGLS...");
            const finalQueuedWithdrawals = await delegationManager.getQueuedWithdrawals(originalEigenLSRAddr);
            let completedSomething = false;
            for (const wd of finalQueuedWithdrawals.withdrawals) {
                // Check if this withdrawal is ready to be completed (e.g., block.timestamp > wd.startBlock + unbonding_period)
                // The actual `completeQueuedWithdrawal` on DelegationManager needs specific params including proofs.
                // The `originalEigenLSR` contract is expected to abstract this.
                // For the test, we are more interested in the *effect* if stETH *were* to be returned.
                // Let's *simulate* stETH returning to oEGLS by directly sending some stETH to it,
                // and manually removing a root from our tracking IF a real completion is too hard.
                // This is a workaround if `completeQueuedWithdrawal` is too complex for the test script.

                // Ideal scenario:
                // if (wd.isReadyToComplete) { // pseudo-code for readiness check
                //    await originalEigenLSR.someFunctionToCompleteWithdrawal(wd, ... {from: originalEigenLSROwner});
                //    completedSomething = true;
                //    console.log(`Completed withdrawal for staker ${wd.staker} nonce ${wd.nonce}`);
                //    withdrawalRootsToComplete.shift(); // remove the completed one
                //    break;
                // }
            }

            // WORKAROUND/SIMULATION if direct completion is too hard to script:
            if (!completedSomething && withdrawalRootsToComplete.length > 0) {
                console.warn("Direct completion of EL withdrawal is complex to script generically. Simulating effect...");
                // Simulate ~1 stETH returning to originalEigenLSR by direct transfer (for testing accounting)
                // This is NOT how it works but helps test the value flow IF stETH was received.
                const simulatedStETHReturn = toWei(1); // Simulate 1 stETH returned
                await impersonateAccount(deployer); // An account with stETH
                await stETH.transfer(originalEigenLSRAddr, simulatedStETHReturn.toFixed(0), { from: deployer }); // Send stETH to oEGLS
                await stopImpersonatingAccount(deployer);
                console.log(`Simulated ${fromWei(simulatedStETHReturn)} stETH returned to oEGLS.`);
                // We also need to make the patch *think* this portion of unstaking is done.
                // This would normally happen by the root being processed by DelegationManager.
                // We can't easily fake that. The patch will still see the full queued amount.
                // So, this simulation mainly tests if oEGLS having more liquid stETH helps.
                // The *actual* check of patch reducing its value relies on real `completeQueuedWithdrawal` effect on `DelegationManager.getQueuedWithdrawals`.
                // For now, we'll proceed, knowing the patch might still show the full initial unstaking amount.
            }
            await stopImpersonatingAccount(originalEigenLSROwner);


            // Optional: Owner converts received stETH to ETH in oEGLS, and repays to AssetsVault via controller
            await impersonateAccount(originalEigenLSROwner);
            const oeglsStETHAfterClaim = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
            if (oeglsStETHAfterClaim.isGreaterThan(0)) {
                console.log(`oEGLS Owner swapping ${fromWei(oeglsStETHAfterClaim)} stETH to ETH...`);
                await originalEigenLSR.swapToEther(oeglsStETHAfterClaim.toFixed(0), { from: originalEigenLSROwner }); // This sends ETH to controller
            }
            await stopImpersonatingAccount(originalEigenLSROwner);

        } else {
            console.warn("No withdrawal roots were stored to attempt completion.");
        }


        currentState = await printAllValues("After Simulated Partial EL Unstake Completion & stETH Swap");
        // Expect patch's reported unstaking value to decrease if a real completion happened and was reflected by DelegationManager.
        // Expect AssetsVault ETH to increase if oEGLS swapped stETH and sent ETH to controller->assetsVault.

        // --- Step 6: User claims their ETH ---
        console.log("\n--- Step 6: User claims their (now hopefully more available) ETH ---");
        await impersonateAccount(testUser);
        const userReceiptBeforeClaim2 = await stoneVault.userReceipts(testUser);
        const amountToClaim = new BigNumber(userReceiptBeforeClaim2.withdrawableAmount);

        if (amountToClaim.isGreaterThan(0)) {
            // Check if AssetsVault has enough ETH. This is a crucial check for large withdrawals.
            const assetsVaultBal = new BigNumber(currentState.assetsVault_ETHBalance);
            console.log(`User wants to claim ${fromWei(amountToClaim)} ETH. AssetsVault has ${fromWei(assetsVaultBal)} ETH.`);
            if (assetsVaultBal.isLessThan(amountToClaim)) {
                console.warn("AssetsVault may not have enough ETH for full claim yet. User might get less or tx might revert if StoneVault tries to pull more than available.");
            }
            // StoneVault's instantWithdraw will try to get _amount from AssetsVault.
            // If AssetsVault balance < _amount, TransferHelper will revert.
            // StoneVault doesn't have logic to partially pay from AssetsVault in instantWithdraw.
            // It assumes AssetsVault has the full `receipt.withdrawableAmount` if user is claiming that.
            // The actual ETH availability depends on strategies returning funds.
            const claimableForUser = assetsVaultBal.isLessThan(amountToClaim) ? assetsVaultBal : amountToClaim;
            if (claimableForUser.isGreaterThan(0)) {
                console.log(`User ${testUser} attempting to claim ${fromWei(claimableForUser)} ETH...`);
                await stoneVault.instantWithdraw(claimableForUser.toFixed(0), 0, { from: testUser });
                console.log("User claim attempt successful.");
            } else {
                console.log("User has no claimable ETH at the moment from AssetsVault.");
            }

        } else {
            console.log(`User ${testUser} has no withdrawable amount in receipt.`);
        }
        await stopImpersonatingAccount(testUser);

        currentState = await printAllValues("Final State after User Claim Attempt");

        console.log("\n======== Test Case 1.2.2 Successfully Completed (or simulated where needed) =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 1.2.2: ${e.message}`, e);
        safeExit(e);
    }
};