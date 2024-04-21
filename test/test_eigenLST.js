const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const RLP = require('rlp');
const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');
const TruffleConfig = require('../truffle-config');
const truffleAssert = require('truffle-assertions');
const EigenLSTRestaking = artifacts.require('EigenLSTRestaking');
const EigenStrategy = artifacts.require('MockEigenStrategy');
const SwappingAggregator = artifacts.require("SwappingAggregator");
const swappingAggregatorAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const LidoWithdrawalQueue = artifacts.require("MockLidoWithdrawalQueue");
const DelegationManager = artifacts.require("MockDelegationManager");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const StrategyManager = artifacts.require("MockStrategyManager");
const MockToken = artifacts.require("MockToken");

let lidoWithdrawalQueueAddr, delegationManagerAddr, strategyManagerAddr, eigenStrategyAddr, stETHAddr;
contract("test_EigenLSTRestaking", async ([deployer, feeRecipient, taker1, taker2, taker3, operator1, operator2, controllerAddr]) => {
    const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
    console.log('Gas price:', gasPrice.toString());

    beforeEach(async () => {

        // 部署MockstETHToken合约
        const TOKEN1 = {
            "name": "stETHToken",
            "symbol": "stETH",
            "supply": "10000000000000000000000",
        }
        stETH = await MockToken.new(TOKEN1.name, TOKEN1.symbol);
        stETHAddr = stETH.address;
        const strategyManager = await StrategyManager.new();
        strategyManagerAddr = strategyManager.address;

        const delegationManager = await DelegationManager.new();
        delegationManagerAddr = delegationManager.address;

        const lidoWithdrawalQueue = await LidoWithdrawalQueue.new();
        lidoWithdrawalQueueAddr = lidoWithdrawalQueue.address;

        let eigenStrategy = await EigenStrategy.new(controllerAddr, 'eigenLSTStrategy');
        eigenStrategyAddr = eigenStrategy.address;

    });

    it("test1_user deposit ETH", async () => {

        let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        let eigenLSTRestakingAddr = eigenLSTRestaking.address;
        await eigenLSTRestaking.setRouter(false, false);
        let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
        let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
        console.log("st_buyOnDex : ", st_buyOnDex);
        console.log("st_sellOnDex : ", st_sellOnDex);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
        let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));

        let tx = await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        assert.strictEqual(eigenLSTRestakingBalance1.minus(eigenLSTRestakingBalance).toString(), eth_deposit_amount.toString());
        console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
        let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
        const gasUsed = tx.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        assert.isTrue(Math.abs(controllerBalance.minus(controllerBalance1).minus(eth_deposit_amount).minus(gas)) < 10, 'Absolute difference should be less than 10');

    });

    it("test2_user deposit ETH_buffer enough_withdraw ETH", async () => {

        let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        let eigenLSTRestakingAddr = eigenLSTRestaking.address;
        await eigenLSTRestaking.setRouter(false, false);
        let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
        let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
        console.log("st_buyOnDex : ", st_buyOnDex);
        console.log("st_sellOnDex : ", st_sellOnDex);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

        let tx1 = await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });

        let tx2 = await eigenLSTRestaking.instantWithdraw(
            eth_deposit_amount, {
            from: controllerAddr
        });
        let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        assert.strictEqual(eigenLSTRestakingBalance.toString(), '0');
        let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
        const gasUsed1 = BigNumber(tx1.receipt.gasUsed);
        console.log('Gas used1:', gasUsed1.toString());
        const gasUsed2 = BigNumber(tx2.receipt.gasUsed);
        console.log('Gas used2:', gasUsed2.toString());
        let gas = BigNumber(gasPrice).times(gasUsed1.plus(gasUsed2));
        console.log("gas is : ", BigNumber(gas).toString(10));

        let diff = Math.abs(controllerBalance.minus(controllerBalance1).minus(gas));
        console.log("diff is : ", BigNumber(diff).toString(10));
        assert.isTrue(Math.abs(controllerBalance.minus(controllerBalance1).minus(gas)) < 10, 'Absolute difference should be less than 10');

    });
    it("test3_user deposit ETH_buffer enough_negative scenarios_withdraw ETH", async () => {

        let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        let eigenLSTRestakingAddr = eigenLSTRestaking.address;
        await eigenLSTRestaking.setRouter(false, false);
        let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
        let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
        console.log("st_buyOnDex : ", st_buyOnDex);
        console.log("st_sellOnDex : ", st_sellOnDex);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

        let tx1 = await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });

        await truffleAssert.fails(
            eigenLSTRestaking.withdraw(
                eth_deposit_amount, {
                from: controllerAddr
            }),
            truffleAssert.ErrorType.REVERT,
            "at the same block"
        );
        await truffleAssert.fails(
            eigenLSTRestaking.withdraw(
                eth_deposit_amount, {
                from: taker1
            }),
            truffleAssert.ErrorType.REVERT,
            "not controller"
        );
    });

});


