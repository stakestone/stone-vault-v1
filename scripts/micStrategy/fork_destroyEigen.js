// truffle exec scripts/withdraw_from_eigenlayer.js --network test
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:7777');
const BigNumber = require('bignumber.js');
const timeTravel = require("./timeTravel");
const Abi = web3.eth.abi;
const ethers = require('ethers'); // 引入 ethers 库
const assert = require('assert');

const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const IEigenStrategy = artifacts.require("IEigenStrategy");
const IERC20 = artifacts.require("IERC20");
const ILidoWithdrawalQueue = artifacts.require("ILidoWithdrawalQueue");
const IDelegationManager = artifacts.require("IDelegationManager");
const StrategyController = artifacts.require("StrategyController");
const StoneVault = artifacts.require("StoneVault");
const MultiSigStrategy = artifacts.require("MultiSigStrategy");
const Proposal = artifacts.require("Proposal");
const Stone = artifacts.require("Stone");
const toWei = (amount, decimals = 18) => new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals));
const fromWei = (amount, decimals = 18) => new BigNumber(String(amount)).dividedBy(new BigNumber(10).pow(decimals));
const safeToBN = (value) => {
    if (value === undefined || value === null) return new BigNumber(0);
    try {
        return new BigNumber(value.toString());
    } catch (e) {
        console.error(`Failed to convert value to BigNumber:`, value);
        return new BigNumber(0);
    }
};
const provider = new ethers.providers.JsonRpcProvider({
    url: "http://localhost:7777",
    timeout: 360000 // 设置客户端超时为 6 分钟 (360000 ms)，大于 Anvil 的 5 分钟
});
// 提供的ABI
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

