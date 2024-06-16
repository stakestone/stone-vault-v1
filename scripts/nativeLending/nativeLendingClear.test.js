const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const IERC20 = artifacts.require("IERC20");
const IWETH9 = artifacts.require("IWETH9");
const NativeLendingETHStrategy = artifacts.require('NativeLendingETHStrategy');
const lpTokenAddr = "0xc41D25382889B1E484E28c4f9bbDBD6B6117e6b2";
const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const controllerAddr = "0x093f6c270ac22ec240f0c6fd7414ea774ca8d3e5"; //real user 0.6
const lpHolder = "0x2775F5F54862ABA9829254bBE2A2C5B40682b9c7"; //real user 0.0254 lp
const assert = require('assert');
const chai = require('chai');

module.exports = async function (callback) {
    try {
        // const gasPrice = BigNumber(TruffleConfig.networks.local.gasPrice); // 获取 gasPrice 设置
        const gasPrice = BigNumber(await web3.eth.getGasPrice());
        console.log('Gas price:', gasPrice);
        let WETH = await IWETH9.at(WETHAddr);
        let lpToken = await IERC20.at(lpTokenAddr);

        const nativeLendingETHStrategy = await NativeLendingETHStrategy.new(controllerAddr, 'Native Lending', lpTokenAddr, WETHAddr);
        const nativeLendingETHStrategyAddr = nativeLendingETHStrategy.address;
        console.log("nativeLendingETHStrategyAddr is : ", nativeLendingETHStrategyAddr);

        const owner = await nativeLendingETHStrategy.owner();
        console.log("owner is : ", owner);

        const eth_deposit_amount = BigNumber(1).times(1e18);

        // Ensure owner has sufficient ETH balance
        const controllerETHBalance = BigNumber(await web3.eth.getBalance(controllerAddr));
        console.log("controllerETHBalance before deposit: ", controllerETHBalance.toString(10));
        const tx0 = await nativeLendingETHStrategy.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        const tx1 = await nativeLendingETHStrategy.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        let controllerETHBalance_aftDeposit = BigNumber(await web3.eth.getBalance(controllerAddr));
        console.log("controllerETHBalance_aftDeposit is: ", controllerETHBalance_aftDeposit.toString(10));

        let gasUsed = tx0.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas0 = BigNumber(gasPrice).times(BigNumber(gasUsed));
        console.log('gas0:', gas0.toString());
        let gasUsed1 = tx1.receipt.gasUsed;
        console.log('Gas used1:', gasUsed1.toString());
        let gas1 = BigNumber(gasPrice).times(BigNumber(gasUsed1));
        console.log('gas1:', gas1.toString());

        chai.assert.isTrue(Math.abs(controllerETHBalance.minus(controllerETHBalance_aftDeposit).minus(eth_deposit_amount.times(2)).minus(gas0).minus(gas1)) < 2e14, 'Absolute difference should be less than 100');

        // Perform the deposit transaction
        const tx = await nativeLendingETHStrategy.depositIntoNative(eth_deposit_amount.times(2), {
            from: owner
        });

        console.log("deposit success");
        let nativeLp = BigNumber(await lpToken.balanceOf(nativeLendingETHStrategyAddr));
        console.log("nativeLp is : ", nativeLp.toString(10));

        await nativeLendingETHStrategy.withdrawFromNativeByAmount(eth_deposit_amount.times(2), {
            from: owner
        });
        nativeLp = BigNumber(await lpToken.balanceOf(nativeLendingETHStrategyAddr));
        console.log("nativeLp is : ", nativeLp.toString(10));
        assert.strictEqual(nativeLp.toString(10), '0');

        let tx2 = await nativeLendingETHStrategy.withdraw(eth_deposit_amount, {
            from: controllerAddr
        });
        let gasUsed2 = tx2.receipt.gasUsed;
        console.log('Gas used2:', gasUsed2.toString());
        let gas2 = BigNumber(gasPrice).times(BigNumber(gasUsed2));
        console.log('gas2:', gas2.toString());
        // Capture the event from the transaction receipt
        const WithdrawEvent = tx2.logs.find(log => log.event === 'Withdraw');
        if (WithdrawEvent) {
            const { amount, actualAmount } = WithdrawEvent.args;
            console.log("request amount: ", amount.toString());
            console.log("withdraw amount: ", actualAmount.toString());
            assert.strictEqual(amount.toString(10), actualAmount.toString(10));
            assert.strictEqual(eth_deposit_amount.toString(10), actualAmount.toString(10));

        } else {
            console.log("No WithdrawEvent found");
        }

        let tx3 = await nativeLendingETHStrategy.clear({
            from: controllerAddr
        });
        let gasUsed3 = tx3.receipt.gasUsed;
        console.log('Gas used3:', gasUsed3.toString());
        let gas3 = BigNumber(gasPrice).times(BigNumber(gasUsed3));
        console.log('gas3:', gas3.toString());
        // Capture the event from the transaction receipt
        const clearEvent = tx3.logs.find(log => log.event === 'Clear');
        if (clearEvent) {
            const { amount } = clearEvent.args;
            console.log("clear amount: ", amount.toString());
            assert.strictEqual(amount.toString(10), eth_deposit_amount.toString(10));

        } else {
            console.log("No clear event found");
        }

        controllerETHBalance_aft = BigNumber(await web3.eth.getBalance(controllerAddr));
        console.log("controllerETHBalance aft withdraw: ", controllerETHBalance_aft.toString(10));
        chai.assert.isTrue(Math.abs(controllerETHBalance.minus(controllerETHBalance_aft).minus(gas0).minus(gas1).minus(gas3)) < 4e14, 'Absolute difference should be less than 100');
        console.log("withdraw success");

        callback();
    } catch (e) {
        callback(e);
    }
}

