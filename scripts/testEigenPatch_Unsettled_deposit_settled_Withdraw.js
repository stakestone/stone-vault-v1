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
const eigenLSTRestakingPatchAddr = "0xYourDeployedPatchAddressPlaceholder2.2.1"; // <<<--- !!! REPLACE THIS !!!

// --- Helper Functions (copied from previous) ---
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
    return { sv_currentSharePrice, sc_totalValue, pEGLS_getAllValue, actualUnstakingValueForOEGLSFromDM_InStETH, oEGLS_stETHBalance, oEGLS_ETHBalance, assetsVault_ETHBalance, sv_withdrawableAmountInPast, sv_withdrawingSharesInRound, sv_latestRoundID, sv_rebaseTime };
}

// --- Global Contract Variables ---
let stoneVault, strategyController, originalEigenLSR, patchEigenLSR, stETH, stoneToken, delegationManager, eigenLayerStETHStrategy, originalEigenLSROwner;


module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };

    if (eigenLSTRestakingPatchAddr === "0xYourDeployedPatchAddressPlaceholder2.2.1") {
        console.error("Placeholder address for Patch contract not replaced.");
        return safeExit(new Error("Placeholder address for Patch contract not replaced."));
    }

    try {
        console.log("======== Test Case 2.2.1: Unsettled -> Deposit -> Settle -> Withdraw > Deposit (Net Outflow < EL ETH) -> Settle -> Claim =========");

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

        console.log("\n--- Step 0: Initial state (Forked to be Unsettled, Patch Active) ---");
        let initialBlockTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp);
        let initialRebaseTime = new BigNumber(await stoneVault.rebaseTime());
        const rebaseInterval = new BigNumber(await stoneVault.rebaseTimeInterval());
        assert(initialBlockTimestamp.isLessThanOrEqualTo(initialRebaseTime.plus(rebaseInterval)),
            `Forked state is not unsettled. CurrentTime: ${initialBlockTimestamp}, NextRebasePossibleAfter: ${initialRebaseTime.plus(rebaseInterval)}`);

        let currentState = await printAllValues("Initial Unsettled State", { name: "User", address: testUser });
        const initialOEGLSEthBalance_step0 = new BigNumber(currentState.oEGLS_ETHBalance);

        // --- Step 1a: Fund originalEigenLSR with liquid ETH (e.g. 1.5 ETH for this test's net outflow) ---
        const ethToFundOEGLS = toWei(1.5); // Net outflow will be ~1 ETH, so 1.5 ETH provides buffer
        console.log(`\n--- Step 1a: Funding oEGLS with ${fromWei(ethToFundOEGLS)} liquid ETH ---`);
        await impersonateAccount(deployer);
        await web3.eth.sendTransaction({ from: deployer, to: originalEigenLSRAddr, value: ethToFundOEGLS.toFixed(0) });
        await stopImpersonatingAccount(deployer);
        currentState = await printAllValues("After Funding oEGLS with ETH", { name: "User", address: testUser });
        const oeglsEthAfterFunding = new BigNumber(currentState.oEGLS_ETHBalance);
        assert(oeglsEthAfterFunding.isGreaterThanOrEqualTo(initialOEGLSEthBalance_step0.plus(ethToFundOEGLS.multipliedBy(0.99))), // allow for some gas if funder was oEGLS itself
            "oEGLS ETH balance did not increase as expected after direct funding.");


        // --- Step 1b: (Optional Owner Interaction) Initiate EL Unstaking (~1 stETH) ---
        console.log("\n--- Step 1b: Owner of oEGLS initiates EL Unstaking (~1 stETH) ---");
        // (Simplified logic from 2.1.1 - ensure oEGLS has >1 stETH restaked, then unstake ~1 stETH)
        const unstakeTarget_step1b = toWei(1);
        await impersonateAccount(originalEigenLSROwner);
        // ... (Full logic to ensure enough restaked and then unstake, similar to 2.1.1, for brevity can be complex)
        // For this test, let's assume it can unstake some amount if available.
        let oeglsShares_step1b = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
        if (oeglsShares_step1b.isGreaterThan(toWei(0.1, 0))) { // Check if it has any significant shares
            let oeglsUnderlying_step1b = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsShares_step1b);
            if (oeglsUnderlying_step1b.isGreaterThan(unstakeTarget_step1b)) {
                const sharesToUnstake_step1b = unstakeTarget_step1b.multipliedBy(oeglsShares_step1b).dividedToIntegerBy(oeglsUnderlying_step1b);
                if (sharesToUnstake_step1b.isGreaterThan(0)) {
                    await originalEigenLSR.queueWithdrawals([{ strategies: [eigenStrategyAddrForOEGLS], shares: [sharesToUnstake_step1b.toFixed(0)], withdrawer: originalEigenLSRAddr }], { from: originalEigenLSROwner });
                    console.log("Optional EL unstake initiated by owner.");
                }
            } else { console.warn("oEGLS has restaked stETH but less than 1 stETH, skipping optional unstake."); }
        } else { console.warn("oEGLS has negligible/no shares in EL, skipping optional unstake."); }
        await stopImpersonatingAccount(originalEigenLSROwner);
        currentState = await printAllValues("After Optional EL Unstake by Owner", { name: "User", address: testUser });


        // --- Step 2: User Deposits ETH (e.g., 1 ETH) ---
        console.log("\n--- Step 2: User Deposits 1 ETH ---");
        const depositAmountETH = toWei(1);
        await impersonateAccount(testUser);
        // Ensure user has ETH to deposit
        const userEthBal = new BigNumber(await web3.eth.getBalance(testUser));
        if (userEthBal.isLessThan(depositAmountETH.plus(toWei(0.1)))) { // +0.1 for gas
            await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_setBalance", params: [testUser, depositAmountETH.plus(toWei(1)).toFixed(0)], id: Date.now() + Math.random() }); // Give 1 ETH + buffer
        }
        console.log(`User ${testUser} depositing ${fromWei(depositAmountETH)} ETH...`);
        await stoneVault.deposit({ from: testUser, value: depositAmountETH.toFixed(0) });
        await stopImpersonatingAccount(testUser);
        currentState = await printAllValues("After User Deposit (Still Unsettled)", { name: "User", address: testUser });


        // --- Step 3: Advance Time & rollToNextRound (Settlement 1 - Process Deposit) ---
        console.log("\n--- Step 3: Advance Time & rollToNextRound (Settlement 1) ---");
        await impersonateAccount(deployer);
        initialRebaseTime = new BigNumber(currentState.sv_rebaseTime); // Use rebase time from last print
        initialBlockTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp);
        if (initialBlockTimestamp.isLessThanOrEqualTo(initialRebaseTime.plus(rebaseInterval))) {
            await advanceTimeAndBlock(initialRebaseTime.plus(rebaseInterval).minus(initialBlockTimestamp).plus(60).toNumber());
        }
        console.log("Calling rollToNextRound to process deposit...");
        await stoneVault.rollToNextRound({ from: deployer, gas: 3000000 });
        await stopImpersonatingAccount(deployer);
        currentState = await printAllValues("After Settlement 1 (Deposit Processed)", { name: "User", address: testUser });
        // Check: AssetsVault ETH should decrease, strategy (like oEGLS) ETH/stETH/restaked value should increase.
        const oeglsEthAfterDepositSettled = new BigNumber(currentState.oEGLS_ETHBalance);


        // --- Step 4: User Requests Larger Withdrawal (e.g., 2 ETH worth, net outflow ~1 ETH) ---
        console.log("\n--- Step 4: User Requests Larger Withdrawal (~2 ETH) ---");
        const withdrawTargetInETH_approx = 2; // User wants to withdraw value of ~2 ETH
        const svPriceForWithdraw = currentState.sv_currentSharePrice;
        const sharesToWithdraw = toWei(withdrawTargetInETH_approx).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceForWithdraw);

        await impersonateAccount(testUser);
        const userStoneBal = new BigNumber(await stoneToken.balanceOf(testUser));
        assert(userStoneBal.isGreaterThanOrEqualTo(sharesToWithdraw), `User has insufficient Stone (${fromWei(userStoneBal)}) for withdrawal of ${fromWei(sharesToWithdraw)} shares.`);
        console.log(`User ${testUser} requesting withdrawal of ${fromWei(sharesToWithdraw)} shares (approx ${withdrawTargetInETH_approx} ETH)...`);
        await stoneVault.requestWithdraw(sharesToWithdraw.toFixed(0), { from: testUser });
        await stopImpersonatingAccount(testUser);
        currentState = await printAllValues("After User Larger Withdrawal Request", { name: "User", address: testUser });
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isEqualTo(sharesToWithdraw), "sv_withdrawingSharesInRound mismatch");


        // --- Step 5: Advance Time & rollToNextRound (Settlement 2 - Process Withdrawal) ---
        console.log("\n--- Step 5: Advance Time & rollToNextRound (Settlement 2) ---");
        await impersonateAccount(deployer);
        initialRebaseTime = new BigNumber(currentState.sv_rebaseTime); // Use rebase time from last print
        initialBlockTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp);
        if (initialBlockTimestamp.isLessThanOrEqualTo(initialRebaseTime.plus(rebaseInterval))) {
            await advanceTimeAndBlock(initialRebaseTime.plus(rebaseInterval).minus(initialBlockTimestamp).plus(60).toNumber());
        }
        console.log("Calling rollToNextRound to process withdrawal...");
        await stoneVault.rollToNextRound({ from: deployer, gas: 3000000 });
        await stopImpersonatingAccount(deployer);

        currentState = await printAllValues("After Settlement 2 (Withdrawal Processed)", { name: "User", address: testUser });
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isZero(), "sv_withdrawingSharesInRound should be 0 after roll");
        const userReceiptAfterRoll2 = await stoneVault.userReceipts(testUser);
        assert(new BigNumber(userReceiptAfterRoll2.withdrawableAmount).isGreaterThan(0), "User should have withdrawable amount in receipt");
        // Check if oEGLS ETH balance decreased by approximately the net withdrawal it was supposed to cover.
        // Net withdrawal by user from system ~1 ETH. oEGLS ratio determines its share.
        // If oEGLS ratio is high, its ETH should decrease significantly.
        const oeglsEthAfterWithdrawSettled = new BigNumber(currentState.oEGLS_ETHBalance);
        const netUserWithdrawalEffectApprox = withdrawTargetInETH_approx - fromWei(depositAmountETH); // approx 1 ETH
        console.log(`oEGLS ETH balance changed from ${fromWei(oeglsEthAfterDepositSettled)} to ${fromWei(oeglsEthAfterWithdrawSettled)}. Net user withdrawal effect ~${netUserWithdrawalEffectApprox} ETH.`);
        // This assertion is tricky because SC distributes withdrawals based on ratios.
        // But we expect oeglsEthAfterWithdrawSettled < oeglsEthAfterDepositSettled IF oEGLS ratio > 0 and it paid out.
        // And importantly, oeglsEthAfterWithdrawSettled should still be >= 0 because we funded it sufficiently.
        assert(oeglsEthAfterWithdrawSettled.isLessThan(oeglsEthAfterDepositSettled), "oEGLS ETH should decrease after servicing net withdrawal");
        assert(oeglsEthAfterWithdrawSettled.isGreaterThanOrEqualTo(0), "oEGLS ETH should not be negative");


        // --- Step 6: User Claims ETH ---
        console.log("\n--- Step 6: User Claims their ETH ---");
        await impersonateAccount(testUser);
        const userReceiptBeforeClaim = await stoneVault.userReceipts(testUser);
        const amountToClaim = new BigNumber(userReceiptBeforeClaim.withdrawableAmount);

        if (amountToClaim.isGreaterThan(0)) {
            const assetsVaultBal = new BigNumber(await web3.eth.getBalance(assetsVaultAddr));
            assert(assetsVaultBal.isGreaterThanOrEqualTo(amountToClaim), `AssetsVault insufficient (${fromWei(assetsVaultBal)}) for user claim (${fromWei(amountToClaim)}). Strategies didn't return enough ETH.`);
            console.log(`User ${testUser} claiming ${fromWei(amountToClaim)} ETH...`);
            await stoneVault.instantWithdraw(amountToClaim.toFixed(0), 0, { from: testUser });
        } else {
            console.log(`User ${testUser} has no withdrawable amount in receipt.`);
        }
        await stopImpersonatingAccount(testUser);

        currentState = await printAllValues("Final State after User Claim", { name: "User", address: testUser });
        const userFinalReceipt = await stoneVault.userReceipts(testUser);
        assert(new BigNumber(userFinalReceipt.withdrawableAmount).isLessThan(toWei(0.000001)), "User withdrawable amount should be zero after full claim.");

        console.log("\n======== Test Case 2.2.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 2.2.1: ${e.message}`, e);
        safeExit(e);
    }
};