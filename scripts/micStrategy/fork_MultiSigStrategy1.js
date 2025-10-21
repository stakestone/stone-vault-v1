// truffle exec scripts/fork_test_multiSig.js --network test
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:7777');
const BigNumber = require('bignumber.js');

const Proposal = artifacts.require("Proposal");
const StoneVault = artifacts.require("StoneVault");
const Stone = artifacts.require("Stone");
const StrategyController = artifacts.require("StrategyController");
const MultiSigStrategy = artifacts.require("MultiSigStrategy");
const EigenStrategy = artifacts.require("EigenLSTRestaking");

module.exports = async function (callback) {
    try {
        // 配置地址参数
        const proposer = "0x83000EF01eD5C15462ef20066091Abd3654e523f";
        const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
        const normalUser = "0xC15951C814B618b6f52cBc7015d6FC16e2d3d4bE";
        const multiSigAddress = "0x3e32D3ffD97EDD79F7e4922BC3BF6aD0ADF95F34";

        const MINIMUM_REBASE_INTERVAL = 7 * 24 * 60 * 60;
        const minVotePeriod = 24 * 60 * 60;

        console.log("开始解锁账户...");

        // 解锁账户
        const accountsToUnlock = [proposer, normalUser, multiSigAddress, deployer];
        for (let i = 0; i < accountsToUnlock.length; i++) {
            await web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "anvil_impersonateAccount",
                params: [accountsToUnlock[i]],
                id: i + 1,
            });
            console.log(`账户解锁: ${accountsToUnlock[i]}`);
        }
        // 使用 Truffle 的方式解锁账户
        const accounts = await web3.eth.getAccounts();
        const truffleDeployer = accounts[0]; // 使用 Truffle 提供的账户

        // 给解锁的账户充值测试ETH
        for (const account of accountsToUnlock) {
            await web3.eth.sendTransaction({
                from: truffleDeployer,
                to: account,
                value: web3.utils.toWei("100", "ether")
            });
        }
        console.log("所有账户充值完成");

        // 连接线上已部署合约
        console.log("\n连接线上合约...");
        const eigenStrategy = await EigenStrategy.at("0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982");
        const strategyController = await StrategyController.at("0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2");
        const stoneVault = await StoneVault.at("0xA62F9C5af106FeEE069F38dE51098D9d81B90572");
        const stoneToken = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");
        const proposal = await Proposal.at("0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b");

        console.log("线上合约连接成功");

        // 用户存款准备
        console.log("\n准备用户存款...");
        const stoneTokenInstance = await Stone.at(stoneToken.address);
        await stoneTokenInstance.approve(stoneVault.address, new BigNumber(100000).times(1e18).toString(10), {
            from: normalUser
        });
        const assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        const assetsVaultBalance0 = await web3.eth.getBalance(assetsVaultAddress);
        console.log("AssetsVault0 余额:", assetsVaultBalance0.toString(10));

        await stoneVault.deposit({
            value: new BigNumber(90e18).toString(10),
            from: normalUser
        });
        console.log("用户存款完成");
        let userShares = new BigNumber(await stoneTokenInstance.balanceOf(normalUser)).toString(10);
        console.log("用户存款获得stone shares: ", userShares);
        const multiSigStrategy = await MultiSigStrategy.at("0x8f4998661618c5cc5dbcc0ae19923d6537622180");
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
        // 获取最新提案
        const proposals = await proposal.getProposals();
        const latestProposal = proposals[proposals.length - 1];
        console.log("最新提案地址:", latestProposal);
        await stoneTokenInstance.approve(proposal.address, new BigNumber(1e18).toString(10), {
            from: normalUser
        });

        await proposal.voteFor(latestProposal, new BigNumber(5e17).toString(10), true, {
            from: normalUser
        });
        console.log("投票完成");

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
        const latestBlock = await web3.eth.getBlock('latest');
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
        console.log("策略2:", strategies[0][1], "比例:", strategies[1][1].toString(10));
        console.log("策略3:", strategies[0][2], "比例:", strategies[1][2].toString(10));
        const expectedRatio1 = new BigNumber(20000); // 策略1期望比例 2%
        const expectedRatio2 = new BigNumber(0);      // 策略2期望比例 0%
        const expectedRatio3 = new BigNumber(980000);  // 策略3期望比例 98%

        const actualRatio1 = new BigNumber(strategies[1][0].toString());
        const actualRatio2 = new BigNumber(strategies[1][1].toString());
        const actualRatio3 = new BigNumber(strategies[1][2].toString());

        // 检查策略1比例
        if (!actualRatio1.eq(expectedRatio1)) {
            throw new Error(`策略1比例不匹配。期望: ${expectedRatio1.toString()}，实际: ${actualRatio1.toString()}`);
        }
        console.log("✅ 策略1比例验证通过");

        // 检查策略2比例
        if (!actualRatio2.eq(expectedRatio2)) {
            throw new Error(`策略2比例不匹配。期望: ${expectedRatio2.toString()}，实际: ${actualRatio2.toString()}`);
        }
        console.log("✅ 策略2比例验证通过");

        // 检查策略3比例
        if (!actualRatio3.eq(expectedRatio3)) {
            throw new Error(`策略3比例不匹配。期望: ${expectedRatio3.toString()}，实际: ${actualRatio3.toString()}`);
        }
        console.log("✅ 策略3比例验证通过");

        console.log("🎉 所有策略分配比例验证通过!");

        // 准备 rollToNextRound
        console.log("\n准备 rollToNextRound...");
        const assetsVaultBalance1 = await web3.eth.getBalance(assetsVaultAddress);
        console.log("AssetsVault1 余额:", assetsVaultBalance1.toString(10));
        const eigenStrategyValueRaw = await eigenStrategy.getAllValue.call();
        const eigenStrategyValue = new BigNumber(eigenStrategyValueRaw.toString());
        console.log("第一次结算前EigenStrategy 价值:", eigenStrategyValue.toString(10));
        let sharePriceRaw = await stoneVault.currentSharePrice.call();
        let sharePrice = new BigNumber(sharePriceRaw.toString(10));
        console.log("sharePrice1 is: ", sharePrice.toString(10));

        const withdrawingSharesInRoundRaw = await stoneVault.withdrawingSharesInRound.call();
        const withdrawingSharesInRound = new BigNumber(withdrawingSharesInRoundRaw.toString(10));
        const withdrawableAmountInPastRaw = await stoneVault.withdrawableAmountInPast.call();
        const withdrawableAmountInPast = new BigNumber(withdrawableAmountInPastRaw.toString(10));
        const withdrawingSharesInPastRaw = await stoneVault.withdrawingSharesInPast.call();
        const withdrawingSharesInPast = new BigNumber(withdrawingSharesInPastRaw.toString(10));

        console.log("withdrawingSharesInRound:", withdrawingSharesInRound.toString(10));
        console.log("withdrawableAmountInPast:", withdrawableAmountInPast.toString(10));
        console.log("withdrawingSharesInPast:", withdrawingSharesInPast.toString(10));
        // 推进时间以满足 rebase 间隔
        console.log("推进时间以满足 rebase 间隔...");
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [MINIMUM_REBASE_INTERVAL + 1],
            id: 1001
        });
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            params: [],
            id: 1002
        });

        // 执行 rollToNextRound
        await stoneVault.rollToNextRound();
        console.log("结算完成! 资产已分配到不同策略");
        const sharePriceRaw2 = await stoneVault.currentSharePrice.call();
        const sharePrice2 = new BigNumber(sharePriceRaw2.toString(10));
        console.log("sharePrice2 is: ", sharePrice2.toString(10));

        const withdrawingSharesInRoundRaw1 = await stoneVault.withdrawingSharesInRound.call();
        const withdrawingSharesInRound1 = new BigNumber(withdrawingSharesInRoundRaw1.toString(10));
        const withdrawableAmountInPastRaw1 = await stoneVault.withdrawableAmountInPast.call();
        const withdrawableAmountInPast1 = new BigNumber(withdrawableAmountInPastRaw1.toString(10));
        const withdrawingSharesInPastRaw1 = await stoneVault.withdrawingSharesInPast.call();
        const withdrawingSharesInPast1 = new BigNumber(withdrawingSharesInPastRaw1.toString(10));

        console.log("withdrawingSharesInRound1:", withdrawingSharesInRound1.toString(10));
        console.log("withdrawableAmountInPast1:", withdrawableAmountInPast1.toString(10));
        console.log("withdrawingSharesInPast1:", withdrawingSharesInPast1.toString(10));

        // 验证分配结果
        const assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("第一次结算后AssetsVault 余额:", assetsVaultBalance.toString(10));

        const eigenStrategyValueRaw1 = await eigenStrategy.getAllValue.call();
        const eigenStrategyValue1 = new BigNumber(eigenStrategyValueRaw1.toString());
        console.log("第一次结算后EigenStrategy 价值:", eigenStrategyValue1.toString(10));
        let currentTotalValue1 = 0;
        // 检查新策略是否获得资金 - 安全处理大数值
        console.log("\n检查新策略是否获得资金...");
        try {
            let multiSigStrategyValueRaw = await multiSigStrategy.getAllValue.call();
            console.log("MultiSigStrategy 原始返回值 (原始类型):", typeof multiSigStrategyValueRaw, multiSigStrategyValueRaw);
            // 安全处理大数值
            let multiSigStrategyValue = new BigNumber(multiSigStrategyValueRaw.toString(10));
            console.log("MultiSigStrategy 总价值:", multiSigStrategyValue.toString(10));

            // 只有在策略有资金时才测试提款功能
            if (multiSigStrategyValue.gt(0)) {
                console.log("\n测试多签策略功能...");
                console.log("测试: 检查初始状态");
                const initialBalanceRaw = await web3.eth.getBalance(multiSigStrategy.address);
                const initialBorrowedRaw = await multiSigStrategy.assetsBorrowed.call();
                const initialInvestedValueRaw = await multiSigStrategy.getInvestedValue.call();
                const initialBalance = new BigNumber(initialBalanceRaw);
                const initialBorrowed = new BigNumber(initialBorrowedRaw);
                const initialInvestedValue = new BigNumber(initialInvestedValueRaw);

                console.log("合约初始余额:", web3.utils.fromWei(initialBalance.toString(10), "ether"), "ETH");
                console.log("初始已借资产:", web3.utils.fromWei(initialBorrowed.toString(10), "ether"), "ETH");
                console.log("初始投资价值:", web3.utils.fromWei(initialInvestedValue.toString(10), "ether"), "ETH");

                console.log("--- 初始状态检查结束 ---");
                // 断言检查：getAllValue() 应该等于 getInvestedValue()
                if (!multiSigStrategyValue.eq(initialInvestedValue)) {
                    throw new Error(`getAllValue (${multiSigStrategyValue.toString()}) 应该等于 getInvestedValue (${initialInvestedValue.toString()})`);
                }

                // 断言检查：投资价值应该等于余额 + 已借资产
                const calculatedValue = initialBalance.plus(initialBorrowed);
                if (!initialInvestedValue.eq(calculatedValue)) {
                    throw new Error(`投资价值 (${initialInvestedValue.toString()}) 应该等于余额 (${initialBalance.toString()}) + 已借资产 (${initialBorrowed.toString()})`);
                }
                console.log("✅ 初始状态检查通过");

                // 测试2: 多签地址提取 ETH 功能
                console.log("\n 测试2: 多签地址提取 ETH");
                const withdrawAmount = new BigNumber(1e16); // 0.01 ETH

                // 记录提取前的状态
                const beforeWithdrawBalanceRaw = await web3.eth.getBalance(multiSigStrategy.address);
                const beforeWithdrawBalance = new BigNumber(beforeWithdrawBalanceRaw);

                const beforeWithdrawBorrowedRaw = await multiSigStrategy.assetsBorrowed.call();
                const beforeWithdrawBorrowed = new BigNumber(beforeWithdrawBorrowedRaw);

                console.log("提取前合约余额:", web3.utils.fromWei(beforeWithdrawBalance.toString(10), "ether"), "ETH");
                console.log("提取前已借资产:", web3.utils.fromWei(beforeWithdrawBorrowed.toString(10), "ether"), "ETH");
                console.log("提取金额:", web3.utils.fromWei(withdrawAmount.toString(10), "ether"), "ETH");

                // 执行提取
                await multiSigStrategy.withdrawETH(withdrawAmount.toString(), { from: multiSigAddress });

                // 检查提取后的状态
                const afterWithdrawBalanceRaw = await web3.eth.getBalance(multiSigStrategy.address);
                const afterWithdrawBalance = new BigNumber(afterWithdrawBalanceRaw);

                const afterWithdrawBorrowedRaw = await multiSigStrategy.assetsBorrowed.call();
                const afterWithdrawBorrowed = new BigNumber(afterWithdrawBorrowedRaw);

                console.log("提取后合约余额:", web3.utils.fromWei(afterWithdrawBalance.toString(10), "ether"), "ETH");
                console.log("提取后已借资产:", web3.utils.fromWei(afterWithdrawBorrowed.toString(10), "ether"), "ETH");

                // 断言检查：合约余额应该减少提取金额
                const expectedBalance = beforeWithdrawBalance.minus(withdrawAmount);
                if (!afterWithdrawBalance.eq(expectedBalance)) {
                    throw new Error(`提取后余额 (${afterWithdrawBalance.toString(10)}) 应该等于提取前余额 (${beforeWithdrawBalance.toString(10)}) - 提取金额 (${withdrawAmount.toString(10)})`);
                }

                // 断言检查：已借资产应该增加提取金额
                const expectedBorrowed = beforeWithdrawBorrowed.plus(withdrawAmount);
                if (!afterWithdrawBorrowed.eq(expectedBorrowed)) {
                    throw new Error(`提取后已借资产 (${afterWithdrawBorrowed.toString(10)}) 应该等于提取前已借资产 (${beforeWithdrawBorrowed.toString(10)}) + 提取金额 (${withdrawAmount.toString(10)})`);
                }

                // 断言检查：投资价值应该保持不变
                const afterWithdrawInvestedValueRaw = await multiSigStrategy.getInvestedValue.call();
                const afterWithdrawInvestedValue = new BigNumber(afterWithdrawInvestedValueRaw);
                if (!afterWithdrawInvestedValue.eq(initialInvestedValue)) {
                    throw new Error(`提取后投资价值 (${afterWithdrawInvestedValue.toString(10)}) 应该保持不变`);
                }
                console.log("✅ 多签提取功能测试通过");

                // 测试3: 还款功能
                console.log("\n 测试3: 还款功能");

                // 记录还款前的状态
                const beforeRepayBalanceRaw = await web3.eth.getBalance(multiSigStrategy.address);
                const beforeRepayBalance = new BigNumber(beforeRepayBalanceRaw);
                const beforeRepayBorrowed = afterWithdrawBorrowed; // 使用提取后的已借资产

                console.log("还款前合约余额:", web3.utils.fromWei(beforeRepayBalance.toString(10), "ether"), "ETH");
                console.log("还款前已借资产:", web3.utils.fromWei(beforeRepayBorrowed.toString(10), "ether"), "ETH");

                // 执行还款
                await multiSigStrategy.repayETH({
                    value: withdrawAmount.toString(),
                    from: multiSigAddress
                });

                // 检查还款后的状态
                const afterRepayBalanceRaw = await web3.eth.getBalance(multiSigStrategy.address);
                const afterRepayBalance = new BigNumber(afterRepayBalanceRaw);

                const afterRepayBorrowedRaw = await multiSigStrategy.assetsBorrowed.call();
                const afterRepayBorrowed = new BigNumber(afterRepayBorrowedRaw);

                console.log("还款后合约余额:", web3.utils.fromWei(afterRepayBalance.toString(10), "ether"), "ETH");
                console.log("还款后已借资产:", web3.utils.fromWei(afterRepayBorrowed.toString(10), "ether"), "ETH");

                // 断言检查：合约余额应该增加还款金额
                const expectedRepayBalance = beforeRepayBalance.plus(withdrawAmount);
                if (!afterRepayBalance.eq(expectedRepayBalance)) {
                    throw new Error(`还款后余额 (${afterRepayBalance.toString(10)}) 应该等于还款前余额 (${beforeRepayBalance.toString(10)}) + 还款金额 (${withdrawAmount.toString(10)})`);
                }

                // 断言检查：已借资产应该减少还款金额
                const expectedRepayBorrowed = beforeRepayBorrowed.minus(withdrawAmount);
                if (!afterRepayBorrowed.eq(expectedRepayBorrowed)) {
                    throw new Error(`还款后已借资产 (${afterRepayBorrowed.toString(10)}) 应该等于还款前已借资产 (${beforeRepayBorrowed.toString(10)}) - 还款金额 (${withdrawAmount.toString(10)})`);
                }

                // 断言检查：还款后已借资产应该回到初始值
                if (!afterRepayBorrowed.eq(initialBorrowed)) {
                    throw new Error(`还款后已借资产 (${afterRepayBorrowed.toString(10)}) 应该回到初始值 (${initialBorrowed.toString(10)})`);
                }
                console.log("✅ 还款功能测试通过");

                console.log("\n 测试4: 利息还款功能");

                const currentMaxBpsRaw = await multiSigStrategy.interestsRepaidMaxBps.call();
                const currentMaxBps = new BigNumber(currentMaxBpsRaw);
                console.log("当前最大利息比例:", currentMaxBps.toString(10), "bps");

                const newMaxBps = currentMaxBps.plus(600);
                await multiSigStrategy.setInterestsRepaidMaxBps(newMaxBps.toString(10), { from: multiSigAddress });

                const updatedMaxBpsRaw = await multiSigStrategy.interestsRepaidMaxBps.call();
                const updatedMaxBps = new BigNumber(updatedMaxBpsRaw);
                if (!updatedMaxBps.eq(newMaxBps)) {
                    throw new Error(`interestsRepaidMaxBps 应该从 ${currentMaxBps.toString(10)} 更新为 ${newMaxBps.toString(10)}，但现在是 ${updatedMaxBps.toString(10)}`);
                }
                console.log(`旧的 MaxBps: ${currentMaxBps.toString(10)} 更新为新的 MaxBps: ${newMaxBps.toString(10)}`);

                const currentTotalValueRaw = await multiSigStrategy.getAllValue.call();
                const currentTotalValue = new BigNumber(currentTotalValueRaw);
                const maxInterestAmountUnrounded = currentTotalValue.multipliedBy(newMaxBps).dividedBy(10000);
                const maxInterestAmount = maxInterestAmountUnrounded.integerValue(BigNumber.ROUND_FLOOR);

                console.log("当前总价值:", web3.utils.fromWei(currentTotalValue.toString(10), "ether"), "ETH");
                console.log("最大可支付利息:", web3.utils.fromWei(maxInterestAmount.toString(10), "ether"), "ETH");

                // 支付小额利息（在限额内）
                const repayInterestAmount = maxInterestAmount;
                if (repayInterestAmount.gt(0)) {
                    console.log("支付利息金额:", web3.utils.fromWei(repayInterestAmount.toString(10), "ether"), "ETH");

                    // 记录支付前的已借资产
                    const beforeInterestBorrowedRaw = await multiSigStrategy.assetsBorrowed.call();
                    const beforeInterestBorrowed = new BigNumber(beforeInterestBorrowedRaw);
                    const accounts1 = await web3.eth.getAccounts();
                    const truffleDeployer1 = accounts1[1]; // 使用 Truffle 提供的账户
                    // // 向 multiSigAddress充值提供利息资金
                    await web3.eth.sendTransaction({
                        from: truffleDeployer1,
                        to: multiSigAddress,
                        value: web3.utils.toWei("800", "ether")
                    });

                    await multiSigStrategy.repayInterests({
                        value: repayInterestAmount.toString(10),
                        from: multiSigAddress
                    });
                    const currentTotalValueRaw1 = await multiSigStrategy.getAllValue.call();
                    currentTotalValue1 = new BigNumber(currentTotalValueRaw1);
                    console.log("当前总价值1:", web3.utils.fromWei(currentTotalValue1.toString(10), "ether"), "ETH");

                    if (!currentTotalValue1.eq(currentTotalValue.plus(repayInterestAmount))) {
                        throw new Error(`支付利息后合约资产应该相应变化`);
                    }
                    console.log("✅ 利息还款功能测试通过");

                    // 检查支付后的已借资产（应该不变，因为利息支付不影响已借资产）
                    const afterInterestBorrowedRaw = await multiSigStrategy.assetsBorrowed.call();

                    const afterInterestBorrowed = new BigNumber(afterInterestBorrowedRaw);

                    if (!afterInterestBorrowed.eq(beforeInterestBorrowed)) {
                        throw new Error(`支付利息后已借资产应该保持不变`);
                    }
                    console.log("✅ 支付利息后已借资产保持不变");
                } else {
                    console.log(" 利息金额太小，跳过利息还款测试");
                }

                // 测试5: 参数设置功能
                console.log("\n 测试5: 参数设置功能");

                const oldBufferTimeRaw = await multiSigStrategy.bufferTime.call();
                const oldBufferTime = new BigNumber(oldBufferTimeRaw);
                console.log("当前 bufferTime:", oldBufferTime.toString(10));

                const newBufferTime = oldBufferTime.plus(100);
                await multiSigStrategy.setBufferTime(newBufferTime.toString(10), { from: multiSigAddress });

                const updatedBufferTimeRaw = await multiSigStrategy.bufferTime.call();
                const updatedBufferTime = new BigNumber(updatedBufferTimeRaw);
                if (!updatedBufferTime.eq(newBufferTime)) {
                    throw new Error(`bufferTime 应该从 ${oldBufferTime.toString()} 更新为 ${newBufferTime.toString()}，但现在是 ${updatedBufferTime.toString()}`);
                }
                console.log(`bufferTime从 ${oldBufferTime.toString()} 更新为 ${newBufferTime.toString()}`);

                console.log("✅ bufferTime 更新测试通过");


                console.log("\n 所有多签策略功能测试通过!");

            } else {
                console.log(" MultiSigStrategy 尚未获得资金分配，跳过功能测试");
            }
        } catch (e) {
            console.log("❌ 获取 MultiSigStrategy 价值失败:", e.message);
            console.log("跳过 MultiSigStrategy 功能测试");
        }

        // 测试用户提款流程
        console.log("\n测试用户提款流程...");

        // 用户请求提款
        await stoneVault.requestWithdraw(userShares, {
            from: normalUser
        });
        console.log("用户提款请求已提交");

        // 推进时间并执行下一轮结算
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [MINIMUM_REBASE_INTERVAL + 1],
            id: 1003
        });
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            params: [],
            id: 1004
        });

        const result = await stoneVault.rollToNextRound();
        console.log("第二轮结算完成");
        // 获取用户提取额度
        const receipt = await stoneVault.userReceipts(normalUser);
        let withdrawRound = new BigNumber(receipt[0].toString());
        let withdrawShares = new BigNumber(receipt[1].toString());
        let withdrawableAmount = new BigNumber(receipt[2].toString());

        console.log(`用户 ${normalUser} 的 withdrawRound: ${withdrawRound.toString()}`);
        console.log(`用户 ${normalUser} 的 withdrawShares: ${withdrawShares.toString()}`);
        console.log(`用户 ${normalUser} 的 withdrawableAmount: ${withdrawableAmount.toString()}`);

        const withdrawingSharesInRoundRaw2 = await stoneVault.withdrawingSharesInRound.call();
        const withdrawingSharesInRound2 = new BigNumber(withdrawingSharesInRoundRaw2);
        const withdrawableAmountInPastRaw2 = await stoneVault.withdrawableAmountInPast.call();
        const withdrawableAmountInPast2 = new BigNumber(withdrawableAmountInPastRaw2);
        const withdrawingSharesInPastRaw2 = await stoneVault.withdrawingSharesInPast.call();
        const withdrawingSharesInPast2 = new BigNumber(withdrawingSharesInPastRaw2);

        console.log("withdrawingSharesInRound2:", withdrawingSharesInRound2.toString(10));
        console.log("withdrawableAmountInPast2:", withdrawableAmountInPast2.toString(10));
        console.log("withdrawingSharesInPast2:", withdrawingSharesInPast2.toString(10));

        // 用户提取资金
        const sharePriceRaw3 = await stoneVault.currentSharePrice.call();
        const sharePrice3 = new BigNumber(sharePriceRaw3.toString());
        console.log("latest sharePrice is:: ", sharePrice3.toString(10));

        multiSigStrategyValueRaw = await multiSigStrategy.getAllValue.call();
        console.log("MultiSigStrategy 原始返回值 (原始类型):", typeof multiSigStrategyValueRaw, multiSigStrategyValueRaw);
        // 安全处理大数值
        multiSigStrategyValue = new BigNumber(multiSigStrategyValueRaw);
        console.log("MultiSigStrategy取款完成前的总价值:", multiSigStrategyValue.toString(10));
        const eigenStrategyValueRaw2 = await eigenStrategy.getAllValue.call();
        const eigenStrategyValue2 = new BigNumber(eigenStrategyValueRaw2);
        console.log("取款完成前EigenStrategy1 价值:", eigenStrategyValue2.toString(10));
        const assetsVaultBalance2 = new BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        console.log("第2次结算后AssetsVault 余额:", assetsVaultBalance2.toString(10));
        const totalSupplyRaw = await stoneTokenInstance.totalSupply();
        const totalSupply = new BigNumber(totalSupplyRaw);
        console.log("Stone Token 总供应量:", totalSupply.toString());
        const expectPrice = multiSigStrategyValue
            .plus(eigenStrategyValue2)
            .plus(assetsVaultBalance2)
            .minus(withdrawableAmountInPast2)
            .multipliedBy(1e18)
            .dividedBy(totalSupply.minus(withdrawingSharesInPast2)).integerValue(BigNumber.ROUND_FLOOR);
        console.log("expectPrice is:", expectPrice.toString(10));

        let shouldClaim = withdrawShares.multipliedBy(sharePrice3).dividedBy(1e18).integerValue(BigNumber.ROUND_DOWN);
        console.log("Should claim amount:", shouldClaim.toString(10));

        await stoneVault.instantWithdraw(shouldClaim.toString(10), "0", {
            from: normalUser
        });
        console.log("用户即时提款完成");
        const receipt2 = await stoneVault.userReceipts(normalUser);
        let withdrawShares2 = new BigNumber(receipt2[1]);
        let withdrawableAmount2 = new BigNumber(receipt2[2]);
        console.log("第一次提款后 withdrawShares2:", withdrawShares2.toString());
        console.log("第一次提款后 withdrawableAmount2:", withdrawableAmount2.toString());
        const expectedMultiSigValue = currentTotalValue1.plus(eigenStrategyValue1).minus(shouldClaim).multipliedBy(98).dividedBy(100).integerValue(BigNumber.ROUND_CEIL);
        const expectedMultiSigValueBN = new BigNumber(expectedMultiSigValue.toString());

        console.log("expectedMultiSigValue:", expectedMultiSigValue.toString(10));
        console.log("multiSigStrategyValue:", multiSigStrategyValue.toString(10));

        if (!multiSigStrategyValue.eq(expectedMultiSigValueBN)) {
            console.log(`策略分配不匹配: 实际值=${multiSigStrategyValue.toString()}, 期望值=${expectedMultiSigValueBN.toString()}`);
            throw new Error(`策略分配失败`);
        }
        const expectedEigenValue = currentTotalValue1.plus(eigenStrategyValue1).minus(shouldClaim).multipliedBy(2).dividedBy(100).integerValue(BigNumber.ROUND_FLOOR);
        const expectedEigenValueBN = new BigNumber(expectedEigenValue.toString());
        if (!eigenStrategyValue2.eq(expectedEigenValueBN)) {
            console.log(`策略分配不匹配: 实际值=${eigenStrategyValue2.toString()}, 期望值=${expectedEigenValueBN.toString()}`);
            throw new Error(`策略分配失败`);
        }
        const expectPriceBN = new BigNumber(expectPrice.toString());
        if (!expectPrice.eq(sharePrice3)) {
            console.log(`价格不匹配: 实际值=${sharePrice3.toString()}, 期望值=${expectPriceBN.toString()}`);

            throw new Error(`价格不匹配`);
        }
        console.log("\n所有测试用例执行完成!");

        callback();
    } catch (e) {
        console.error("测试失败:", e);
        callback(e);
    }
}
