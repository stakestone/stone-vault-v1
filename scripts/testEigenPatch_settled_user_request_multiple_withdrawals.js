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
const testUserA = "0x22d130d251286e17b029d557d2928c5956efa8c4"; // User A
const anotherTestUserB = "0x000000000000000000000000000000000000dEaD"; // User B - A distinct address for clarity

const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const stoneTokenAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
const assetsVaultAddr = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";

const originalEigenLSRAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddrForOEGLS = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";
const eigenLSTRestakingPatchAddr = "0xYourDeployedPatchAddressPlaceholder1.3.1"; // <<<--- !!! REPLACE THIS !!!

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

    if (eigenLSTRestakingPatchAddr === "0xYourDeployedPatchAddressPlaceholder1.3.1") {
        console.error("Placeholder address for Patch contract not replaced.");
        return safeExit(new Error("Placeholder address for Patch contract not replaced."));
    }

    try {
        console.log("======== Test Case 1.3.1: Settled, Multiple User Withdrawals =========");

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
        let currentState = await printAllValues("Initial State", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isZero(), "Initial unstaking for oEGLS should be 0");

        // --- Step 1: Owner of oEGLS initiates Unstaking from EigenLayer (~2 stETH) ---
        console.log("\n--- Step 1: Owner of oEGLS initiates EL Unstaking (~2 stETH) ---");
        const unstakeTargetInStETH_step1 = toWei(2);
        await impersonateAccount(originalEigenLSROwner);

        let oeglsSharesInEL_step1 = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
        let oeglsUnderlyingInEL_step1 = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInEL_step1);
        const requiredTotalRestakedForStep1 = unstakeTargetInStETH_step1.plus(toWei(0.1)); // Ensure enough

        if (oeglsUnderlyingInEL_step1.isLessThan(requiredTotalRestakedForStep1)) {
            const amountToDepositToEL_step1 = requiredTotalRestakedForStep1.minus(oeglsUnderlyingInEL_step1);
            console.warn(`oEGLS needs ${fromWei(amountToDepositToEL_step1)} more stETH restaked. Attempting deposit...`);
            // Simplified: Assume oEGLS has liquid stETH or can get it.
            // In a real test, robustly fund oEGLS with stETH first.
            const oeglsLiquidStETH_step1 = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
            if (oeglsLiquidStETH_step1.isLessThan(amountToDepositToEL_step1)) {
                // Try to swap some ETH for stETH if oEGLS has ETH
                const oeglsEthBal = new BigNumber(await web3.eth.getBalance(originalEigenLSRAddr));
                if (oeglsEthBal.isGreaterThan(toWei(1))) { // Arbitrary amount of ETH to try and swap
                    await originalEigenLSR.swapToToken(toWei(1).toFixed(0), { value: toWei(1).toFixed(0), from: originalEigenLSROwner });
                }
                // Recheck stETH balance
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

        currentState = await printAllValues("After oEGLS Owner Unstake Initiation", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        assert(currentState.actualUnstakingValueForOEGLSFromDM_InStETH.isGreaterThanOrEqualTo(unstakeTargetInStETH_step1.multipliedBy(0.99)),
            "Patch should report Step 1 unstaking value");

        // --- Setup Users with Stone Tokens (if they don't have enough) ---
        const svPriceForDeposits = currentState.sv_currentSharePrice;
        const withdrawTargetForUserA_ETH = 0.5;
        const withdrawTargetForUserB_ETH = 0.5;
        const sharesNeededUserA = toWei(withdrawTargetForUserA_ETH).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceForDeposits);
        const sharesNeededUserB = toWei(withdrawTargetForUserB_ETH).multipliedBy(toWei(1)).dividedToIntegerBy(svPriceForDeposits);

        for (const user of [{ acc: testUserA, shares: sharesNeededUserA, name: "UserA" }, { acc: anotherTestUserB, shares: sharesNeededUserB, name: "UserB" }]) {
            await impersonateAccount(user.acc);
            let userStoneBal = new BigNumber(await stoneToken.balanceOf(user.acc));
            if (userStoneBal.isLessThan(user.shares)) {
                const ethToDeposit = user.shares.minus(userStoneBal).multipliedBy(svPriceForDeposits).dividedToIntegerBy(toWei(1)).multipliedBy(1.05); // deposit 5% more
                console.log(`Funding ${user.name} (${user.acc}) with Stone tokens. Current: ${fromWei(userStoneBal)}, Needs: ${fromWei(user.shares)}. Depositing ETH: ${fromWei(ethToDeposit)}`);
                await stoneVault.deposit({ from: user.acc, value: ethToDeposit.toFixed(0) });
                userStoneBal = new BigNumber(await stoneToken.balanceOf(user.acc));
                console.log(`${user.name} new Stone balance: ${fromWei(userStoneBal)}`);
                assert(userStoneBal.isGreaterThanOrEqualTo(user.shares), `${user.name} still doesn't have enough Stone tokens after deposit.`);
            }
            await stopImpersonatingAccount(user.acc);
        }
        currentState = await printAllValues("After Ensuring Users Have Stone", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });


        // --- Step 2: User A requests Withdrawal 1 ---
        console.log("\n--- Step 2: User A requests Withdrawal 1 ---");
        await impersonateAccount(testUserA);
        console.log(`User A (${testUserA}) requesting withdrawal of ${fromWei(sharesNeededUserA)} shares...`);
        await stoneVault.requestWithdraw(sharesNeededUserA.toFixed(0), { from: testUserA });
        await stopImpersonatingAccount(testUserA);
        currentState = await printAllValues("After User A Withdrawal Request", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        const withdrawingInRoundAfterA = new BigNumber(currentState.sv_withdrawingSharesInRound);
        assert(withdrawingInRoundAfterA.isEqualTo(sharesNeededUserA), "sv_withdrawingSharesInRound mismatch after User A request");

        // --- Step 3: User B requests Withdrawal 2 ---
        console.log("\n--- Step 3: User B requests Withdrawal 2 ---");
        await impersonateAccount(anotherTestUserB);
        console.log(`User B (${anotherTestUserB}) requesting withdrawal of ${fromWei(sharesNeededUserB)} shares...`);
        await stoneVault.requestWithdraw(sharesNeededUserB.toFixed(0), { from: anotherTestUserB });
        await stopImpersonatingAccount(anotherTestUserB);
        currentState = await printAllValues("After User B Withdrawal Request", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        const withdrawingInRoundAfterB = new BigNumber(currentState.sv_withdrawingSharesInRound);
        assert(withdrawingInRoundAfterB.isEqualTo(sharesNeededUserA.plus(sharesNeededUserB)), "sv_withdrawingSharesInRound should sum both requests");

        // --- Step 4: Execute rollToNextRound ---
        console.log("\n--- Step 4: Execute rollToNextRound (Settling multiple withdrawals) ---");
        await impersonateAccount(deployer);
        const rebaseTime = await stoneVault.rebaseTime();
        const rebaseInterval = await stoneVault.rebaseTimeInterval();
        if (new BigNumber((await web3.eth.getBlock('latest')).timestamp).isLessThanOrEqualTo(new BigNumber(rebaseTime).plus(rebaseInterval))) {
            await advanceTimeAndBlock(new BigNumber(rebaseInterval).plus(60).toNumber());
        }
        await stoneVault.rollToNextRound({ from: deployer, gas: 3000000 });
        await stopImpersonatingAccount(deployer);

        currentState = await printAllValues("After rollToNextRound (Multiple Withdrawals Settled)", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        assert(new BigNumber(currentState.sv_withdrawingSharesInRound).isZero(), "sv_withdrawingSharesInRound should be 0 after roll");
        const userAReceipt_postRoll = await stoneVault.userReceipts(testUserA);
        const userBReceipt_postRoll = await stoneVault.userReceipts(anotherTestUserB);
        assert(new BigNumber(userAReceipt_postRoll.withdrawableAmount).isGreaterThan(0), "User A should have withdrawable amount");
        assert(new BigNumber(userBReceipt_postRoll.withdrawableAmount).isGreaterThan(0), "User B should have withdrawable amount");

        // --- Step 5: User A Claims ETH ---
        console.log("\n--- Step 5: User A Claims ETH ---");
        await impersonateAccount(testUserA);
        const userAClaimable = new BigNumber((await stoneVault.userReceipts(testUserA)).withdrawableAmount);
        if (userAClaimable.isGreaterThan(0)) {
            console.log(`User A claiming ${fromWei(userAClaimable)} ETH...`);
            await stoneVault.instantWithdraw(userAClaimable.toFixed(0), 0, { from: testUserA });
        } else { console.log("User A has no amount to claim from receipt."); }
        await stopImpersonatingAccount(testUserA);
        currentState = await printAllValues("After User A Claim", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        assert(new BigNumber((await stoneVault.userReceipts(testUserA)).withdrawableAmount).isZero(), "User A withdrawable amount should be 0 after full claim");


        // --- Step 6: User B Claims ETH ---
        console.log("\n--- Step 6: User B Claims ETH ---");
        await impersonateAccount(anotherTestUserB);
        const userBClaimable = new BigNumber((await stoneVault.userReceipts(anotherTestUserB)).withdrawableAmount);
        if (userBClaimable.isGreaterThan(0)) {
            console.log(`User B claiming ${fromWei(userBClaimable)} ETH...`);
            // Ensure AssetsVault has enough for User B's claim
            const assetsVaultBalForB = new BigNumber(await web3.eth.getBalance(assetsVaultAddr));
            const claimAmountForB = assetsVaultBalForB.isLessThan(userBClaimable) ? assetsVaultBalForB : userBClaimable;
            if (claimAmountForB.isGreaterThan(0)) {
                await stoneVault.instantWithdraw(claimAmountForB.toFixed(0), 0, { from: anotherTestUserB });
            } else {
                console.log("User B cannot claim as AssetsVault has insufficient funds for their pending receipt or receipt is 0.");
            }
        } else { console.log("User B has no amount to claim from receipt."); }
        await stopImpersonatingAccount(anotherTestUserB);

        currentState = await printAllValues("Final State after User B Claim Attempt", { name: "UserA", address: testUserA }, { name: "UserB", address: anotherTestUserB });
        // User B might not have fully claimed if AssetsVault was short, so check if it's less than before or zero.
        const userBFinalReceipt = await stoneVault.userReceipts(anotherTestUserB);
        assert(new BigNumber(userBFinalReceipt.withdrawableAmount).isLessThanOrEqualTo(userBClaimable.minus(1)), "User B withdrawable amount should decrease or be zero.");


        console.log("\n======== Test Case 1.3.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 1.3.1: ${e.message}`, e);
        safeExit(e);
    }
};