const completeWithdrawalAbi = {
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
const errorsAbi = [{
    "inputs": [],
    "name": "ActivelyDelegated",
    "type": "error"
}, {
    "inputs": [],
    "name": "CallerCannotUndelegate",
    "type": "error"
}, {
    "inputs": [],
    "name": "CurrentlyPaused",
    "type": "error"
}, {
    "inputs": [],
    "name": "FullySlashed",
    "type": "error"
}, {
    "inputs": [],
    "name": "InputAddressZero",
    "type": "error"
}, {
    "inputs": [],
    "name": "InputArrayLengthMismatch",
    "type": "error"
}, {
    "inputs": [],
    "name": "InputArrayLengthZero",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidNewPausedStatus",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidPermissions",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidSnapshotOrdering",
    "type": "error"
}, {
    "inputs": [],
    "name": "NotActivelyDelegated",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyAllocationManager",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyEigenPodManager",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyPauser",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyStrategyManagerOrEigenPodManager",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyUnpauser",
    "type": "error"
}, {
    "inputs": [],
    "name": "OperatorNotRegistered",
    "type": "error"
}, {
    "inputs": [],
    "name": "OperatorsCannotUndelegate",
    "type": "error"
}, {
    "inputs": [],
    "name": "SaltSpent",
    "type": "error"
}, {
    "inputs": [],
    "name": "SignatureExpired",
    "type": "error"
}, {
    "inputs": [{
        "internalType": "string",
        "name": "str",
        "type": "string"
    }],
    "name": "StringTooLong",
    "type": "error"
}, {
    "inputs": [],
    "name": "WithdrawalDelayNotElapsed",
    "type": "error"
}, {
    "inputs": [],
    "name": "WithdrawalNotQueued",
    "type": "error"
}, {
    "inputs": [],
    "name": "WithdrawerNotCaller",
    "type": "error"
}];
// 常量地址
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const LIDO_WITHDRAWAL_QUEUE_ADDR = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const EIGENLAYER_ADDR = "0x93c4b944d05dfe6df7645a86cd2206016c51564d";
const DELEGATION_MANAGER_ADDR = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
const stoneAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
const assetsVaultAddr = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";
const proposalAddr = "0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b";
const multiSigStrategyAddr = "0x8f4998661618c5cc5dbcc0ae19923d6537622180";
const eigenLSTRestakingPatchAddr = "0xf1670996a123042fDa40c14e13B52318D2f78E90";
const eigenLSTRestakingAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const multiSigAddress = "0x3e32D3ffD97EDD79F7e4922BC3BF6aD0ADF95F34";
const proposer = "0x83000EF01eD5C15462ef20066091Abd3654e523f";
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const normalUser = "0xC15951C814B618b6f52cBc7015d6FC16e2d3d4bE";
const majorHolder = "0x5717499f3F89e47aDDd714c1f12718A36B8a1Fae"; // 870 Stone
const MINIMUM_REBASE_INTERVAL = 7 * 24 * 60 * 60;
const minVotePeriod = 24 * 60 * 60;
// 区块推进函数
const mineBlocks = async (blockCount) => {
    console.log(`\n⏳ 推进 ${blockCount} 个区块...`);
    const startTime = Date.now();

    let remaining = blockCount;
    const batchSize = 1000;

    while (remaining > 0) {
        const currentBatch = Math.min(batchSize, remaining);
        await timeTravel.blocks(currentBatch);
        remaining -= currentBatch;

        const progress = ((blockCount - remaining) / blockCount * 100).toFixed(1);
        console.log(`  已推进 ${blockCount - remaining}/${blockCount} [${progress}%]`);
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ 推进完成，耗时 ${totalTime} 秒`);
};

// 解锁账户函数
const unlockAccounts = async (accounts) => {
    for (let account of accounts) {
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [account],
            id: Date.now()
        });
        console.log(`✅ 已解锁: ${account}`);
    }
};
//充值
const fundAccount = async (account, amountInETH) => {
    console.log(`fund Account ${account} with ${amountInETH}...`);
    const amountInWei = ethers.utils.parseEther(amountInETH.toString());
    await provider.send("anvil_setBalance", [
        account,
        amountInWei.toHexString()
    ]);
    console.log(`成功充值 ${amountInETH} ETH 到地址 ${account}`);
};
// 获取排队中的提款
const getPendingWithdrawals = async (eigenLSTRestaking) => {
    try {
        const withdrawalRoots = await eigenLSTRestaking.getWithdrawalRoots();
        console.log(`发现 ${withdrawalRoots.length} 个排队中的提款`);

        const withdrawals = [];
        for (let root of withdrawalRoots) {
            const shares = await eigenLSTRestaking.withdrawingShares(root);
            withdrawals.push({
                root: root,
                shares: new BigNumber(shares.toString())
            });
            console.log(`提款根: ${root}, 份额: ${web3.utils.fromWei(shares.toString(), 'ether')}`);
        }

        return withdrawals;
    } catch (error) {
        console.log("获取排队提款失败:", error.message);
        return [];
    }
};
// 打印所有合约信息的函数
async function printAllValues(logPrefix = "", ...usersToLogReceipts) {
    console.log(`${logPrefix}--- VALUES ---`);
    const sv_currentSharePrice = await stoneVault.currentSharePrice.call();
    const sv_totalStoneSupply = await stoneToken.totalSupply();
    const sv_withdrawableAmountInPast = await stoneVault.withdrawableAmountInPast();
    const result = await stoneVault.getVaultAvailableAmount.call();
    const sv_asset_idleAmount = result.idleAmount;
    const sv_asset_investedAmount = result.investedAmount;
    const sv_withdrawingSharesInPast = await stoneVault.withdrawingSharesInPast();
    const sv_withdrawingSharesInRound = await stoneVault.withdrawingSharesInRound();
    const sv_latestRoundID = await stoneVault.latestRoundID();
    const sv_rebaseTime = await stoneVault.rebaseTime();

    console.log(`${logPrefix}StoneVault - Current Share Price:`, fromWei(sv_currentSharePrice).toString(10));
    console.log(`${logPrefix}StoneVault - Total Stone Supply:`, fromWei(sv_totalStoneSupply).toString(10));
    console.log(`${logPrefix}StoneVault - Withdrawable Amount (Past Rounds Total):`, fromWei(sv_withdrawableAmountInPast).toString(10));
    console.log(`${logPrefix}StoneVault - Idle Amount (in Vault):`, fromWei(sv_asset_idleAmount).toString(10));
    console.log(`${logPrefix}StoneVault - Invested Amount (in Strategies):`, fromWei(sv_asset_investedAmount).toString(10));
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

    const oEGLS_getAllValue = await eigenLSTRestaking.getAllValue.call();
    const oEGLS_getRestakingValue = await eigenLSTRestaking.getRestakingValue.call();
    const oEGLS_getUnstakingValue = await eigenLSTRestaking.getUnstakingValue.call();
    const oEGLS_stETHBalance = await stETH.balanceOf(eigenLSTRestakingAddr);
    const oEGLS_ETHBalance = await web3.eth.getBalance(eigenLSTRestakingAddr);
    const oEGLS_activeShares = new BigNumber((await eigenLayer.shares(eigenLSTRestakingAddr)).toString());
    // 获取可提取和待处理的资产
    const pendingAssets = await eigenLSTRestaking.checkPendingAssets.call();
    // console.log("Raw pendingAssets:", pendingAssets);
    // 如果返回对象，检查其结构：
    console.log("Pending assets keys:", Object.keys(pendingAssets));
    const claimableValue = pendingAssets[1];
    const pendingValue = pendingAssets[2];

    console.log(`${logPrefix}Original oEGLS - Reported getAllValue:`, fromWei(oEGLS_getAllValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - ETH Balance:`, fromWei(oEGLS_ETHBalance).toString(10));
    console.log(`${logPrefix}Original oEGLS - stETH Balance (liquid):`, fromWei(oEGLS_stETHBalance).toString(10));
    console.log(`${logPrefix}Original oEGLS - Restaking Value (stETH in EL):`, fromWei(oEGLS_getRestakingValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - Unstaking Value (its internal view):`, fromWei(oEGLS_getUnstakingValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - claimableValue(Lido可提取的):`, fromWei(claimableValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - pendingValue(Lido待提取的stETH):`, fromWei(pendingValue).toString(10));
    console.log(`${logPrefix}Original oEGLS - activeShares(活跃份额):`, fromWei(oEGLS_activeShares).toString(10));

    const pEGLS_getAllValue = await eigenLSTRestakingPatch.getAllValue.call();
    const pEGLS_ETHBalance = await web3.eth.getBalance(eigenLSTRestakingPatchAddr);
    console.log(`${logPrefix}Patch pEGLS - Reported getAllValue:`, fromWei(pEGLS_getAllValue).toString(10));
    console.log(`${logPrefix}Patch pEGLS - ETH Balance (should be 0):`, fromWei(pEGLS_ETHBalance).toString(10));

    const assetsVault_ETHBalance = await web3.eth.getBalance(assetsVaultAddr);
    console.log(`${logPrefix}AssetsVault - ETH Balance:`, fromWei(assetsVault_ETHBalance).toString(10));
    console.log(`${logPrefix}----------------`);
    // ==========策略相关=========
    const multiSigStrategy_getAllValue = await multiSigStrategy.getAllValue.call();
    console.log(`${logPrefix}multiSigStrategy_getAllValue:`, fromWei(multiSigStrategy_getAllValue).toString(10));
    const multiSigStrategy_ETHBalance = await web3.eth.getBalance(multiSigStrategyAddr);
    console.log(`${logPrefix}multiSigStrategy - ETH Balance:`, fromWei(multiSigStrategy_ETHBalance).toString(10));

    return {
        sv_currentSharePrice: safeToBN(sv_currentSharePrice),
        sv_asset_idleAmount: safeToBN(sv_asset_idleAmount),
        sv_asset_investedAmount: safeToBN(sv_asset_investedAmount),
        oEGLS_getAllValue: safeToBN(oEGLS_getAllValue),
        oEGLS_getRestakingValue: safeToBN(oEGLS_getRestakingValue),
        oEGLS_getUnstakingValue: safeToBN(oEGLS_getUnstakingValue),
        oEGLS_ETHBalance: safeToBN(oEGLS_ETHBalance),
        oEGLS_stETHBalance: safeToBN(oEGLS_stETHBalance),
        oEGLS_activeShares: safeToBN(oEGLS_activeShares),
        pEGLS_getAllValue: safeToBN(pEGLS_getAllValue),
        pEGLS_ETHBalance: safeToBN(pEGLS_ETHBalance),
        sc_totalValue: safeToBN(sc_totalValue),
        assetsVault_ETHBalance: safeToBN(assetsVault_ETHBalance),
        multiSigStrategy_getAllValue: safeToBN(multiSigStrategy_getAllValue),
        multiSigStrategy_ETHBalance: safeToBN(multiSigStrategy_ETHBalance)
    };
}
let stoneVault, stoneToken, strategyController, eigenLayer, eigenLSTRestaking, eigenLSTRestakingPatch, multiSigStrategy, stETH;

module.exports = async function (callback) {
    try {

        // 准备账户
        const accounts = await web3.eth.getAccounts();
        const truffleDeployer = accounts[0];
        // 解锁账户
        await unlockAccounts([proposer, normalUser, majorHolder, multiSigAddress, deployer]);
        await fundAccount(deployer, 1000);
        await fundAccount(normalUser, 10000);
        await fundAccount(majorHolder, 10000);

        console.log("======== 连接线上合约... =========");
        stoneVault = await StoneVault.at(stoneVaultAddr);
        strategyController = await StrategyController.at(strategyControllerAddr);
        stoneToken = await Stone.at(stoneAddr);
        proposal = await Proposal.at(proposalAddr);
        multiSigStrategy = await MultiSigStrategy.at(multiSigStrategyAddr);
        eigenLSTRestaking = await EigenLSTRestaking.at(eigenLSTRestakingAddr);
        eigenLSTRestakingPatch = await EigenLSTRestakingPatch.at(eigenLSTRestakingPatchAddr);
        stETH = await IERC20.at(stETHAddr);
        eigenLayer = await IEigenStrategy.at(EIGENLAYER_ADDR);
        const lidoWithdrawalQueue = await ILidoWithdrawalQueue.at(LIDO_WITHDRAWAL_QUEUE_ADDR);
        const delegationManager = await IDelegationManager.at(DELEGATION_MANAGER_ADDR);

        console.log("--- Step 0: Initial state ---");
        let currentState = await printAllValues("Initial State ");

        // console.log("========Step 1: Deposit =========");
        // await stoneVault.deposit({
        //     value: new BigNumber(1000e18).toString(10),  //left 10 ether
        //     from: normalUser
        // });
        // console.log("用户存款完成");
        // let userShares = new BigNumber(await stoneToken.balanceOf(normalUser));
        // console.log("用户存款获得stone shares: ", userShares.toString(10));

        // 处理排队中的提款
        console.log("\n===有活跃份额，发起排队提款并完成取款 ===");
        const pendingWithdrawals = await getPendingWithdrawals(eigenLSTRestaking);
        //目前这里不会执行，因为不满足条件
        if (pendingWithdrawals && pendingWithdrawals.length > 0) {
            for (let withdrawal of pendingWithdrawals) {
                console.log(`处理提款根: ${withdrawal.root}`);

                // 检查是否满足等待期
                const currentBlock = await web3.eth.getBlockNumber();
                console.log(`当前区块: ${currentBlock}`);

                // 推进区块确保满足等待期
                await mineBlocks(100800);

                // 这里需要获取具体的 withdrawal 数据来调用 completeQueuedWithdrawal
                // 由于我们只有 root，需要从事件日志中恢复完整的 withdrawal 数据
                console.log(`⚠️ 需要从事件日志中恢复提款数据来完成提款根: ${withdrawal.root}`);
            }
        }
        // 
        let activeShares = currentState.oEGLS_activeShares;
        if (activeShares.gt(0)) {
            console.log("\n===Step 2: 排队提款活跃份额 ===");
            console.log(`活跃份额: ${web3.utils.fromWei(activeShares.toString(10), "ether")}`);

            // 构造 queueWithdrawals 调用数据
            const queueData = web3.eth.abi.encodeFunctionCall(queueAbi,
                [[{
                    strategies: [EIGENLAYER_ADDR],
                    depositShares: [activeShares.toString(10)],
                    __deprecated_withdrawer: eigenLSTRestakingAddr
                }]]
            );

            console.log("调用 queueWithdrawals...");
            const queueTx = await eigenLSTRestaking.invoke(
                DELEGATION_MANAGER_ADDR,
                queueData,
                { from: deployer, gas: 500000 }
            );
            console.log(`✅ 排队成功: ${queueTx.tx}`);
            // 验证一下在这几个阶段里用户的deposit，instantWithdraw，sharePrice，结算
            // console.log("-------- verify actions after QueuedWithdrawal --------");
            // console.log("========Step 3: instant withdraw =========");
            // let sharePrice = currentState.sv_currentSharePrice;
            // // let shouldClaim = userShares.multipliedBy(sharePrice).dividedBy(1e18).integerValue(BigNumber.ROUND_DOWN);
            // // console.log("shouldClaim is : ", shouldClaim.toString(10));

            // await stoneVault.instantWithdraw(0, userShares.toString(10), {
            //     from: normalUser
            // });
            // console.log("用户即时提款完成");

            console.log("========Step 4: Deposit, normalUser deposit 100 ether=========");
            let normalUser_ETHBalance = await web3.eth.getBalance(normalUser);
            console.log(`normalUser_ETHBalance is:`, fromWei(normalUser_ETHBalance).toString(10));

            await stoneVault.deposit({
                value: new BigNumber(100e18).toString(10),
                from: normalUser
            });
            console.log("用户存款完成");
            userShares = new BigNumber(await stoneToken.balanceOf(normalUser)).toString(10);
            console.log("用户存款获得stone shares: ", userShares);
            normalUser_ETHBalance = await web3.eth.getBalance(normalUser);
            console.log(`normalUser_ETHBalance1 is:`, fromWei(normalUser_ETHBalance).toString(10));

            // console.log("--- Step 5: Execute rollToNextRound ---");
            // const rollTx = await stoneVault.rollToNextRound({
            //     from: deployer,
            //     gas: 3000000
            // });
            // console.log("Rebalance successful. TX:", rollTx.tx);
            // valuesAfterRebalance = await printAllValues("After Rebalance ");
            console.log("--- Step 6: MajorHolder instant Withdraw ---");
            let majorHolder_ETHBalance = await web3.eth.getBalance(majorHolder);
            console.log(`majorHolder_ETHBalance:`, fromWei(majorHolder_ETHBalance).toString(10));

            userShares = new BigNumber(await stoneToken.balanceOf(majorHolder)).toString(10);
            console.log("majorHolder hold shares : ", userShares.toString(10));
            await stoneVault.instantWithdraw(0, userShares.toString(10), {
                from: majorHolder
            });
            majorHolder_ETHBalance = await web3.eth.getBalance(majorHolder);
            console.log(`majorHolder_ETHBalance1:`, fromWei(majorHolder_ETHBalance).toString(10));

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
            console.log("Decoded event: ", decodedEvent);
            // 检查当前区块和时间戳
            let currentBlock = await web3.eth.getBlockNumber();
            let currentTimestamp = (await web3.eth.getBlock(currentBlock)).timestamp;
            console.log("Current block:", currentBlock);
            console.log("Current timestamp:", currentTimestamp);
            if (decodedEvent) {
                console.log("✅ 成功获取到提款数据");

                // 等待提款期
                console.log("\n⏳ 等待提款期 (100800 区块)...");
                await mineBlocks(100800);
                // 检查当前区块和时间戳
                currentBlock = await web3.eth.getBlockNumber();
                currentTimestamp = (await web3.eth.getBlock(currentBlock)).timestamp;
                console.log("Current block1:", currentBlock);
                console.log("Current timestamp1:", currentTimestamp);
                // 完成提款
                console.log("\n=== 开始提款 ===");
                const completeData = web3.eth.abi.encodeFunctionCall(completeWithdrawalAbi, [
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

                console.log("调用 completeQueuedWithdrawal...");
                const completeTx = await eigenLSTRestaking.invoke(
                    DELEGATION_MANAGER_ADDR,
                    completeData,
                    { from: deployer, gas: 800000 }
                );
                console.log(`✅ 完成提款成功: ${completeTx.tx}`);
            }
        } else {
            console.log("✅ 没有活跃份额需要处理");
        }

        //  取消委托（确保所有份额都已提取）
        console.log("--- Step 9: 取消委托 ---");
        const finalShares = new BigNumber((await eigenLayer.shares(eigenLSTRestakingAddr)).toString());

        if (finalShares.eq(0)) {
            console.log("调用 undelegate...");
            const undelegateData = web3.eth.abi.encodeFunctionCall({
                name: "undelegate",
                type: "function",
                inputs: [{ internalType: "address", name: "staker", type: "address" }]
            }, [eigenLSTRestakingAddr]);

            const undelegateTx = await eigenLSTRestaking.invoke(
                DELEGATION_MANAGER_ADDR,
                undelegateData,
                { from: deployer, gas: 500000 }
            );
            console.log(`✅ 取消委托成功: ${undelegateTx.tx}`);
        } else {
            console.log(`⚠️ 仍有活跃份额 ${web3.utils.fromWei(finalShares.toString(10), "ether")}，无法取消委托`);
        }
        valuesAfterRebalance = await printAllValues("After complete withdrawal... ");

        // 处理剩余的 stETH
        console.log("\n--- Step 10: 处理剩余 stETH ---");
        const finalStETHBal = new BigNumber((await stETH.balanceOf(eigenLSTRestakingAddr)).toString());

        if (finalStETHBal.gt(0)) {
            console.log(`剩余 stETH: ${web3.utils.fromWei(finalStETHBal.toString(10), "ether")}`);

            // 设置使用 DEX 出售
            await eigenLSTRestaking.setRouter(true, true, { from: deployer });

            // 转换为 ETH
            console.log("调用 swapToEther...");
            await eigenLSTRestaking.swapToEther(finalStETHBal.toString(10), { from: deployer, gas: 500000 });
            console.log("✅ stETH 转换完成");

            // 推进区块等待 Lido 处理
            await mineBlocks(100800);

            // 领取提款
            console.log("\n--- Step 11: 领取 ETH ---");
            await eigenLSTRestaking.claimAllPendingAssets({ from: deployer, gas: 500000 });
        } else {
            console.log("✅ 没有剩余 stETH");
        }

        // 8. 最终状态检查
        console.log("\n=== 最终状态 ===");
        const finalEthBal = new BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        const finalStETH = new BigNumber((await stETH.balanceOf(eigenLSTRestakingAddr)).toString());
        const finalSharesCheck = new BigNumber((await eigenLayer.shares(eigenLSTRestakingAddr)).toString());
        const finalRestakingVal = new BigNumber((await eigenLayer.userUnderlyingView(eigenLSTRestakingAddr)).toString());

        console.log("最终 ETH 余额:", web3.utils.fromWei(finalEthBal.toString(10), "ether"));
        console.log("最终 stETH 余额:", web3.utils.fromWei(finalStETH.toString(10), "ether"));
        console.log("最终 EigenLayer 份额:", web3.utils.fromWei(finalSharesCheck.toString(10), "ether"));
        console.log("最终重质押价值:", web3.utils.fromWei(finalRestakingVal.toString(10), "ether"));

        console.log("\n🎉 EigenLayer 资产提取完成!");
        // 提案流程
        console.log("\n开始提案流程...");

        // 设置投票周期为最小值
        let votePeriod = new BigNumber(await proposal.votePeriod());
        console.log("当前 votePeriod:", votePeriod.toString(10));
        await proposal.setVotePeriod(minVotePeriod.toString(10), { from: proposer });
        console.log("投票周期设置完成");
        // 首先获取当前策略配置
        console.log("\n获取当前策略配置...");
        const currentStrategies = await strategyController.getStrategies();
        console.log("当前策略数量:", currentStrategies[0].length);
        console.log("当前策略列表:", currentStrategies[0]);
        console.log("当前策略比例:", currentStrategies[1].map(r => r.toString()));
        // 创建提案数据
        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = web3.eth.abi.encodeFunctionSignature(fn2);
        const encodedParams2 = web3.eth.abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[multiSigStrategy.address], [new BigNumber(10e5).toString(10)]]
        );
        const data2 = selector2 + encodedParams2.slice(2);

        console.log("创建提案...");
        await proposal.propose(data2, { from: proposer });

        // 获取最新提案
        const proposals = await proposal.getProposals();
        const latestProposal = proposals[proposals.length - 1];
        console.log("最新提案地址:", latestProposal);

        const proposalDetail = await proposal.proposalDetails(latestProposal);
        const deadline = proposalDetail.deadline;
        console.log("提案截止时间:", deadline.toString(10));

        // 用户投票
        console.log("用户投票中...");
        await stoneToken.approve(proposal.address, new BigNumber(1e18).toString(10), {
            from: normalUser
        });

        await proposal.voteFor(latestProposal, new BigNumber(5e17).toString(10), true, {
            from: normalUser
        });
        console.log("投票完成");
        let latestBlock = await web3.eth.getBlock('latest');
        console.log("最新区块时间戳0:", latestBlock.timestamp);
        console.log("\n模拟时间流逝...");
        await new Promise((resolve, reject) => {
            web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [minVotePeriod + 1], // 超过投票期
                id: 999
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        await new Promise((resolve, reject) => {
            web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [],
                id: 1000
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        // 添加等待确保状态更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 强制获取最新区块来刷新状态
        latestBlock = await web3.eth.getBlock('latest');
        console.log("最新区块时间戳:", latestBlock.timestamp);
        console.log("时间推进完成");

        // 检查并执行提案
        const canVote = await proposal.canVote(latestProposal);
        console.log("是否可以投票:", canVote);

        if (!canVote) {
            console.log("执行提案...");
            await proposal.retrieveTokenFor(latestProposal, { from: normalUser });
            await proposal.execProposal(latestProposal, { from: deployer });
            console.log("提案执行完成");
        }

        // 验证策略配置
        const strategies = await strategyController.getStrategies();
        console.log("\n验证策略配置:");
        console.log("策略数量:", strategies[0].length);
        console.log("策略1:", strategies[0][0], "比例:", strategies[1][0].toString(10));

        console.log("========Step 4: Deposit, normalUser deposit 10ether=========");
        normalUser_ETHBalance = await web3.eth.getBalance(normalUser);
        console.log(`normalUser_ETHBalance3 is:`, fromWei(normalUser_ETHBalance).toString(10));

        await stoneVault.deposit({
            value: new BigNumber(10e18).toString(10),
            from: normalUser
        });
        console.log("用户存款完成");
        userShares = new BigNumber(await stoneToken.balanceOf(normalUser)).toString(10);
        console.log("用户存款获得stone shares: ", userShares);
        normalUser_ETHBalance = await web3.eth.getBalance(normalUser);
        console.log(`normalUser_ETHBalance4 is:`, fromWei(normalUser_ETHBalance).toString(10));

        console.log("--- Step 6: normalUser instant Withdraw 60 shares---");
        await stoneVault.instantWithdraw(0, new BigNumber(60e18).toString(10), {
            from: normalUser
        });
        normalUser_ETHBalance = await web3.eth.getBalance(normalUser);
        console.log(`normalUser_ETHBalance5:`, fromWei(normalUser_ETHBalance).toString(10));

        console.log("--- Step 11: Execute rollToNextRound ---");
        // 等待提款期
        console.log("\n⏳ 等待提款期 (100800 区块)...");
        await mineBlocks(100800);
        rollTx = await stoneVault.rollToNextRound({
            from: deployer,
            gas: 3000000
        });
        console.log("Rebalance successful. TX:", rollTx.tx);
        valuesAfterRebalance = await printAllValues("After Rebalance ");
        console.log("\n=== 开始测试 clearStrategy 功能 ===");

        console.log("\n测试1: 清空 EigenLSTStrategy");

        // Owner执行clearStrategy
        console.log("执行 EigenLSTStrategy clearStrategy...");
        const tx1 = await stoneVault.clearStrategy(eigenLSTRestaking.address, { from: deployer });
        console.log("eigenLSTRestaking clearStrategy交易哈希:", tx1.tx);

        valuesAfterClear = await printAllValues("After Clear eigenLSTRestaking");

        // 测试2: 清空 EigenStrategyPatch
        console.log("\n测试2: 清空 EigenStrategyPatch");

        console.log("执行 EigenStrategyPatch clearStrategy...");
        const tx2 = await stoneVault.clearStrategy(eigenLSTRestakingPatch.address, { from: deployer });
        console.log("EigenLSTStrategyPatch clearStrategy交易哈希:", tx2.tx);

        valuesAfterClearPatch = await printAllValues("After Clear eigenLSTRestaking Patch");

        // 验证当前策略配置
        const finalStrategies = await strategyController.getStrategies();
        console.log("\n最终策略配置:");
        console.log("策略数量:", finalStrategies[0].length);
        console.log("策略列表:", finalStrategies[0]);
        console.log("策略比例:", finalStrategies[1].map(r => r.toString()));

        console.log("\n✅ 所有clearStrategy功能测试完成!");
        //====================
        console.log("\n=== 开始测试 Stragety Destroy 功能 ===");

        console.log("\n测试1: Destroy EigenLSTStrategy");

        console.log("执行 EigenLSTStrategy DestroyStrategy...");
        const tx3 = await stoneVault.destroyStrategy(eigenLSTRestaking.address, { from: deployer });
        console.log("eigenLSTRestaking destroyStrategy:", tx3.tx);

        valuesAfterClear = await printAllValues("After destroyStrategy eigenLSTRestaking");

        // 测试2: Destroy EigenStrategyPatch
        console.log("\n测试2: Destroy EigenStrategyPatch");

        console.log("执行 EigenStrategyPatch Destroy...");
        const tx4 = await stoneVault.destroyStrategy(eigenLSTRestakingPatch.address, { from: deployer });
        console.log("EigenLSTStrategyPatch destroyStrategy:", tx4.tx);

        valuesAfterClearPatch = await printAllValues("After destroyStrategy eigenLSTRestaking Patch");

        // 验证当前策略配置
        const finalStrategies1 = await strategyController.getStrategies();
        console.log("\n最终策略配置:");
        console.log("策略数量:", finalStrategies1[0].length);
        console.log("策略列表:", finalStrategies1[0]);
        console.log("策略比例:", finalStrategies1[1].map(r => r.toString()));

        console.log("\n✅ 所有destroyStrategy功能测试完成!");


        if (typeof callback === 'function') {
            return callback();
        } else {
            process.exit(0);
        }

    } catch (error) {
        console.error("❌ 脚本执行失败:", error);
        if (typeof callback === 'function') {
            return callback(error);
        } else {
            process.exit(1);
        }
    }
};
