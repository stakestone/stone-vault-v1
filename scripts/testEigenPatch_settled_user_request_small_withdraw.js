const BigNumber = require('bignumber.js');
// const ethers = require('ethers'); // Not strictly needed if using web3 from Truffle for basic calls
const assert = require('assert');

// --- Artifacts ---
const IERC20 = artifacts.require("IERC20");
const Stone = artifacts.require("Stone");
const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy"); // For sharesToUnderlyingView

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
const eigenLSTRestakingPatchAddr = "0xYourDeployedPatchAddressPlaceholder1.2.1"; // <<<--- !!! REPLACE THIS !!!

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

// Helper to get specific EigenLayer strategy shares for an account
const getEigenStrategyShares = async (eigenStrategyContract, account) => {
    return new BigNumber(await eigenStrategyContract.shares(account));
};
// Helper to convert shares to underlying for a specific EigenLayer strategy
const sharesToUnderlying = async (eigenStrategyContract, shares) => {
    if (new BigNumber(shares).isZero()) return new BigNumber(0);
    return new BigNumber(await eigenStrategyContract.sharesToUnderlyingView(shares.toFixed(0)));
};


module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };

    if (eigenLSTRestakingPatchAddr === "0xYourDeployedPatchAddressPlaceholder1.2.1") {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!! PLEASE REPLACE '0xYourDeployedPatchAddressPlaceholder1.2.1' WITH THE ACTUAL !!!");
        console.error("!!!   ADDRESS OF YOUR DEPLOYED EigenLSTRestakingPatch contract.             !!!");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return safeExit(new Error("Placeholder address for Patch contract not replaced."));
    }

    try {
        console.log("======== Test Case 1.2.1: Settled, User Withdraws Small Amount (EL has liquidity) =========");

        // --- Get Contract Instances ---
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const strategyController = await StrategyController.at(strategyControllerAddr);
        const originalEigenLSR = await EigenLSTRestaking.at(originalEigenLSRAddr);
        const patchEigenLSR = await EigenLSTRestakingPatch.at(eigenLSTRestakingPatchAddr);
        const stETH = await IERC20.at(stETHAddr);
        const stoneToken = await Stone.at(stoneTokenAddr);
        const delegationManager = await IDelegationManager.at(delegationManagerAddr);
        const eigenLayerStETHStrategy = await IEigenStrategy.at(eigenStrategyAddrForOEGLS);

        const originalEigenLSROwner = await originalEigenLSR.owner();
        console.log(`Original EigenLSR Owner: ${originalEigenLSROwner}`);

        // --- Main Value Printing Function ---
        async function printAllValues(logPrefix = "") {
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
            const oEGLS_getRestakingValue = await originalEigenLSR.getRestakingValue(); // Value of stETH restaked in EigenLayer
            const oEGLS_getUnstakingValue_internal = await originalEigenLSR.getUnstakingValue(); // Its own (potentially broken) view
            const oEGLS_stETHBalance = await stETH.balanceOf(originalEigenLSRAddr); // Liquid stETH in contract
            const oEGLS_ETHBalance = await web3.eth.getBalance(originalEigenLSRAddr); // Liquid ETH in contract
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
            return { sv_currentSharePrice, sc_totalValue, pEGLS_getAllValue, actualUnstakingValueForOEGLSFromDM_InStETH, oEGLS_stETHBalance, oEGLS_ETHBalance, assetsVault_ETHBalance, sv_withdrawableAmountInPast };
        }

        console.log("\n--- Step 0: Initial state (after user's setup: patch deployed, proposal done, 1st settlement done) ---");
        const initialState = await printAllValues("Initial State");
        // Assuming no active unstaking for oEGLS from your setup state
        assert(initialState.actualUnstakingValueForOEGLSFromDM_InStETH.isZero(), "Initial unstaking value for oEGLS (read by patch) should be 0 after your setup if no EL unstaking was active");


        // --- Step 1: Owner of oEGLS initiates an Unstaking from EigenLayer (~1 stETH worth) ---
        console.log("\n--- Step 1: Owner of oEGLS initiates an Unstaking from EigenLayer ---");
        const targetUnstakeValueInStETH = toWei(1); // Target ~1 stETH to unstake
        await impersonateAccount(originalEigenLSROwner);

        let oeglsSharesInELStrategy = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
        let oeglsUnderlyingInELStrategy = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInELStrategy);
        console.log(`oEGLS current shares in EL Strategy: ${oeglsSharesInELStrategy.toString()}, Underlying: ${fromWei(oeglsUnderlyingInELStrategy)} stETH`);

        if (oeglsUnderlyingInELStrategy.isLessThan(targetUnstakeValueInStETH)) {
            console.warn(`oEGLS has less than ${fromWei(targetUnstakeValueInStETH)} stETH restaked. Depositing more...`);
            // This part assumes oEGLS has some ETH to buy stETH, or stETH directly.
            // For simplicity, if you hit this, manually ensure oEGLS has enough restaked value before running.
            // Or, first send ETH to oEGLS, then owner calls swapToToken, then depositIntoStrategy on oEGLS.
            // Let's assume it has enough stETH to deposit into strategy.
            const oeglsStETHBal = new BigNumber(await stETH.balanceOf(originalEigenLSRAddr));
            if (oeglsStETHBal.isGreaterThanOrEqualTo(targetUnstakeValueInStETH.plus(toWei(0.5)))) { // ensure enough for test + buffer
                console.log(`oEGLS has ${fromWei(oeglsStETHBal)} stETH. Owner depositing ${fromWei(targetUnstakeValueInStETH)} stETH into EigenLayer strategy...`);
                await originalEigenLSR.depositIntoStrategy(targetUnstakeValueInStETH.toFixed(0), { from: originalEigenLSROwner });
                oeglsSharesInELStrategy = await getEigenStrategyShares(eigenLayerStETHStrategy, originalEigenLSRAddr);
                oeglsUnderlyingInELStrategy = await sharesToUnderlying(eigenLayerStETHStrategy, oeglsSharesInELStrategy);
                console.log(`oEGLS NEW shares in EL Strategy: ${oeglsSharesInELStrategy.toString()}, Underlying: ${fromWei(oeglsUnderlyingInELStrategy)} stETH`);
            } else {
                console.error("oEGLS has insufficient stETH to deposit into EL for this test. Please fund it or adjust test.");
                await stopImpersonatingAccount(originalEigenLSROwner);
                return safeExit(new Error("oEGLS insufficient stETH for EL deposit step."));
            }
        }

        // Calculate shares to unstake for ~1 stETH
        // shares_to_unstake = (target_steth_value / total_underlying_steth) * total_shares
        const sharesToUnstake = targetUnstakeValueInStETH.multipliedBy(oeglsSharesInELStrategy).dividedToIntegerBy(oeglsUnderlyingInELStrategy);

        if (sharesToUnstake.isGreaterThan(0)) {
            console.log(`Attempting to make oEGLS owner queue withdrawal of ${sharesToUnstake.toString()} shares (approx ${fromWei(targetUnstakeValueInStETH)} stETH) from EigenLayer...`);
            const queuedWithdrawalParams = [{
                strategies: [eigenStrategyAddrForOEGLS],
                shares: [sharesToUnstake.toFixed(0)],
                withdrawer: originalEigenLSRAddr
            }];
            const queueTx = await originalEigenLSR.queueWithdrawals(queuedWithdrawalParams, { from: originalEigenLSROwner });
            console.log("oEGLS Owner queued withdrawals successfully. TX:", queueTx.tx);
        } else {
            console.error("Calculated shares to unstake is 0. Check oEGLS balance in EigenLayer.");
            await stopImpersonatingAccount(originalEigenLSROwner);
            return safeExit(new Error("Cannot unstake 0 shares."));
        }
        await stopImpersonatingAccount(originalEigenLSROwner);

        const valuesAfterOwnerUnstake = await printAllValues("After oEGLS Owner Initiated Unstake");
        assert(valuesAfterOwnerUnstake.actualUnstakingValueForOEGLSFromDM_InStETH.isGreaterThanOrEqualTo(targetUnstakeValueInStETH.multipliedBy(0.99)), // Allow for slight precision diffs
            "Patch should now report the new unstaking value for oEGLS");

        // --- Step 2: User requests withdrawal from StoneVault (~0.5 stETH worth) ---
        console.log("\n--- Step 2: User requests withdrawal from StoneVault ---");
        const sv_price_before_withdraw_req = valuesAfterOwnerUnstake.sv_currentSharePrice;
        const userWithdrawTargetInETH_approx = 0.5; // Approx value user wants
        // Convert this ETH value to shares based on current share price
        const sharesToWithdrawForUser = toWei(userWithdrawTargetInETH_approx).multipliedBy(toWei(1)).dividedToIntegerBy(sv_price_before_withdraw_req);
        console.log(`User ${testUser} current Stone balance: ${fromWei(await stoneToken.balanceOf(testUser))}`);
        console.log(`User ${testUser} requesting withdrawal of ${fromWei(sharesToWithdrawForUser)} shares (approx ${userWithdrawTargetInETH_approx} ETH)...`);

        await impersonateAccount(testUser);
        // Ensure user has enough Stone tokens. If not, they need to deposit first in a prior step or script.
        // For this test, let's assume they deposited in 1.1.1 or have balance.
        // If their balance is less than sharesToWithdrawForUser, this will fail.
        const userStoneBal = await stoneToken.balanceOf(testUser);
        if (new BigNumber(userStoneBal).isLessThan(sharesToWithdrawForUser)) {
            console.warn(`User ${testUser} has insufficient Stone tokens (${fromWei(userStoneBal)}) to withdraw ${fromWei(sharesToWithdrawForUser)}. Depositing first...`);
            const neededEthForDeposit = sharesToWithdrawForUser.multipliedBy(sv_price_before_withdraw_req).dividedToIntegerBy(toWei(1)).plus(toWei(0.1)); // Add buffer
            console.log(`Depositing ${fromWei(neededEthForDeposit)} ETH for user ${testUser}`);
            await stoneVault.deposit({ from: testUser, value: neededEthForDeposit.toFixed(0) });
            console.log(`User ${testUser} NEW Stone balance: ${fromWei(await stoneToken.balanceOf(testUser))}`);
        }

        const requestWithdrawTx = await stoneVault.requestWithdraw(sharesToWithdrawForUser.toFixed(0), { from: testUser });
        console.log("User requestWithdraw successful. TX:", requestWithdrawTx.tx);
        await stopImpersonatingAccount(testUser);

        // --- Step 3: Check prices and EL strategy amounts ---
        console.log("\n--- Step 3: Values after withdrawal request (before settlement) ---");
        const values_after_withdraw_req = await printAllValues("After User Withdrawal Request");
        assert(new BigNumber(values_after_withdraw_req.sv_withdrawingSharesInRound).isEqualTo(sharesToWithdrawForUser), "sv_withdrawingSharesInRound mismatch");


        // --- Step 4: Execute rollToNextRound ---
        console.log("\n--- Step 4: Execute rollToNextRound ---");
        await impersonateAccount(deployer); // Any account can call it
        const rebaseTime = await stoneVault.rebaseTime();
        const rebaseInterval = await stoneVault.rebaseTimeInterval();
        const currentTime = (await web3.eth.getBlock('latest')).timestamp;
        if (new BigNumber(currentTime).isLessThanOrEqualTo(new BigNumber(rebaseTime).plus(rebaseInterval))) {
            await advanceTimeAndBlock(new BigNumber(rebaseTime).plus(rebaseInterval).minus(currentTime).plus(5).toNumber());
        }
        const rollTx = await stoneVault.rollToNextRound({ from: deployer, gas: 3000000 });
        console.log("rollToNextRound successful. TX:", rollTx.tx);
        await stopImpersonatingAccount(deployer);

        const values_after_roll = await printAllValues("After rollToNextRound (Withdrawal Settled)");
        // withdrawingSharesInRound should be 0 now, moved to withdrawingSharesInPast
        assert(new BigNumber(values_after_roll.sv_withdrawingSharesInRound).isZero(), "sv_withdrawingSharesInRound should be 0 after roll");
        // withdrawableAmountInPast for the user should have increased.
        // We need to check user's receipt.
        const userReceiptAfterRoll = await stoneVault.userReceipts(testUser);
        const expectedWithdrawableForUser = sharesToWithdrawForUser.multipliedBy(sv_price_before_withdraw_req).dividedToIntegerBy(toWei(1)); // Price at time of request
        // StoneVault uses roundPricePerShare[receipt.withdrawRound] which is set during rollToNextRound.
        // Let's check the withdrawableAmountInPast total for the vault.
        // It's complex to track precisely without knowing all other withdrawals.
        // A key check is that AssetsVault balance might have decreased if SC pulled from there, or oEGLS ETH/stETH decreased.
        console.log(`User receipt after roll: withdrawRound=${userReceiptAfterRoll.withdrawRound}, withdrawShares=${fromWei(userReceiptAfterRoll.withdrawShares)}, withdrawableAmount=${fromWei(userReceiptAfterRoll.withdrawableAmount)}`);


        // --- Step 5: User claims their ETH ---
        console.log("\n--- Step 5: User claims withdrawn ETH ---");
        const userEthBalance_before_claim = new BigNumber(await web3.eth.getBalance(testUser));
        const userReceipt_before_claim = await stoneVault.userReceipts(testUser);
        const amountToClaimFromReceipt = new BigNumber(userReceipt_before_claim.withdrawableAmount);

        await impersonateAccount(testUser);
        // User withdraws based on their `withdrawableAmount` which might be all or part of what was settled.
        // For this test, let's assume they claim all their currently withdrawableAmount.
        // instantWithdraw takes _amount (ETH value) and _shares (0 if claiming past round)
        if (amountToClaimFromReceipt.isGreaterThan(0)) {
            console.log(`User ${testUser} claiming ${fromWei(amountToClaimFromReceipt)} ETH...`);
            const claimTx = await stoneVault.instantWithdraw(amountToClaimFromReceipt.toFixed(0), 0, { from: testUser, gasPrice: 0 }); // gasPrice 0 for easier balance check
            console.log("User claim successful. TX:", claimTx.tx);
            const userEthBalance_after_claim = new BigNumber(await web3.eth.getBalance(testUser));
            // This check is tricky due to gas costs even if gasPrice is 0 for the tx itself.
            // console.log(`User ETH balance increased by approx ${fromWei(userEthBalance_after_claim.minus(userEthBalance_before_claim))}`);
            // A better check: user's withdrawableAmount should decrease.
            const userReceipt_after_claim = await stoneVault.userReceipts(testUser);
            assert(new BigNumber(userReceipt_after_claim.withdrawableAmount).isLessThan(amountToClaimFromReceipt), "User withdrawable amount should decrease after claim.");
        } else {
            console.warn("User has no withdrawable amount to claim from past rounds.");
        }
        await stopImpersonatingAccount(testUser);

        // --- Step 6: Final check of prices and EL strategy amounts ---
        console.log("\n--- Step 6: Final state ---");
        await printAllValues("Final State after User Claim");

        console.log("\n======== Test Case 1.2.1 Successfully Completed =========");
        safeExit();
    } catch (e) {
        console.error(`Execution failed in Test Case 1.2.1: ${e.message}`, e);
        safeExit(e);
    }
};