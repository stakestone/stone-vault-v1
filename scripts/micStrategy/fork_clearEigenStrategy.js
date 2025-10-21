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
const EigenStrategyPatch = artifacts.require("EigenLSTRestakingPatch");

module.exports = async function (callback) {
    try {
        // 配置地址参数
        const proposer = "0x83000EF01eD5C15462ef20066091Abd3654e523f";
        const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
        const normalUser = "0xC15951C814B618b6f52cBc7015d6FC16e2d3d4bE";
        const multiSigAddress = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";

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
        const eigenStrategyPatch = await EigenStrategyPatch.at("0xf1670996a123042fDa40c14e13B52318D2f78E90");
        const strategyController = await StrategyController.at("0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2");
        const stoneVault = await StoneVault.at("0xA62F9C5af106FeEE069F38dE51098D9d81B90572");
        const stoneToken = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");
        const proposal = await Proposal.at("0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b");

        console.log("线上合约连接成功");

        // 检查初始策略配置
        console.log("\n检查初始策略配置...");
        const initialStrategies = await strategyController.getStrategies();
        console.log("初始策略数量:", initialStrategies[0].length);
        console.log("初始策略列表:", initialStrategies[0]);
        console.log("初始策略比例:", initialStrategies[1].map(r => r.toString()));

        // 用户存款准备
        console.log("\n准备用户存款...");
        const stoneTokenInstance = await Stone.at(stoneToken.address);
        await stoneTokenInstance.approve(stoneVault.address, new BigNumber(100000).times(1e18).toString(10), {
            from: normalUser
        });
        const assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";

        await stoneVault.deposit({
            value: new BigNumber(90e18).toString(10),
            from: normalUser
        });
        console.log("用户存款完成");
        let userShares = new BigNumber(await stoneTokenInstance.balanceOf(normalUser)).toString(10);
        console.log("用户存款获得stone shares: ", userShares);

        // 部署新的 MultiSigStrategy
        console.log("\n部署 MultiSigStrategy...");
        const multiSigStrategy = await MultiSigStrategy.new(
            strategyController.address,
            multiSigAddress,
            multiSigAddress,
            multiSigAddress,
            "multiSigStrategy_fork_test"
        );
        console.log("MultiSigStrategy 部署成功:", multiSigStrategy.address);

        // 提案流程 - 更新策略配置
        console.log("\n开始提案流程...");

        // 设置投票周期为最小值
        let votePeriod = new BigNumber(await proposal.votePeriod());
        console.log("当前 votePeriod:", votePeriod.toString(10));
        await proposal.setVotePeriod(minVotePeriod.toString(10), { from: proposer });
        console.log("投票周期设置完成");

        // 创建提案数据 - 添加 MultiSigStrategy，设置 EigenStrategy 40%, MultiSigStrategy 60%
        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = web3.eth.abi.encodeFunctionSignature(fn2);
        const encodedParams2 = web3.eth.abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[eigenStrategy.address, multiSigStrategy.address], [new BigNumber(4e5).toString(10), new BigNumber(6e5).toString(10)]]
        );
        const data2 = selector2 + encodedParams2.slice(2);

        console.log("创建策略配置更新提案...");
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
                params: [minVotePeriod + 1],
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

        // 检查并执行提案
        const canVote = await proposal.canVote(latestProposal);
        console.log("是否可以投票:", canVote);

        if (!canVote) {
            console.log("执行提案...");
            await proposal.retrieveTokenFor(latestProposal, { from: normalUser });
            await proposal.execProposal(latestProposal, { from: deployer });
            console.log("提案执行完成");
        }

        // 验证策略配置更新
        const strategiesAfterUpdate = await strategyController.getStrategies();
        console.log("\n更新后的策略配置:");
        console.log("策略数量:", strategiesAfterUpdate[0].length);
        console.log("策略列表:", strategiesAfterUpdate[0]);
        console.log("策略比例:", strategiesAfterUpdate[1].map(r => r.toString()));

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

        // 检查各策略资金分配
        console.log("\n检查各策略资金分配...");
        const eigenStrategyValueRaw = await eigenStrategy.getAllValue.call();
        const eigenStrategyValue = new BigNumber(eigenStrategyValueRaw.toString(10));
        console.log("EigenStrategy 总价值:", web3.utils.fromWei(eigenStrategyValue.toString(10), "ether"), "ETH");

        const eigenStrategyPatchValueRaw = await eigenStrategyPatch.getAllValue.call();
        const eigenStrategyPatchValue = new BigNumber(eigenStrategyPatchValueRaw.toString(10));
        console.log("EigenStrategyPatch 总价值:", web3.utils.fromWei(eigenStrategyPatchValue.toString(10), "ether"), "ETH");

        const multiSigStrategyValueRaw = await multiSigStrategy.getAllValue.call();
        const multiSigStrategyValue = new BigNumber(multiSigStrategyValueRaw.toString(10));
        console.log("MultiSigStrategy 总价值:", web3.utils.fromWei(multiSigStrategyValue.toString(10), "ether"), "ETH");

        console.log("\n=== 开始测试 clearStrategy 功能 ===");

        // 测试1: 清空 EigenStrategy
        console.log("\n测试1: 清空 EigenStrategy");

        // 记录清空前的状态
        const eigenStrategyBalanceBefore = new BigNumber(await web3.eth.getBalance(eigenStrategy.address));
        console.log("EigenStrategy清空前余额:", web3.utils.fromWei(eigenStrategyBalanceBefore.toString(10), "ether"), "ETH");

        const assetsVaultBalanceBeforeEigen = new BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        console.log("AssetsVault清空EigenStrategy前余额:", web3.utils.fromWei(assetsVaultBalanceBeforeEigen.toString(10), "ether"), "ETH");

        const eigenStrategyValueBefore = new BigNumber((await eigenStrategy.getAllValue.call()).toString());
        console.log("EigenStrategy清空前总价值:", web3.utils.fromWei(eigenStrategyValueBefore.toString(10), "ether"), "ETH");

        // Owner执行clearStrategy
        console.log("执行 EigenStrategy clearStrategy...");
        const tx1 = await stoneVault.clearStrategy(eigenStrategy.address, { from: deployer });
        console.log("EigenStrategy clearStrategy交易哈希:", tx1.tx);

        // 检查清空后的状态
        const eigenStrategyBalanceAfter = new BigNumber(await web3.eth.getBalance(eigenStrategy.address));
        console.log("EigenStrategy清空后余额:", web3.utils.fromWei(eigenStrategyBalanceAfter.toString(10), "ether"), "ETH");

        const assetsVaultBalanceAfterEigen = new BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        console.log("AssetsVault清空EigenStrategy后余额:", web3.utils.fromWei(assetsVaultBalanceAfterEigen.toString(10), "ether"), "ETH");

        // 验证 EigenStrategy 清空
        if (eigenStrategyBalanceAfter.lt(web3.utils.toWei("0.001", "ether"))) {
            console.log("✅ EigenStrategy 余额正确清空");
        } else {
            console.log("❌ EigenStrategy 余额未正确清空");
        }

        // 测试2: 清空 EigenStrategyPatch
        console.log("\n测试2: 清空 EigenStrategyPatch");

        // 记录清空前的状态
        const eigenStrategyPatchBalanceBefore = new BigNumber(await web3.eth.getBalance(eigenStrategyPatch.address));
        console.log("EigenStrategyPatch清空前余额:", web3.utils.fromWei(eigenStrategyPatchBalanceBefore.toString(10), "ether"), "ETH");

        const assetsVaultBalanceBeforePatch = new BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        console.log("AssetsVault清空EigenStrategyPatch前余额:", web3.utils.fromWei(assetsVaultBalanceBeforePatch.toString(10), "ether"), "ETH");

        const eigenStrategyPatchValueBefore = new BigNumber((await eigenStrategyPatch.getAllValue.call()).toString());
        console.log("EigenStrategyPatch清空前总价值:", web3.utils.fromWei(eigenStrategyPatchValueBefore.toString(10), "ether"), "ETH");

        // Owner执行clearStrategy
        console.log("执行 EigenStrategyPatch clearStrategy...");
        const tx2 = await stoneVault.clearStrategy(eigenStrategyPatch.address, { from: deployer });
        console.log("EigenStrategyPatch clearStrategy交易哈希:", tx2.tx);

        // 检查清空后的状态
        const eigenStrategyPatchBalanceAfter = new BigNumber(await web3.eth.getBalance(eigenStrategyPatch.address));
        console.log("EigenStrategyPatch清空后余额:", web3.utils.fromWei(eigenStrategyPatchBalanceAfter.toString(10), "ether"), "ETH");

        const assetsVaultBalanceAfterPatch = new BigNumber(await web3.eth.getBalance(assetsVaultAddress));
        console.log("AssetsVault清空EigenStrategyPatch后余额:", web3.utils.fromWei(assetsVaultBalanceAfterPatch.toString(10), "ether"), "ETH");

        // 验证 EigenStrategyPatch 清空
        if (eigenStrategyPatchBalanceAfter.lt(web3.utils.toWei("0.001", "ether"))) {
            console.log("✅ EigenStrategyPatch 余额正确清空");
        } else {
            console.log("❌ EigenStrategyPatch 余额未正确清空");
        }

        // 验证策略价值变为0
        const eigenStrategyValueAfter = new BigNumber((await eigenStrategy.getAllValue.call()).toString());
        console.log("EigenStrategy清空后总价值:", web3.utils.fromWei(eigenStrategyValueAfter.toString(10), "ether"), "ETH");

        const eigenStrategyPatchValueAfter = new BigNumber((await eigenStrategyPatch.getAllValue.call()).toString());
        console.log("EigenStrategyPatch清空后总价值:", web3.utils.fromWei(eigenStrategyPatchValueAfter.toString(10), "ether"), "ETH");

        if (eigenStrategyValueAfter.eq(0) && eigenStrategyPatchValueAfter.eq(0)) {
            console.log("✅ 两个策略总价值都正确变为0");
        } else {
            console.log("❌ 策略总价值未正确变为0");
        }

        // 验证资金回到 AssetsVault
        const totalClearedValue = eigenStrategyValueBefore.plus(eigenStrategyPatchValueBefore);
        const assetsVaultIncrease = assetsVaultBalanceAfterPatch.minus(assetsVaultBalanceBeforeEigen);

        console.log("总清空价值:", web3.utils.fromWei(totalClearedValue.toString(10), "ether"), "ETH");
        console.log("AssetsVault总增加:", web3.utils.fromWei(assetsVaultIncrease.toString(10), "ether"), "ETH");

        if (assetsVaultIncrease.gte(totalClearedValue)) {
            console.log("✅ 资金正确回到 AssetsVault");
        } else {
            console.log("❌ 资金未正确回到 AssetsVault");
        }

        // 验证当前策略配置
        const finalStrategies = await strategyController.getStrategies();
        console.log("\n最终策略配置:");
        console.log("策略数量:", finalStrategies[0].length);
        console.log("策略列表:", finalStrategies[0]);
        console.log("策略比例:", finalStrategies[1].map(r => r.toString()));

        console.log("\n✅ 所有clearStrategy功能测试完成!");

        console.log("\n所有测试用例执行完成!");

        callback();
    } catch (e) {
        console.error("测试失败:", e);
        callback(e);
    }
}