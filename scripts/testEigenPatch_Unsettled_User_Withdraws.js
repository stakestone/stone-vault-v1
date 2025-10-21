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
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312"; // Also acts as Setup User
const testUser = "0x22d130d251286e17b029d557d2928c5956efa8c4"; // Main test user

const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const stoneTokenAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
const assetsVaultAddr = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";

const originalEigenLSRAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddrForOEGLS = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";
const eigenLSTRestakingPatchAddr = ""; //

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

    if (eigenLSTRestakingPatchAddr === "0xYourDeployedPatchAddressPlaceholder2.1.1") {
        console.error("Placeholder address for Patch contract not replaced.");
        return safeExit(new Error("Placeholder address for Patch contract not replaced."));
    }

    try {
        console.log("======== Test Case 2.1.1: Unsettled, User Withdraws (Existing Queue, EL ETH Sufficient) =========");

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
        // Confirm it's unsettled: current block time < rebaseTime + interval
        let initialBlockTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp);
        let initialRebaseTime = new BigNumber(await stoneVault.rebaseTime());
        const rebaseInterval = new BigNumber(await stoneVault.rebaseTimeInterval());
        assert(initialBlockTimestamp.isLessThanOrEqualTo(initialRebaseTime.plus(rebaseInterval)),
            `Forked state is not unsettled. CurrentTime: ${initialBlockTimestamp}, NextRebasePossibleAfter: ${initialRebaseTime.plus(rebaseInterval)}`);

        let currentState = await printAllValues("Initial Unsettled State", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        const initialOEGLSEthBalance = new BigNumber(currentState.oEGLS_ETHBalance);

        // --- Step 1a: Fund originalEigenLSR with liquid ETH ---
        // This ETH is to ensure it can cover withdrawal demands without selling stETH or waiting for EL unstaking
        const ethToFundOEGLS = toWei(2); // Fund with 2 ETH
        console.log(`\n--- Step 1a: Funding oEGLS with ${fromWei(ethToFundOEGLS)} liquid ETH ---`);
        await impersonateAccount(deployer); // deployer sends ETH
        await web3.eth.sendTransaction({ from: deployer, to: originalEigenLSRAddr, value: ethToFundOEGLS.toFixed(0) });
        await stopImpersonatingAccount(deployer);
        currentState = await printAllValues("After Funding oEGLS with ETH", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        assert(new BigNumber(currentState.oEGLS_ETHBalance).isGreaterThanOrEqualTo(initialOEGLSEthBalance.plus(ethToFundOEGLS)), "oEGLS ETH balance did not increase as expected.");


        // --- Step 1b: (Owner Interaction) Initiate EL Unstaking (Optional, for patch tracking ~1 stETH) ---
        console.log("\n--- Step 1b: Owner of oEGLS initiates EL Unstaking (~1 stETH) ---");
        // (Logic copied and adapted from previous scripts to ensure oEGLS has restaked assets and unstakes some)
        const unstakeTarget_step1b = toWei(1);
        await impersonateAccount(originalEigenLSROwner);
        let oeglsShares_step1b = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
        let oeglsUnderlying_step1b = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsShares_step1b);
        if (oeglsUnderlying_step1b.isLessThan(unstakeTarget_step1b.plus(toWei(0.1)))) { /* Simplified funding */
            const neededStETHForELDeposit = unstakeTarget_step1b.plus(toWei(0.1)).minus(oeglsUnderlying_step1b);
            console.warn(`oEGLS needs ${fromWei(neededStETHForELDeposit)} more stETH restaked. Attempting deposit...`);
            const oeglsLiquidStETH = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
            if (oeglsLiquidStETH.isLessThan(neededStETHForELDeposit)) {
                // Attempt to swap some of its newly acquired ETH
                const ethToSwap = neededStETHForELDeposit.multipliedBy(1.2); // Estimate ETH needed, assuming stETH price is ~ETH
                if (new BigNumber(await web3.eth.getBalance(originalEigenLSRAddr)).isGreaterThanOrEqualTo(ethToSwap)) {
                    await originalEigenLSR.swapToToken(ethToSwap.toFixed(0), { value: ethToSwap.toFixed(0), from: originalEigenLSROwner });
                }
                const newLiquidStETH = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
                if (newLiquidStETH.isLessThan(neededStETHForELDeposit)) throw new Error(`oEGLS has insufficient stETH ${fromWei(newLiquidStETH)} for EL deposit`);
            }
            await originalEigenLSR.depositIntoStrategy(neededStETHForELDeposit.toFixed(0), { from: originalEigenLSROwner });
            oeglsShares_step1b = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
            oeglsUnderlying_step1b = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsShares_step1b);
        }
        const sharesToUnstake_step1b = unstakeTarget_step1b.multipliedBy(oeglsShares_step1b).dividedToIntegerBy(oeglsUnderlying_step1b);
        if (sharesToUnstake_step1b.isGreaterThan(0)) {
            await originalEigenLSR.queueWithdrawals([{ strategies: [eigenStrategyAddrForOEGLS], shares: [sharesToUnstake_step1b.toFixed(0)], withdrawer: originalEigenLSRAddr }], { from: originalEigenLSROwner });
        } else { console.warn("Skipping optional EL unstake as calculated shares are 0."); }
        await stopImpersonatingAccount(originalEigenLSROwner);
        currentState = await printAllValues("After Optional EL Unstake by Owner", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        if (sharesToUnstake_step1b.isGreaterThan(0)) {
            assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isGreaterThanOrEqualTo(unstakeTarget_step1b.multipliedBy(0.99)), "Patch should report EL unstaking");
        }

        // --- Step 1c: Create Initial `withdrawingSharesInRound > 0` by Setup User (deployer) ---
        console.log("\n--- Step 1c: Setup User (deployer) makes initial withdrawal request ---");
        const svPriceForSetupWithdraw = currentState.sv_currentSharePrice;
        const setupWithdrawTargetInETH = 0.2;
        const sharesForSetupUser = toWei(setupWithdrawTargetInETH).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceForSetupWithdraw);

        await impersonateAccount(deployer);
        let setupUserStoneBal = new BigNumber(await stoneToken.balanceOf(deployer));
        if (setupUserStoneBal.isLessThan(sharesForSetupUser)) { // Fund deployer if needed
            const ethToDeposit = sharesForSetupUser.minus(setupUserStoneBal).multipliedBy(svPriceForSetupWithdraw).dividedToIntegerBy(toWei(1)).multipliedBy(1.1);
            console.log(`Funding Setup User (deployer) with Stone. Depositing ETH: ${fromWei(ethToDeposit)}`);
            await stoneVault.deposit({ from: deployer, value: ethToDeposit.toFixed(0) });
        }
        console.log(`Setup User (deployer) requesting withdrawal of ${fromWei(sharesForSetupUser)} shares...`);
        await stoneVault.requestWithdraw(sharesForSetupUser.toFixed(0), { from: deployer });
        await stopImpersonatingAccount(deployer);
        currentState = await printAllValues("After Setup User Withdrawal Request", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isEqualTo(sharesForSetupUser), "Initial withdrawingSharesInRound mismatch");

        const withdrawingSharesAfterSetup = new BigNumber(currentState.sv_withdrawingSharesInRound);

        // --- Step 2: testUser makes additional withdrawal request ---
        console.log("\n--- Step 2: testUser makes additional withdrawal request ---");
        const svPriceForTestUserWithdraw = currentState.sv_currentSharePrice;
        const testUserWithdrawTargetInETH = 0.3;
        const sharesForTestUser = toWei(testUserWithdrawTargetInETH).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceForTestUserWithdraw);

        await impersonateAccount(testUser);
        let testUserStoneBal = new BigNumber(await stoneToken.balanceOf(testUser));
        if (testUserStoneBal.isLessThan(sharesForTestUser)) { // Fund testUser if needed
            const ethToDeposit = sharesForTestUser.minus(testUserStoneBal).multipliedBy(svPriceForTestUserWithdraw).dividedToIntegerBy(toWei(1)).multipliedBy(1.1);
            console.log(`Funding testUser with Stone. Depositing ETH: ${fromWei(ethToDeposit)}`);
            await stoneVault.deposit({ from: testUser, value: ethToDeposit.toFixed(0) });
        }
        console.log(`testUser requesting withdrawal of ${fromWei(sharesForTestUser)} shares...`);
        await stoneVault.requestWithdraw(sharesForTestUser.toFixed(0), { from: testUser });
        await stopImpersonatingAccount(testUser);

        currentState = await printAllValues("After testUser Additional Withdrawal Request", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        const expectedTotalWithdrawingInRound = withdrawingSharesAfterSetup.plus(sharesForTestUser);
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isEqualTo(expectedTotalWithdrawingInRound), "Total withdrawingSharesInRound mismatch after testUser request");

        // --- Step 3: Advance Time & Execute rollToNextRound ---
        console.log("\n--- Step 3: Advance Time & Execute rollToNextRound ---");
        await impersonateAccount(deployer); // Any account can call
        initialRebaseTime = new BigNumber(currentState.sv_rebaseTime); // Use rebase time from last print
        initialBlockTimestamp = new BigNumber((await web3.eth.getBlock('latest')).timestamp);
        if (initialBlockTimestamp.isLessThanOrEqualTo(initialRebaseTime.plus(rebaseInterval))) {
            await advanceTimeAndBlock(initialRebaseTime.plus(rebaseInterval).minus(initialBlockTimestamp).plus(60).toNumber());
        }
        console.log("Calling rollToNextRound to settle withdrawals...");
        await stoneVault.rollToNextRound({ from: deployer, gas: 3000000 });
        await stopImpersonatingAccount(deployer);

        currentState = await printAllValues("After rollToNextRound (Withdrawals Settled)", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isZero(), "sv_withdrawingSharesInRound should be 0 after roll");
        const oeglsEthBalanceAfterRoll = new BigNumber(currentState.oEGLS_ETHBalance);
        // Expect oEGLS ETH balance to decrease as it services withdrawals from its liquid ETH
        // This is an indirect check, as other strategies also contribute.
        // A more precise check would be to see if (initialOEGLSEthBalance - oeglsEthBalanceAfterRoll) is positive
        // and corresponds to its share of withdrawals. For simplicity, we just observe.
        console.log(`oEGLS ETH balance changed from ${fromWei(ethToFundOEGLS)} (after funding) to ${fromWei(oeglsEthBalanceAfterRoll)}`);


        // --- Step 4: Users Claim ETH ---
        console.log("\n--- Step 4: Users Claim their ETH ---");
        for (const user of [{ acc: deployer, name: "SetupUser" }, { acc: testUser, name: "TestUser" }]) {
            await impersonateAccount(user.acc);
            const userReceipt = await stoneVault.userReceipts(user.acc);
            const amountToClaim = new BigNumber(userReceipt.withdrawableAmount);
            if (amountToClaim.isGreaterThan(0)) {
                const assetsVaultBal = new BigNumber(await web3.eth.getBalance(assetsVaultAddr));
                const claimableForThisUser = assetsVaultBal.isLessThan(amountToClaim) ? assetsVaultBal : amountToClaim;

                if (claimableForThisUser.isGreaterThan(0)) {
                    console.log(`${user.name} (${user.acc}) claiming ${fromWei(claimableForThisUser)} ETH...`);
                    await stoneVault.instantWithdraw(claimableForThisUser.toFixed(0), 0, { from: user.acc });
                } else {
                    console.log(`${user.name} (${user.acc}) cannot claim as AssetsVault has insufficient funds for their pending receipt or receipt is 0.`);
                }
            } else {
                console.log(`${user.name} (${user.acc}) has no withdrawable amount in receipt.`);
            }
            await stopImpersonatingAccount(user.acc);
        }

        currentState = await printAllValues("Final State after User Claims", { name: "SetupUser", address: deployer }, { name: "TestUser", address: testUser });
        const setupUserFinalReceipt = await stoneVault.userReceipts(deployer);
        const testUserFinalReceipt = await stoneVault.userReceipts(testUser);
        assert(new BigNumber(setupUserFinalReceipt.withdrawableAmount).isLessThan(toWei(0.000001)), "SetupUser withdrawable amount should be zero after claim attempt");
        assert(new BigNumber(testUserFinalReceipt.withdrawableAmount).isLessThan(toWei(0.000001)), "TestUser withdrawable amount should be zero after claim attempt");


        console.log("\n======== Test Case 2.1.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 2.1.1: ${e.message}`, e);
        safeExit(e);
    }
};