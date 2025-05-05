const BigNumber = require('bignumber.js');
const { expect } = require('chai');
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const IERC20 = artifacts.require("IERC20");

// 合约地址配置
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";
const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddr = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";
const originalEigenLSTAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

// 测试账户
let owner, controller;
contract("EigenLSTRestakingPatch", (accounts) => {
    let patchInstance;
    const [owner, controller, user] = accounts;

    before(async () => {
        // 部署补丁合约
        patchInstance = await EigenLSTRestakingPatch.new(
            strategyControllerAddr,
            "EigenLayer LST Restaking Patch",
            delegationManagerAddr,
            eigenStrategyAddr,
            originalEigenLSTAddr,
            { from: owner }
        );
    });

    describe("Basic Functionality", () => {
        it("should have correct initial state", async () => {
            expect(await patchInstance.delegationManager()).to.equal(delegationManagerAddr);
            expect(await patchInstance.eigenStrategy()).to.equal(eigenStrategyAddr);
            expect(await patchInstance.controller()).to.equal(strategyControllerAddr);
        });

        it("should calculate invested value", async () => {
            // 存入测试资金
            await patchInstance.deposit({
                from: strategyControllerAddr,
                value: web3.utils.toWei("1", "ether")
            });

            const value = await patchInstance.getInvestedValue();
            expect(new BigNumber(value).to.be.a('BigNumber');
        });
    });

    describe("Invoke Function", () => {
        it("should execute delegatecall to target", async () => {
            // 构造调用数据 - 查询operator状态
            const callData = web3.eth.abi.encodeFunctionCall({
                name: "isOperator",
                type: "function",
                inputs: [{ type: "address", name: "operator" }]
            }, [owner]);

            const tx = await patchInstance.invoke(
                delegationManagerAddr,
                0,
                callData,
                { from: owner }
            );

            expect(tx.receipt.status).to.be.true;
        });

        it("should revert if called by non-owner", async () => {
            await expect(
                patchInstance.invoke(
                    delegationManagerAddr,
                    0,
                    "0x12345678",
                    { from: user }
                )
            ).to.be.reverted;
        });
    });

    describe("Upgrade Compatibility", () => {
        it("should handle queued withdrawals from original contract", async () => {
            // 模拟原始合约有排队提现
            // 这里需要根据实际接口构造测试数据
            const mockShares = [[web3.utils.toWei("5", "ether")]];

            // 在实际测试中，您需要设置EigenLayer测试环境或使用mock
            const value = await patchInstance.getInvestedValue();
            expect(new BigNumber(value)).to.be.a('BigNumber');
        });
    });
});