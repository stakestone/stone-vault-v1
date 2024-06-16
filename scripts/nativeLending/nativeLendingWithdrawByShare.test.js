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
        // assert(controllerETHBalance >= eth_deposit_amount, "controller does not have enough ETH to deposit");
        const tx0 = await nativeLendingETHStrategy.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        let controllerETHBalance_aftDeposit = BigNumber(await web3.eth.getBalance(controllerAddr));
        console.log("controllerETHBalance_aftDeposit is: ", controllerETHBalance_aftDeposit.toString(10));

        let gasUsed = tx0.receipt.gasUsed;
        console.log('Gas used:', gasUsed.toString());
        let gas0 = BigNumber(gasPrice).times(BigNumber(gasUsed));
        console.log('gas0:', gas0.toString());

        chai.assert.isTrue(Math.abs(controllerETHBalance.minus(controllerETHBalance_aftDeposit).minus(eth_deposit_amount).minus(gas0)) < 2e14, 'Absolute difference should be less than 100');

        // Perform the deposit transaction
        await nativeLendingETHStrategy.depositIntoNative(eth_deposit_amount, {
            from: owner
        });

        console.log("deposit success");
        let nativeLp = BigNumber(await lpToken.balanceOf(nativeLendingETHStrategyAddr));
        console.log("nativeLp is : ", nativeLp.toString(10));

        let tx = await nativeLendingETHStrategy.withdrawFromNativeByShare(eth_deposit_amount, {
            from: owner
        });
        // Capture the event from the transaction receipt
        const WithdrawByShareEvent = tx.logs.find(log => log.event === 'WithdrawByShare');
        if (WithdrawByShareEvent) {
            const { share, withdrawAmount } = WithdrawByShareEvent.args;
            console.log("WithdrawByShareEvent is: ", WithdrawByShareEvent);

            console.log("request share: ", share.toString());
            console.log("withdraw amount: ", withdrawAmount.toString());
            assert.strictEqual(share.toString(10), withdrawAmount.toString(10));
            assert.strictEqual(eth_deposit_amount.toString(10), withdrawAmount.toString(10));

        } else {
            console.log("No WithdrawByShareEvent found");
        }

        nativeLp = BigNumber(await lpToken.balanceOf(nativeLendingETHStrategyAddr));
        console.log("nativeLp is : ", nativeLp.toString(10));
        assert.strictEqual(nativeLp.toString(10), '0');

        let tx1 = await nativeLendingETHStrategy.withdraw(eth_deposit_amount, {
            from: controllerAddr
        });
        let gasUsed1 = tx1.receipt.gasUsed;
        console.log('Gas used1:', gasUsed1.toString());
        let gas1 = BigNumber(gasPrice).times(BigNumber(gasUsed1));
        console.log('gas1:', gas1.toString());
        // Capture the event from the transaction receipt
        const WithdrawEvent = tx1.logs.find(log => log.event === 'Withdraw');
        if (WithdrawEvent) {
            const { amount, actualAmount } = WithdrawEvent.args;
            console.log("request amount: ", amount.toString());
            console.log("withdraw amount: ", actualAmount.toString());
            assert.strictEqual(amount.toString(10), actualAmount.toString(10));
            assert.strictEqual(eth_deposit_amount.toString(10), actualAmount.toString(10));

        } else {
            console.log("No WithdrawEvent found");
        }

        controllerETHBalance_aft = BigNumber(await web3.eth.getBalance(controllerAddr));
        console.log("controllerETHBalance aft withdraw: ", controllerETHBalance_aft.toString(10));
        chai.assert.isTrue(Math.abs(controllerETHBalance.minus(controllerETHBalance_aft).minus(gas0).minus(gas1)) < 3e14, 'Absolute difference should be less than 100');
        console.log("withdraw success");

        callback();
    } catch (e) {
        callback(e);
    }
}

