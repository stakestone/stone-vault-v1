const BigNumber = require('bignumber.js');
const ethers = require('ethers');
const assert = require('assert');

const Abi = web3.eth.abi;

// --- Artifacts ---
const IERC20 = artifacts.require("IERC20");
const EigenLSTRestaking = artifacts.require("EigenLSTRestaking"); // oEGLS
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch"); // pEGLS
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const AssetsVault = artifacts.require("AssetsVault");

const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const testUser = "0x22d130d251286e17b029d557d2928c5956efa8c4";

const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const minterAddr = "0xEc306E46549A7E8f4fCE823D3058f2D134133B17";
const stoneTokenAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
const assetsVaultAddr = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
const strategyControllerAddr_fromVault = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";

const eigenLSTRestakingAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982"; // oEGLS address
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddr = "0x93c4b944D05dfe6df7645A86cd2206016c51564D"; // stETH strategy in EigenLayer for oEGLS

// ABI for DelegationManager.queueWithdrawals (ensure this matches the target)
const queueAbi = {
    "inputs": [{ "components": [{ "internalType": "contract IStrategy[]", "name": "strategies", "type": "address[]" }, { "internalType": "uint256[]", "name": "shares", "type": "uint256[]" }, { "internalType": "address", "name": "withdrawer", "type": "address" }], "internalType": "struct IDelegationManager.QueuedWithdrawalParams[]", "name": "queuedWithdrawalParams", "type": "tuple[]" }], // Adjusted params name and structure
    "name": "queueWithdrawals", "outputs": [{ "internalType": "bytes32[]", "name": "withdrawalRoots", "type": "bytes32[]" }], "stateMutability": "nonpayable", "type": "function"
};
// Helper to advance blocks
async function advanceBlocks(provider, blocks) {
    for (let i = 0; i < blocks; i++) {
        await provider.send("evm_mine", []);
    }
    console.log(`Advanced ${blocks} blocks.`);
}
// Helper to advance time
async function advanceTime(provider, seconds) {
    await provider.send("evm_increaseTime", [seconds]);
    await provider.send("evm_mine", []); // Mine a block to make time change effective
    console.log(`Advanced time by ${seconds} seconds.`);
}
module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') { callback(error); }
        else { if (error) console.error(error); process.exit(error ? 1 : 0); }
    };

    try {

        console.log("======== P_Scenario 1.3: oEGLS Queues New Withdrawals due to StoneVault.instantWithdraw Force; pEGLS Detects Increase =========");

        const provider = new ethers.providers.JsonRpcProvider("http://localhost:7777");

        await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_impersonateAccount", params: [deployer], id: Date.now() });
        await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_impersonateAccount", params: [testUser], id: Date.now() + 1 });

        const oEGLS = await EigenLSTRestaking.at(eigenLSTRestakingAddr);
        const stETH = await IERC20.at(stETHAddr);
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const stoneTokenAddr = await stoneVault.stone();
        const stoneToken = await IERC20.at(stoneTokenAddr);
        const assetsVaultAddr = await stoneVault.assetsVault();
        const assetsVault = await AssetsVault.at(assetsVaultAddr);
        const strategyControllerAddr_fromVault = await stoneVault.strategyController();
        const strategyController = await StrategyController.at(strategyControllerAddr_fromVault);

        // Deploy pEGLS
        const pEGLS = await EigenLSTRestakingPatch.new(
            strategyControllerAddr_fromVault, // _controller for StrategyV2
            "EigenLST Patch (P_Scenario 1.3)",
            delegationManagerAddr,
            eigenStrategyAddr,
            eigenLSTRestakingAddr, // pEGLS reads state of oEGLS
            { from: deployer, gas: 2000000 }
        );
        console.log("pEGLS deployed at:", pEGLS.address);

        // --- 1. Ensure oEGLS is Funded ---
        console.log("\n--- Phase 1: Ensure oEGLS is Funded via StoneVault Deposit & Rebalance ---");
        const initialOEglsEthBalance = await web3.eth.getBalance(oEGLS.address);
        const initialOEglsStEthBalance = await stETH.balanceOf(oEGLS.address);
        const initialOEglsRestakingVal = await oEGLS.getRestakingValue.call();
        console.log(`oEGLS Initial ETH: ${BigNumber(initialOEglsEthBalance).div(1e18)} STETH: ${BigNumber(initialOEglsStEthBalance).div(1e18)} Restaked: ${BigNumber(initialOEglsRestakingVal).div(1e18)}`);

        const depositAmountETH = BigNumber(web3.utils.toWei("3", "ether")); // User deposits 
        console.log(`testUser depositing ${depositAmountETH.div(1e18)} ETH into StoneVault...`);
        await stoneVault.deposit({ from: testUser, value: depositAmountETH.toString(10) });
        console.log("Deposit successful.");

        const userStoneBalanceAfterDeposit = await stoneToken.balanceOf(testUser);
        console.log(`testUser Stone Token balance after deposit: ${BigNumber(userStoneBalanceAfterDeposit).div(1e18)}`);
        assert(BigNumber(userStoneBalanceAfterDeposit).isGreaterThan(0), "User should receive Stone tokens");

        console.log("Advancing time and calling stoneVault.rollToNextRound() to allocate funds to strategies...");
        const rebaseInterval = await stoneVault.rebaseTimeInterval();
        await advanceTime(provider, rebaseInterval.toNumber() + 60); // Advance past interval
        const rollTx = await stoneVault.rollToNextRound({ from: deployer, gas: 1500000 }); // Higher gas for rebalance
        console.log("rollToNextRound called. Tx:", rollTx.tx);

        const oeglsRestakingValAfterAlloc = await oEGLS.getRestakingValue.call();
        const oeglsEthBalanceAfterAlloc = await web3.eth.getBalance(oEGLS.address);
        const oeglsStEthBalanceAfterAlloc = await stETH.balanceOf(oEGLS.address);

        //
        console.log("DEBUG: Raw initialOEglsEthBalance:", initialOEglsEthBalance.toString());
        console.log("DEBUG: Raw oeglsEthBalanceAfterAlloc:", oeglsEthBalanceAfterAlloc.toString());

        const bnInitialEth = BigNumber(initialOEglsEthBalance);
        const bnAfterAllocEth = BigNumber(oeglsEthBalanceAfterAlloc);

        console.log("DEBUG: bnInitialEth:", bnInitialEth.toString());
        console.log("DEBUG: bnAfterAllocEth:", bnAfterAllocEth.toString());
        console.log("DEBUG: bnAfterAllocEth.isGreaterThan(bnInitialEth):", bnAfterAllocEth.isGreaterThan(bnInitialEth));
        console.log("DEBUG: Type of initialOEglsEthBalance:", typeof initialOEglsEthBalance); // Should be string
        console.log("DEBUG: Type of oeglsEthBalanceAfterAlloc:", typeof oeglsEthBalanceAfterAlloc); // Should be string

        console.log(`oEGLS ETH after alloc: ${BigNumber(oeglsEthBalanceAfterAlloc).div(1e18)} STETH: ${BigNumber(oeglsStEthBalanceAfterAlloc).div(1e18)} Restaked: ${BigNumber(oeglsRestakingValAfterAlloc).div(1e18)}`);
        assert(
            BigNumber(oeglsRestakingValAfterAlloc).isGreaterThan(initialOEglsRestakingVal) ||
            BigNumber(oeglsEthBalanceAfterAlloc).isGreaterThan(initialOEglsEthBalance) ||
            BigNumber(oeglsStEthBalanceAfterAlloc).isGreaterThan(initialOEglsStEthBalance),
            "Funds should have reached oEGLS strategy or its restaking value increased."
        );

        // --- 2. Ensure AssetsVault has Low ETH ---
        console.log("\n--- Phase 2: Ensure AssetsVault has Low ETH ---");
        const currentAssetsVaultETH = await web3.eth.getBalance(assetsVault.address);
        console.log(`AssetsVault current ETH: ${BigNumber(currentAssetsVaultETH).div(1e18)}`);
        if (BigNumber(currentAssetsVaultETH).isGreaterThan(web3.utils.toWei("0.1", "ether"))) {
            console.log("AssetsVault has more than 0.1 ETH. Draining excess to deployer (simulating funds being in strategies)...");
            const amountToDrain = BigNumber(currentAssetsVaultETH).minus(web3.utils.toWei("0.05", "ether")); // Leave a tiny bit
            if (amountToDrain.isGreaterThan(0)) {
                // StoneVault or StrategyController are permitted to withdraw from AssetsVault
                // Impersonate StoneVault to call withdraw on AssetsVault
                await web3.eth.sendTransaction({
                    from: testUser,
                    to: stoneVaultAddr,
                    value: BigNumber(1e16).toString(10)
                });
                const stoneVaultAddrETH = await web3.eth.getBalance(stoneVaultAddr);
                console.log("DEBUG: stoneVaultAddrETH:", BigNumber(stoneVaultAddrETH).toString());

                await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_impersonateAccount", params: [stoneVaultAddr], id: Date.now() + 6 });
                await assetsVault.withdraw(deployer, amountToDrain.toString(10), { from: stoneVaultAddr, gas: 300000 });
                await web3.currentProvider.send({ jsonrpc: "2.0", method: "anvil_stopImpersonatingAccount", params: [stoneVaultAddr], id: Date.now() + 7 });
                console.log(`Drained ${amountToDrain.div(1e18)} ETH from AssetsVault to ${deployer}.`);
            }
        }
        const lowAssetsVaultETH = await web3.eth.getBalance(assetsVault.address);
        console.log(`AssetsVault ETH is now low: ${BigNumber(lowAssetsVaultETH).div(1e18)}`);
        assert(BigNumber(lowAssetsVaultETH).isLessThanOrEqualTo(web3.utils.toWei("0.1", "ether")), "AssetsVault ETH should be low");

        // --- 3. Pre-Action State Recording ---
        console.log("\n--- Phase 3: Pre-Action State Recording ---");
        const userStoneBalance_before = await stoneToken.balanceOf(testUser);
        const userEthBalance_before = await web3.eth.getBalance(testUser);
        const R_before = await oEGLS.getRestakingValue.call();
        const P_before = await pEGLS.getAllValue.call();
        const oEGLS_unstaking_broken_before = await oEGLS.getUnstakingValue();

        console.log(`testUser Stone Balance: ${BigNumber(userStoneBalance_before).div(1e18)}`);
        console.log(`oEGLS getRestakingValue (R_before): ${BigNumber(R_before).div(1e18)}`);
        console.log(`pEGLS getAllValue (P_before): ${BigNumber(P_before).div(1e18)}`);
        console.log(`oEGLS getUnstakingValue (broken, before): ${BigNumber(oEGLS_unstaking_broken_before).div(1e18)}`);


        // --- 4. Action: testUser calls StoneVault.instantWithdraw(), forcing strategy withdrawal ---
        console.log("\n--- Phase 4: User calls StoneVault.instantWithdraw() ---");
        // Withdraw a significant portion of user's Stone tokens, enough to trigger forceWithdraw
        const sharesToWithdrawFromVault = BigNumber(userStoneBalance_before).dividedBy(2).integerValue(BigNumber.ROUND_FLOOR); // Withdraw 50%
        console.log(`testUser attempting to instantWithdraw ${sharesToWithdrawFromVault.div(1e18)} Stone shares...`);

        // Store oEGLS ETH balance before its instantWithdraw is called by StrategyController
        const oEGLS_eth_before_instant_withdraw = await web3.eth.getBalance(oEGLS.address);

        const instantWithdrawTx = await stoneVault.instantWithdraw(0, sharesToWithdrawFromVault.toString(10), { from: testUser, gas: 2000000 });
        console.log("StoneVault.instantWithdraw called. Tx:", instantWithdrawTx.tx);
        // This should have triggered: stoneVault -> strategyController.forceWithdraw -> oEGLS.instantWithdraw
        // We assume oEGLS.instantWithdraw returns what it can from its balance.

        // Check if oEGLS tried to use its ETH balance
        const oEGLS_eth_after_instant_withdraw_call = await web3.eth.getBalance(oEGLS.address);
        const ethUsedByOEGLSInstantWithdraw = BigNumber(oEGLS_eth_before_instant_withdraw).minus(oEGLS_eth_after_instant_withdraw_call);
        console.log(`ETH potentially used by oEGLS.instantWithdraw: ${ethUsedByOEGLSInstantWithdraw.div(1e18)}`);

        // **** SIMULATION OF SYSTEM RESPONSE TO SHORTFALL ****
        // Since oEGLS.instantWithdraw (as per provided contract) only gives its ETH balance,
        // and doesn't queue on EigenLayer, we simulate the next step:
        // The system (StoneVault/StrategyController) realizes there's a shortfall from oEGLS's instantWithdraw
        // and instructs oEGLS to queue a formal withdrawal from EigenLayer.
        // We'll use deployer (as owner of oEGLS) to invoke queueWithdrawals on DelegationManager.
        // The amount of shares to queue would depend on the shortfall. For this test, let's pick a fixed amount
        // that oEGLS *should* have restaked from the earlier deposit.
        const sharesToForceQueueFromOEGLS = BigNumber(oeglsRestakingValAfterAlloc).minus(R_before).dividedBy(2).integerValue(BigNumber.ROUND_FLOOR); // Queue ~half of what was newly restaked. Min 1 share.
        if (sharesToForceQueueFromOEGLS.isGreaterThan(0)) {
            console.log(`Simulating system instructing oEGLS to queue ${sharesToForceQueueFromOEGLS.div(1e18)} shares on EigenLayer due to instantWithdraw shortfall...`);
            // Construct params for IDelegationManager.queueWithdrawals
            // 'withdrawer' is oEGLS itself as it's the staker.
            const queueCallData = web3.eth.abi.encodeFunctionCall(queueAbi, [
                [{
                    "strategies": [eigenStrategyAddr],
                    "shares": [sharesToForceQueueFromOEGLS.toString(10)],
                    "withdrawer": eigenLSTRestakingAddr
                }]
            ]);
            // deployer (as owner of oEGLS) invokes queueWithdrawals on DelegationManager
            const oeglsQueueTx = await oEGLS.invoke(
                delegationManagerAddr,
                queueCallData,
                { from: deployer, gas: 600000 }
            );
            console.log("oEGLS invoked queueWithdrawals on DelegationManager (simulated force). Tx:", oeglsQueueTx.tx);
        } else {
            console.log("No new shares were restaked in oEGLS to force queue, or calculation error. Skipping forced queue.");
            // This might happen if the initial funding of oEGLS didn't lead to an increase in getRestakingValue
            // that is then used to calculate sharesToForceQueueFromOEGLS.
            // If R_before was already high from forked state, (oeglsRestakingValAfterAlloc - R_before) might be small/zero.
            // To ensure queuing, pick a fixed amount known to be restaked if the dynamic calc is tricky.
            // E.g., const sharesToForceQueueFromOEGLS = BigNumber("10").times(1e18); // if 10 shares are known to be restakable.
        }


        // --- 5. Post-Action State Recording & Assertions ---
        console.log("\n--- Phase 5: Post-Action State Recording & Assertions ---");
        const userStoneBalance_after = await stoneToken.balanceOf(testUser);
        const userEthBalance_after = await web3.eth.getBalance(testUser);
        const R_after = await oEGLS.getRestakingValue.call();
        const P_after = await pEGLS.getAllValue.call();
        const oEGLS_unstaking_broken_after = await oEGLS.getUnstakingValue.call();
        const assetsVaultEth_after = await web3.eth.getBalance(assetsVaultAddr);

        console.log(`testUser Stone Balance after: ${BigNumber(userStoneBalance_after).div(1e18)}`);
        console.log(`testUser ETH Balance after: ${BigNumber(userEthBalance_after).div(1e18)}`);
        console.log(`AssetsVault ETH after: ${BigNumber(assetsVaultEth_after).div(1e18)}`);
        console.log(`oEGLS getRestakingValue (R_after): ${BigNumber(R_after).div(1e18)}`);
        console.log(`pEGLS getAllValue (P_after): ${BigNumber(P_after).div(1e18)}`);
        console.log(`oEGLS getUnstakingValue (broken, after): ${BigNumber(oEGLS_unstaking_broken_after).div(1e18)}`);

        // Assertions
        assert(BigNumber(userStoneBalance_after).isEqualTo(BigNumber(userStoneBalance_before).minus(sharesToWithdrawFromVault)), "User Stone balance should decrease by withdrawn shares");
        assert(BigNumber(userEthBalance_after).isGreaterThan(userEthBalance_before), "User ETH balance should increase");

        if (sharesToForceQueueFromOEGLS.isGreaterThan(0)) {
            assert(BigNumber(R_after).isLessThan(R_before), "oEGLS restaking value should decrease after queuing");
            assert(BigNumber(P_after).isGreaterThan(P_before), "pEGLS unstaking value should increase after oEGLS queues shares");

            const increaseInPatch = BigNumber(P_after).minus(P_before);
            const decreaseInOEGLSRestaking = BigNumber(R_before).minus(R_after);
            console.log(`Increase in pEGLS value: ${increaseInPatch.div(1e18)}`);
            console.log(`Decrease in oEGLS restaking value: ${decreaseInOEGLSRestaking.div(1e18)}`);
            assert(
                increaseInPatch.minus(decreaseInOEGLSRestaking).abs().div(1e18).isLessThan("0.0001"),
                "Increase in patch's value should match decrease in oEGLS's restaking value"
            );
            assert(
                BigNumber(oEGLS_unstaking_broken_after).isEqualTo(oEGLS_unstaking_broken_before) || BigNumber(oEGLS_unstaking_broken_after).isZero(),
                "oEGLS (broken) unstaking view should remain incorrect."
            );
        } else {
            console.warn("Skipped assertions on R_after/P_after changes as no shares were force-queued from oEGLS in this run.");
            assert(BigNumber(P_after).isEqualTo(P_before), "pEGLS value should not change if no shares were queued from oEGLS.");
        }

        console.log("======== End of P_Scenario 1.3 =========");
        safeExit();
    } catch (e) {
        console.error("Execution failed in P_Scenario 1.3:", {
            message: e.message,
            stack: e.stack,
            receipt: e.receipt
        });
        safeExit(e);
    }
};