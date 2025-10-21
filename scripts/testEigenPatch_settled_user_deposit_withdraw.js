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
const eigenLSTRestakingPatchAddr = "0xYourDeployedPatchAddressPlaceholder1.4.1"; // <<<--- !!! REPLACE THIS !!!

// --- Helper Functions (copied from previous, ensure they are available) ---
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
// Main Value Printing Function (ensure this is defined as in previous scripts)
async function printAllValues(logPrefix = "", ...usersToLogReceipts) {
    console.log(`\n${logPrefix}--- VALUES ---`);
    const sv_currentSharePrice = await stoneVault.currentSharePrice();
    const sv_totalStoneSupply = await stoneToken.totalSupply();
    const sv_withdrawableAmountInPast = await stoneVault.withdrawableAmountInPast();
    const sv_withdrawingSharesInPast = await stoneVault.withdrawingSharesInPast();
    const sv_withdrawingSharesInRound = await stoneVault.withdrawingSharesInRound();
    console.log(`${logPrefix}StoneVault - Current Share Price:`, fromWei(sv_currentSharePrice).toString(10));
    console.log(`${logPrefix}StoneVault - Total Stone Supply:`, fromWei(sv_totalStoneSupply).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawable Amount (Past Rounds Total):`, fromWei(sv_withdrawableAmountInPast).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawing Shares (Past Rounds Total):`, fromWei(sv_withdrawingSharesInPast).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawing Shares (Current Round Total):`, fromWei(sv_withdrawingSharesInRound).toString(10));

    for (const user of usersToLogReceipts) {
        if (user.address && user.name) {
            const receipt = await stoneVault.userReceipts(user.address);
            console.log(`${logPrefix}StoneVault - User Receipt (${user.name} ${user.address}): Round=${receipt.withdrawRound}, Shares=${fromWei(receipt.withdrawShares)}, Amount=${fromWei(receipt.withdrawableAmount)}`);
        }
    }

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
    // Patch getAllValue should be its ETH balance (0) + the unstaking value it reads for oEGLS.
    assert(fromWei(pEGLS_getAllValue).isEqualTo(fromWei(actualUnstakingValueForOEGLSFromDM_InStETH)), "Patch getAllValue should be the oEGLS unstaking value from DM (in stETH)");

    const assetsVault_ETHBalance = await web3.eth.getBalance(assetsVaultAddr);
    console.log(`${logPrefix}AssetsVault - ETH Balance:`, fromWei(assetsVault_ETHBalance).toString(10));
    console.log(`${logPrefix}----------------`);
    return { sv_currentSharePrice, sc_totalValue, pEGLS_getAllValue, actualUnstakingValueForOEGLSFromDM_InStETH, oEGLS_stETHBalance, oEGLS_ETHBalance, assetsVault_ETHBalance, sv_withdrawableAmountInPast, sv_withdrawingSharesInRound };
}


// --- Global Variables for Contracts (initialized in try block) ---
let stoneVault, strategyController, originalEigenLSR, patchEigenLSR, stETH, stoneToken, delegationManager, eigenLayerStETHStrategy, originalEigenLSROwner;


module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };
    try {
        console.log("======== Test Case 1.4.1: Settled, User Deposits then Withdraws (Deposit < Withdrawal) =========");

        // --- Initialize Contracts ---
        stoneVault = await StoneVault.at(stoneVaultAddr);
        strategyController = await StrategyController.at(strategyControllerAddr);
        originalEigenLSR = await EigenLSTRestaking.at(originalEigenLSRAddr);
        patchEigenLSR = await EigenLSTRestakingPatch.at(eigenLSTRestakingPatchAddr);
        stETH = await IERC20.at(stETHAddr);
        stoneToken = await Stone.at(stoneTokenAddr);
        delegationManager = await IDelegationManager.at(delegationManagerAddr);
        eigenLayerStETHStrategy = await IEigenStrategy.at(eigenStrategyAddrForOEGLS);
        originalEigenLSROwner = await originalEigenLSR.owner();

        console.log("\n--- Step 0: Initial state (after user's setup) ---");
        let currentState = await printAllValues("Initial State", { name: "User", address: testUser });
        assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isZero(), "Initial unstaking for oEGLS should be 0 unless pre-existing from fork");

        console.log("\n--- Step 1: Owner of oEGLS initiates EL Unstaking (~3 stETH) ---");
        const unstakeTargetInStETH_step1 = toWei(3);
        await impersonateAccount(originalEigenLSROwner);

        let oeglsSharesInEL_step1 = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
        let oeglsUnderlyingInEL_step1 = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInEL_step1);
        const requiredTotalRestakedForStep1 = unstakeTargetInStETH_step1.plus(toWei(0.1));

        if (oeglsUnderlyingInEL_step1.isLessThan(requiredTotalRestakedForStep1)) {
            const amountToDepositToEL_step1 = requiredTotalRestakedForStep1.minus(oeglsUnderlyingInEL_step1);
            console.warn(`oEGLS needs ${fromWei(amountToDepositToEL_step1)} more stETH restaked. Attempting deposit...`);
            // Simplified funding logic (ensure oEGLS has stETH or can get it)
            const oeglsLiquidStETH_step1 = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
            if (oeglsLiquidStETH_step1.isLessThan(amountToDepositToEL_step1)) {
                const oeglsEthBal = new BigNumber(await web3.eth.getBalance(originalEigenLSRAddr));
                if (oeglsEthBal.isGreaterThan(toWei(2))) { // Try to swap ~2 ETH if available
                    await originalEigenLSR.swapToToken(toWei(2).toFixed(0), { value: toWei(2).toFixed(0), from: originalEigenLSROwner });
                }
                const newOeglsLiquidStETH = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
                if (newOeglsLiquidStETH.isLessThan(amountToDepositToEL_step1)) {
                    throw new Error(`oEGLS has insufficient liquid stETH (${fromWei(newOeglsLiquidStETH)}) to deposit ${fromWei(amountToDepositToEL_step1)} into EL.`);
                }
            }
            await originalEigenLSR.depositIntoStrategy(amountToDepositToEL_step1.toFixed(0), { from: originalEigenLSROwner });
            oeglsSharesInEL_step1 = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
            oeglsUnderlyingInEL_step1 = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInEL_step1);
        }

        const sharesToUnstake_step1 = unstakeTargetInStETH_step1.multipliedBy(oeglsSharesInEL_step1).dividedToIntegerBy(oeglsUnderlyingInEL_step1);
        if (sharesToUnstake_step1.isGreaterThan(0)) {
            console.log(`oEGLS Owner queuing EL withdrawal of ${sharesToUnstake_step1.toString()} shares...`);
            const params_step1 = [{ strategies: [eigenStrategyAddrForOEGLS], shares: [sharesToUnstake_step1.toFixed(0)], withdrawer: originalEigenLSRAddr }];
            await originalEigenLSR.queueWithdrawals(params_step1, { from: originalEigenLSROwner });
        } else {
            throw new Error("Calculated shares for Step 1 unstake is 0.");
        }
        await stopImpersonatingAccount(originalEigenLSROwner);

        currentState = await printAllValues("After oEGLS Owner Unstake Initiation", { name: "User", address: testUser });
        assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isGreaterThanOrEqualTo(unstakeTargetInStETH_step1.multipliedBy(0.99)),
            "Patch should report Step 1 unstaking value");

        // --- Step 2: User Deposits 1 ETH ---
        console.log("\n--- Step 2: User Deposits 1 ETH ---");
        const depositAmountETH = toWei(1);
        const svPriceBeforeDeposit = currentState.sv_currentSharePrice;
        await impersonateAccount(testUser);
        console.log(`User ${testUser} depositing ${fromWei(depositAmountETH)} ETH...`);
        await stoneVault.deposit({ from: testUser, value: depositAmountETH.toFixed(0) });
        await stopImpersonatingAccount(testUser);
        currentState = await printAllValues("After User Deposit (pre-settlement 1)", { name: "User", address: testUser });
        // AssetsVault ETH should have increased by depositAmountETH
        // Share price should be relatively stable

        // --- Step 3: rollToNextRound (Settlement 1 - After Deposit) ---
        console.log("\n--- Step 3: rollToNextRound (Settlement 1 - After Deposit) ---");
        await impersonateAccount(deployer);
        let rebaseTime = await stoneVault.rebaseTime();
        let rebaseInterval = await stoneVault.rebaseTimeInterval();
        if (new BigNumber((await web3.eth.getBlock('latest')).timestamp).isLessThanOrEqualTo(new BigNumber(rebaseTime).plus(rebaseInterval))) {
            await advanceTimeAndBlock(new BigNumber(rebaseInterval).plus(60).toNumber());
        }
        await stoneVault.rollToNextRound({ from: deployer, gas: 3000000 });
        await stopImpersonatingAccount(deployer);
        currentState = await printAllValues("After Settlement 1 (Deposit Processed)", { name: "User", address: testUser });
        // Deposited ETH should have moved from AssetsVault to strategies.

        // --- Step 4: User Requests Larger Withdrawal (e.g., 2 ETH worth of shares) ---
        console.log("\n--- Step 4: User Requests Larger Withdrawal (~2 ETH) ---");
        const withdrawTargetInETH_approx = 2;
        const svPriceBeforeWithdraw = currentState.sv_currentSharePrice;
        const sharesToWithdraw = toWei(withdrawTargetInETH_approx).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceBeforeWithdraw);

        await impersonateAccount(testUser);
        const userStoneBalance = new BigNumber(await stoneToken.balanceOf(testUser));
        if (userStoneBalance.isLessThan(sharesToWithdraw)) {
            // This shouldn't happen if they just deposited 1 ETH and are withdrawing 2 ETH worth,
            // unless initial balance was very low. The deposit in step 2 gave them shares for 1 ETH.
            console.warn(`User ${testUser} has ${fromWei(userStoneBalance)} Stone, wants to withdraw ${fromWei(sharesToWithdraw)}. This might be more than they have if previous balance was 0.`);
            // Adjust sharesToWithdraw to be user's current balance if it's less than calculated.
            // For this test, we WANT the withdrawal to be larger than the recent deposit.
            // Let's assume the deposit gave them enough shares that withdrawing "2 ETH worth" is possible,
            // i.e., they had some shares before or the share price is such that 1 ETH deposit gives > 2 ETH worth of shares (unlikely).
            // The key is: amount withdrawn > amount deposited in this sequence.
            // Let's ensure they have enough shares for this by potentially depositing more IF NEEDED for the test logic to proceed.
            // However, the scenario implies they use their existing + newly acquired shares.
            assert(userStoneBalance.isGreaterThanOrEqualTo(sharesToWithdraw), `User does not have enough Stone to withdraw ${fromWei(sharesToWithdraw)}. Has ${fromWei(userStoneBalance)}`);
        }

        console.log(`User ${testUser} requesting withdrawal of ${fromWei(sharesToWithdraw)} shares (approx ${withdrawTargetInETH_approx} ETH)...`);
        await stoneVault.requestWithdraw(sharesToWithdraw.toFixed(0), { from: testUser });
        await stopImpersonatingAccount(testUser);
        currentState = await printAllValues("After User Larger Withdrawal Request (pre-settlement 2)", { name: "User", address: testUser });
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isEqualTo(sharesToWithdraw), "sv_withdrawingSharesInRound mismatch for larger withdrawal request");

        // --- Step 5: rollToNextRound (Settlement 2 - After Withdrawal Request) ---
        console.log("\n--- Step 5: rollToNextRound (Settlement 2 - After Withdrawal Request) ---");
        await impersonateAccount(deployer);
        rebaseTime = await stoneVault.rebaseTime();
        rebaseInterval = await stoneVault.rebaseTimeInterval();
        if (new BigNumber((await web3.eth.getBlock('latest')).timestamp).isLessThanOrEqualTo(new BigNumber(rebaseTime).plus(rebaseInterval))) {
            await advanceTimeAndBlock(new BigNumber(rebaseInterval).plus(60).toNumber());
        }
        await stoneVault.rollToNextRound({ from: deployer, gas: 4000000 });
        await stopImpersonatingAccount(deployer);
        currentState = await printAllValues("After Settlement 2 (Withdrawal Processed)", { name: "User", address: testUser });
        const userReceiptAfterRoll2 = await stoneVault.userReceipts(testUser);
        const userWithdrawableFromReceipt = new BigNumber(userReceiptAfterRoll2.withdrawableAmount);
        assert(userWithdrawableFromReceipt.isGreaterThan(0), "User should have a withdrawable amount in receipt after settlement 2");
        // AssetsVault ETH might be low if the withdrawal was large and relied on EL unstaking.

        // --- Step 6: (Optional Simulation) Owner ensures liquidity if needed ---
        // This step might be needed if AssetsVault doesn't have enough ETH for the user's claim.
        // It involves completing some EL unstaking and converting stETH to ETH.
        // For simplicity, we'll check AssetsVault balance before user claim. If it's too low, this step would be where
        // owner actions bring ETH back to AssetsVault. We'll assume for now that previous EL unstaking (Step 1)
        // plus other liquidities were sufficient or became available.
        console.log("\n--- Step 6: (Skipping explicit EL unstake completion simulation for brevity, assuming liquidity or previous unstaking helps) ---");


        // --- Step 7: User Claims ETH ---
        console.log("\n--- Step 7: User Claims ETH ---");
        await impersonateAccount(testUser);
        const userReceiptBeforeClaim = await stoneVault.userReceipts(testUser);
        let amountToClaim = new BigNumber(userReceiptBeforeClaim.withdrawableAmount);

        if (amountToClaim.isGreaterThan(0)) {
            const assetsVaultBal = new BigNumber(await web3.eth.getBalance(assetsVaultAddr));
            console.log(`User wants to claim ${fromWei(amountToClaim)} ETH. AssetsVault has ${fromWei(assetsVaultBal)} ETH.`);

            if (assetsVaultBal.isLessThan(amountToClaim)) {
                console.warn(`AssetsVault balance ${fromWei(assetsVaultBal)} is less than user's claimable ${fromWei(amountToClaim)}. User will only be able to claim available amount or tx might fail if trying to claim more than vault holds.`);
                // StoneVault's instantWithdraw will try to transfer `_amount`. If AssetsVault has less, `TransferHelper.safeTransferETH` will revert.
                // So, user should only attempt to withdraw what's confirmed to be in AssetsVault IF their total withdrawable is higher.
                // However, the receipt amount IS what they are entitled to eventually. For testing the claim,
                // we might need to ensure AssetsVault is topped up, or test partial claim if that's a feature (it's not for instantWithdraw).
                // For this test, let's assume the system should make the full receipt.withdrawableAmount available.
                // If AssetsVault is short, it indicates strategies haven't fully returned funds yet.
                assert(assetsVaultBal.isGreaterThanOrEqualTo(amountToClaim), `CRITICAL: AssetsVault insufficient for user claim. Has ${fromWei(assetsVaultBal)}, needs ${fromWei(amountToClaim)}. Strategies need to return funds or EL unstaking complete.`);
            }
            console.log(`User ${testUser} attempting to claim ${fromWei(amountToClaim)} ETH...`);
            await stoneVault.instantWithdraw(amountToClaim.toFixed(0), 0, { from: testUser }); // Claiming from past round, so shares = 0
            console.log("User claim attempt successful.");

        } else {
            console.log(`User ${testUser} has no withdrawable amount in receipt.`);
        }
        await stopImpersonatingAccount(testUser);

        currentState = await printAllValues("Final State after User Claim", { name: "User", address: testUser });
        const userFinalReceipt = await stoneVault.userReceipts(testUser);
        // If they claimed their full `withdrawableAmount`, this should be close to 0 (might be tiny dust if any fee later or precision).
        assert(new BigNumber(userFinalReceipt.withdrawableAmount).isLessThan(toWei(0.000001)), "User withdrawable amount should be effectively zero after full claim.");


        console.log("\n======== Test Case 1.4.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 1.4.1: ${e.message}`, e);
        safeExit(e);
    }
};