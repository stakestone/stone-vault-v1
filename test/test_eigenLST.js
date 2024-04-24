const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const { expect } = require('chai');
const { ethers } = require("ethers");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');
const TruffleConfig = require('../truffle-config');
const EigenLSTRestaking = artifacts.require('EigenLSTRestaking');
const EigenStrategy = artifacts.require('MockEigenStrategy');
const SwappingAggregator = artifacts.require("MockSwappingAggregator");
const LidoWithdrawalQueue = artifacts.require("MockLidoWithdrawalQueue");
const DelegationManager = artifacts.require("MockDelegationManager");
const StrategyManager = artifacts.require("MockStrategyManager");
const MockToken = artifacts.require("MockToken");

let lidoWithdrawalQueueAddr, TOKEN1, delegationManager, delegationManagerAddr, strategyManager, strategyManagerAddr, swappingAggregator, swappingAggregatorAddr, eigenStrategy, eigenStrategyAddr, stETHAddr;
contract("test_EigenLSTRestaking", async ([deployer, feeRecipient, taker1, taker2, taker3, operator1, operator2, controllerAddr]) => {
    const gasPrice = TruffleConfig.networks.local.gasPrice; // 获取 gasPrice 设置
    console.log('Gas price:', gasPrice.toString());

    beforeEach(async () => {

        // 部署MockstETHToken合约
        TOKEN1 = {
            "name": "stETHToken",
            "symbol": "stETH",
            "supply": "10000000000000000000000000",
        }
        stETH = await MockToken.new(TOKEN1.name, TOKEN1.symbol);
        stETHAddr = stETH.address;
        strategyManager = await StrategyManager.new();
        strategyManagerAddr = strategyManager.address;

        const wethAddr = "0x94373a4919B3240D86eA41593D5eBa789FEF3848";
        swappingAggregator = await SwappingAggregator.new(wethAddr);
        swappingAggregatorAddr = swappingAggregator.address;
        console.log("swappingAggregatorAddr is : ", swappingAggregatorAddr);
        await stETH.mint(swappingAggregatorAddr, BigNumber(100000).times(1e18).toString(10));

        delegationManager = await DelegationManager.new();
        delegationManagerAddr = delegationManager.address;

        const lidoWithdrawalQueue = await LidoWithdrawalQueue.new();
        lidoWithdrawalQueueAddr = lidoWithdrawalQueue.address;

        eigenStrategy = await EigenStrategy.new(controllerAddr, 'eigenLSTStrategy');
        eigenStrategyAddr = eigenStrategy.address;

    });

    it("test1_user deposit ETH", async () => {

        let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
        let eigenLSTRestakingAddr = eigenLSTRestaking.address;
        await eigenLSTRestaking.setRouter(true, true); //on dex
        let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
        let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
        console.log("st_buyOnDex : ", st_buyOnDex);
        console.log("st_sellOnDex : ", st_sellOnDex);

        const eth_deposit_amount = BigNumber(10).times(1e18);
        let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
        let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        let controllerBalance_stETH = BigNumber(await stETH.balanceOf(controllerAddr));
        let eigenLSTRestakingBalance_stETH = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));

        let tx = await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        await eigenLSTRestaking.swapToToken(eth_deposit_amount);

        let controllerBalance_stETH1 = BigNumber(await stETH.balanceOf(controllerAddr));
        console.log("controllerBalance_stETH1 is : ", controllerBalance_stETH1.toString());
        let eigenLSTRestakingBalance_stETH1 = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("eigenLSTRestakingBalance_stETH1 is : ", eigenLSTRestakingBalance_stETH1.toString());

        let eigenLSTRestakingBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        assert.strictEqual(eigenLSTRestakingBalance1.minus(eigenLSTRestakingBalance).toString(), eth_deposit_amount.toString());
        console.log("eigenLSTRestakingBalance ether amount:", eigenLSTRestakingBalance.toString());
        let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
        const gasUsed = tx.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));
        assert.isTrue(Math.abs(controllerBalance.minus(controllerBalance1).minus(eth_deposit_amount).minus(gas)) < 10, 'Absolute difference should be less than 10');

    });

    // it("test2_user deposit ETH_buffer enough_withdraw ETH", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     let eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(10).times(1e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     let tx1 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });

    //     let tx2 = await eigenLSTRestaking.instantWithdraw(
    //         eth_deposit_amount, {
    //         from: controllerAddr
    //     });
    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     assert.strictEqual(eigenLSTRestakingBalance.toString(), '0');
    //     let controllerBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     const gasUsed1 = BigNumber(tx1.receipt.gasUsed);
    //     console.log('Gas used1:', gasUsed1.toString());
    //     const gasUsed2 = BigNumber(tx2.receipt.gasUsed);
    //     console.log('Gas used2:', gasUsed2.toString());
    //     let gas = BigNumber(gasPrice).times(gasUsed1.plus(gasUsed2));
    //     console.log("gas is : ", BigNumber(gas).toString(10));

    //     let diff = Math.abs(controllerBalance.minus(controllerBalance1).minus(gas));
    //     console.log("diff is : ", BigNumber(diff).toString(10));
    //     assert.isTrue(Math.abs(controllerBalance.minus(controllerBalance1).minus(gas)) < 10, 'Absolute difference should be less than 10');

    // });
    // it("test3_user deposit ETH_buffer enough_negative scenarios_withdraw ETH", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     let eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(10).times(1e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     let tx1 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });

    //     await truffleAssert.fails(
    //         eigenLSTRestaking.withdraw(
    //             eth_deposit_amount, {
    //             from: controllerAddr
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "at the same block"
    //     );
    //     await truffleAssert.fails(
    //         eigenLSTRestaking.withdraw(
    //             eth_deposit_amount, {
    //             from: taker1
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "not controller"
    //     );
    // });
    // it("test4_get all value: user deposit ETH twice_buffer enough_withdraw ETH", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     let eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(5e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     let tx1 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     let tx2 = await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount.times(2),
    //         from: controllerAddr
    //     });
    //     // set UserUnderlyingValue on Eigen 
    //     const mockEigenUserValue = BigNumber(100e18);
    //     await eigenStrategy.setUserUnderlyingViewMockValue(mockEigenUserValue);
    //     let value = BigNumber(await eigenLSTRestaking.getAllValue.call({
    //         from: controllerAddr
    //     }));
    //     let eigenLSTRestakingBalance = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
    //     assert.strictEqual(eigenLSTRestakingBalance.plus(mockEigenUserValue).toString(), value.toString());
    //     assert.strictEqual(eth_deposit_amount.times(3).plus(mockEigenUserValue).toString(), value.toString());

    //     let tx3 = await eigenLSTRestaking.instantWithdraw(
    //         eth_deposit_amount, {
    //         from: controllerAddr
    //     });
    //     let value1 = BigNumber(await eigenLSTRestaking.getAllValue.call({
    //         from: controllerAddr
    //     }));
    //     assert.strictEqual(eth_deposit_amount.toString(), value.minus(value1).toString());

    // });
    // it("test5_get all value: tokenValue", async () => {};
    // it("test6_get all value: PendingAssets", async () => {};

    // it("test7_delegateTo", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     let eigenLSTRestakingAddr = eigenLSTRestaking.address;
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(5e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    // await eigenLSTRestaking.setEigenOperator(operator1);
    // const approverSignatureAndExpiry = {
    //     signature: operator1, // 一个有效的签名
    //     expiry: 1234567890 // 过期时间戳
    // };

    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        

    //     // 调用合约方法
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     // 等待区块被确认
    //     await sleep(2);
    //     await time.advanceBlock();
    //     // 验证是否正确调用了 DelegationManager 的 delegateTo 函数
    //     const isDelegateToCalled = await delegationManager.isDelegateToCalled();
    //     assert.strictEqual(isDelegateToCalled, true);
    //     assert.strictEqual(await delegationManager.lastOperator(), operator1);
    // const emittedEvents = result.logs.map(log => log.event);
    // expect(emittedEvents).to.include('DelegateTo');
    // });
    // it("test8_undelegate", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(5e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     await eigenLSTRestaking.setEigenOperator(operator1);
    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };

    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        

    //     // 调用合约方法
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     // 等待区块被确认
    //     await sleep(2);
    //     await time.advanceBlock();
    //     const isDelegateToCalled = await delegationManager.isDelegateToCalled();
    //     assert.strictEqual(isDelegateToCalled, true);
    //     assert.strictEqual(await delegationManager.lastOperator(), operator1);

    //     // 模拟 undelegate 函数返回的 withdrawalRoots
    //     const withdrawalRoots = ['0x1234567890'];
    //     const staker = controllerAddr;
    //     await delegationManager.setUndelegateResult(withdrawalRoots);

    //     // 调用合约方法
    //     const result = await eigenLSTRestaking.undelegate();
    //     const isUndelegateCalled = await delegationManager.isUndelegateCalled();
    //     expect(isUndelegateCalled).to.be.true;

    //     // 验证返回值是否正确
    //     const emittedEvents = result.logs.map(log => log.event);
    //     expect(emittedEvents).to.include('WithdrawalQueued');

    // });
    // it("test9_depositIntoStrategy_controller try to instant withdraw", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(5e18);

    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     console.log()
    //     const amount = ethers.utils.parseEther('2');
    //     await eigenLSTRestaking.depositIntoStrategy(amount);

    //     expect(await strategyManager.lastStrategy()).to.equal(eigenStrategyAddr);
    //     expect(await strategyManager.lastToken()).to.equal(stETHAddr);
    //     expect((await strategyManager.lastAmount()).toString()).to.equal(amount.toString());

    //     // // 验证返回的 shares 是否正确
    //     let shares = BigNumber(await strategyManager.shares());
    //     console.log("shares is : ", shares.toString());
    //     expect(shares.toString()).to.equal(amount.times(2).toString()); // 假设模拟逻辑为 amount * 2
    //     console.log("contract ETH balance is : ", BigNumber(await web3.eth.getBalance(eigenLSTRestaking.address)).toString());
    //     console.log("controllerAddr ETH balance1 is : ", BigNumber(await web3.eth.getBalance(controllerAddr)).toString());
    //     let controllBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     // 尝试取款
    //     let tx = await eigenLSTRestaking.instantWithdraw(
    //         eth_deposit_amount, {
    //         from: controllerAddr
    //     });

    //     let eigenBalance1 = BigNumber(await web3.eth.getBalance(eigenLSTRestaking.address));
    //     let controllBalance1 = BigNumber(await web3.eth.getBalance(controllerAddr));
    //     console.log("00contract ETH balance is : ", BigNumber(await web3.eth.getBalance(eigenLSTRestaking.address)).toString());
    //     console.log("00controllerAddr ETH balance1 is : ", BigNumber(await web3.eth.getBalance(controllerAddr)).toString());

    //     const gasUsed = tx.receipt.gasUsed;
    //     console.log('Gas used:', gasUsed.toString());
    //     let gas = BigNumber(gasPrice).times(BigNumber(gasUsed));

    //     assert.isTrue(Math.abs(controllBalance1.minus(controllBalance).minus(actualAmount).minus(gas)) < 1000, 'Absolute difference should be less than 10');
    //     assert.strictEqual(eigenBalance1.toString(), '0');
    // });
    // it("test9_delegate_depositIntoStrategy_controller try to instant withdraw", async () => {

    //     let eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking');
    //     await eigenLSTRestaking.setRouter(false, false);
    //     let st_buyOnDex = await eigenLSTRestaking.buyOnDex();
    //     let st_sellOnDex = await eigenLSTRestaking.sellOnDex();
    //     console.log("st_buyOnDex : ", st_buyOnDex);
    //     console.log("st_sellOnDex : ", st_sellOnDex);

    //     const eth_deposit_amount = BigNumber(5e18);
    //     let controllerBalance = BigNumber(await web3.eth.getBalance(controllerAddr));

    //     await eigenLSTRestaking.deposit({
    //         value: eth_deposit_amount,
    //         from: controllerAddr
    //     });
    //     await eigenLSTRestaking.setEigenOperator(operator1);
    //     const approverSignatureAndExpiry = {
    //         signature: operator1, // 一个有效的签名
    //         expiry: 1234567890 // 过期时间戳
    //     };

    //     const approverSalt = web3.utils.keccak256("salt value"); // 使用 web3 来生成一个盐值        

    //     // 调用合约方法
    //     await eigenLSTRestaking.delegateTo(approverSignatureAndExpiry, approverSalt);
    //     // 等待区块被确认
    //     await sleep(2);
    //     await time.advanceBlock();
    //     const isDelegateToCalled = await delegationManager.isDelegateToCalled();
    //     assert.strictEqual(isDelegateToCalled, true);
    //     assert.strictEqual(await delegationManager.lastOperator(), operator1);

    //     // 尝试取款
    //     await truffleAssert.fails(
    //         eigenLSTRestaking.instantWithdraw(
    //             eth_deposit_amount, {
    //             from: controllerAddr
    //         }),
    //         truffleAssert.ErrorType.REVERT,
    //         "at the same block"
    //     );
    //     // 模拟 undelegate 函数返回的 withdrawalRoots
    //     const withdrawalRoots = ['0x1234567890'];
    //     const staker = controllerAddr;
    //     await delegationManager.setUndelegateResult(withdrawalRoots);

    //     // 调用合约方法
    //     const result = await eigenLSTRestaking.undelegate();
    //     const isUndelegateCalled = await delegationManager.isUndelegateCalled();
    //     expect(isUndelegateCalled).to.be.true;

    //     // 验证返回值是否正确
    //     const emittedEvents = result.logs.map(log => log.event);
    //     expect(emittedEvents).to.include('WithdrawalQueued');

    // });
});



