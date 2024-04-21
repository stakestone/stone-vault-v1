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
const EigenStrategy = artifacts.require('EigenStrategy');
const SwappingAggregator = artifacts.require("SwappingAggregator");
const swappingAggregatorAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const LidoWithdrawalQueue = artifacts.require("MockLidoWithdrawalQueue");
const DelegationManager = artifacts.require("MockDelegationManager");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const StrategyManager = artifacts.require("MockStrategyManager");
const MockToken = artifacts.require("MockToken");

contract("test_EigenLSTRestaking", async ([deployer, feeRecipient, taker1, taker2, taker3, operator1, operator2, controllerAddr]) => {

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
        const strategyManagerAddr = strategyManager.address;

        const delegationManagerAddr = await DelegationManager();

        const lidoWithdrawalQueueAddr = await LidoWithdrawalQueue();

        let eigenStrategy = await EigenStrategy.new(controllerAddr, 'eigenLSTStrategy');
        let eigenStrategyAddr = eigenStrategy.address;

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

        await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: taker1
        });
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

        await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: taker1
        });
    });

});


