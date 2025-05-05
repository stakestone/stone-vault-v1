const BigNumber = require('bignumber.js');
const ethers = require('ethers');
const Abi = web3.eth.abi;

// 合约声明
const IERC20 = artifacts.require("IERC20");
const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const Proposal = artifacts.require("Proposal");
const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");

// 地址配置
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const proposer = "0x83000EF01eD5C15462ef20066091Abd3654e523f";
const eigenLSTRestakingAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddr = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";

// 辅助函数
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}

module.exports = async function (callback) {
    try {
        /**********************************/
        /* 第一部分：补丁合约测试 */
        /**********************************/
        console.log("======== 开始补丁合约测试 ========");
        const provider = ethers.getDefaultProvider("http://localhost:7777");
        // 解锁第一个地址 (deployer)
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [deployer],
            id: 1,
        });

        // 解锁第二个地址 (proposer)
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [proposer],
            id: 2,  // 注意修改 id 值
        });

        console.log(`已解锁地址: ${deployer} 和 ${proposer}`);
        async function setBalance(address, ethAmount) {
            // 转换ETH为Wei（16进制）
            const wei = ethers.utils.parseEther(ethAmount.toString()).toHexString();

            await provider.send("anvil_setBalance", [
                address,  // 目标地址
                wei       // 金额（16进制Wei）
            ]);

            console.log(`✅ 地址 ${address} 余额已设置为 ${ethAmount} ETH`);
        }
        await setBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 10);

        // 部署补丁合约
        const eigenLSTRestakingPatch = await EigenLSTRestakingPatch.new(
            strategyControllerAddr,
            "EigenLayer LST Restaking Patch",
            delegationManagerAddr,
            eigenStrategyAddr,
            eigenLSTRestakingAddr,
            { from: deployer }
        );
        console.log("EigenLSTRestakingPatch 部署地址: ", eigenLSTRestakingPatch.address);

        // 这里可以添加补丁合约的其他测试...

        /**********************************/
        /* 第二部分：提案流程测试 */
        /**********************************/
        console.log("======== 开始提案流程测试 ========");

        const strategyController = await StrategyController.at(strategyControllerAddr);
        console.log("strategyController: ", strategyController.address);
        strategies = await strategyController.getStrategies();
        console.log("strategies are : ", strategies);
        console.log("strategy length is : ", strategies[0].length);
        // // const stoneVault = await StoneVault.at("");
        let strategy1 = strategies[0][0];
        console.log("strategy1 is : ", strategies[0][0]);
        let strategy2 = strategies[0][1];
        console.log("strategy2 is : ", strategies[0][1]);
        let strategy3 = strategies[0][2];
        console.log("strategy3 is : ", strategies[0][2]);

        console.log("strategy1's portion is : ", strategies[1][0].toString(10));
        console.log("strategy2's portion is : ", strategies[1][1].toString(10));
        console.log("strategy3's portion is : ", strategies[1][2].toString(10));

        const proposal = await Proposal.at("0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b");
        await proposal.setVotePeriod(24 * 60 * 60, { from: proposer }); // 1day投票期

        const EigenLayerLSTStrategyAddr = eigenLSTRestakingAddr;
        const NativeLendingStrategyAddr = "0x2D70868f12A05b8C347974415baC5de053DAa376";
        const SymbioticWBETHStrategyAddr = "0x58907ad5c7eD1EaB5FdCc0Cc347F25bF5BC0e7da";

        // 使用刚部署的补丁合约地址
        const eigenLSTRestakingPatchAddr = eigenLSTRestakingPatch.address;

        // 准备提案数据
        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [
                [
                    EigenLayerLSTStrategyAddr,
                    NativeLendingStrategyAddr,
                    SymbioticWBETHStrategyAddr,
                    eigenLSTRestakingPatchAddr
                ],
                [87e4, 1e4, 12e4, 0] // 权重分配
            ]
        );
        const data3 = `${selector2}${encodedParams3.slice(2)}`;
        console.log("提案数据: ", data3);

        // 提交提案
        await proposal.propose(data3, { from: proposer });

        // 投票流程
        const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
        const stone = await Stone.at(st);

        const proposals = await proposal.getProposals();
        console.log("当前所有提案: ", proposals);
        const latestProposal = proposals[proposals.length - 1];

        await stone.approve(proposal.address, BigNumber(100000).times(1e18), { from: deployer });
        await proposal.voteFor(latestProposal, BigNumber(1e14), true, { from: deployer });

        console.log("latestProposal: ", latestProposal);
        let proposalDetail = await proposal.proposalDetails(latestProposal);
        let deadline = proposalDetail.deadline;
        console.log("deadline is : ", deadline.toString(10));

        // 增加时间并挖出对应数量的空块（Anvil 特有）
        await provider.send("anvil_mine", [
            "0x1",       // 挖 1 个块
            "0x15180"    // 每个块间隔 86400 秒（16进制，即 24 小时）
        ]);
        const canVote = await proposal.canVote(latestProposal);
        if (!canVote) {
            await proposal.retrieveTokenFor(latestProposal, { from: deployer });
            await proposal.execProposal(latestProposal, { from: deployer });

            strategies = await strategyController.getStrategies();
            console.log("strategies are : ", strategies);
            console.log("strategy length is : ", strategies[0].length);
            // // const stoneVault = await StoneVault.at("");
            let strategy1 = strategies[0][0];
            console.log("strategy1 is : ", strategies[0][0]);
            let strategy2 = strategies[0][1];
            console.log("strategy2 is : ", strategies[0][1]);
            let strategy3 = strategies[0][2];
            console.log("strategy3 is : ", strategies[0][2]);
            let strategy4 = strategies[0][3];
            console.log("strategy4 is : ", strategies[0][3]);

            console.log("strategy1's portion is : ", strategies[1][0].toString(10));
            console.log("strategy2's portion is : ", strategies[1][1].toString(10));
            console.log("strategy3's portion is : ", strategies[1][2].toString(10));
            console.log("strategy4's portion is : ", strategies[1][3].toString(10));

            // // 1. 获取sharePrice
            // const sharePriceRaw = await stoneVault.currentSharePrice.call();
            // const sharePrice = new BigNumber(sharePriceRaw.toString()).div(1e18); // 转为ETH单位

            // // 2. 获取withdrawingSharesInRound
            // const withdrawingSharesInRoundRaw = await stoneVault.withdrawingSharesInRound.call();
            // const withdrawingSharesInRound = new BigNumber(withdrawingSharesInRoundRaw.toString());

            // // 3. 计算需要偿还的ETH金额
            // const repayToAssetVault = withdrawingSharesInRound
            //     .multipliedBy(sharePrice)
            //     .div(1e18);

            // console.log("sharePrice(ETH):", sharePrice.toString());
            // console.log("withdrawingSharesInRound:", withdrawingSharesInRound.toString());
            // console.log("repayToAssetVault(ETH):", repayToAssetVault.toString());

            const result = await stoneVault.rollToNextRound();
            console.log("结算完成! 交易哈希: ", result.tx);
        } else {
            console.log("投票仍在进行中");
        }

        callback();
    } catch (e) {
        console.error("执行出错:", {
            message: e.message,
            stack: e.stack,
            data: e.data
        });
        callback(e);
    }
};