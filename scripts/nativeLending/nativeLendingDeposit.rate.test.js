const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const IERC20 = artifacts.require("IERC20");
const IWETH9 = artifacts.require("IWETH9");
const NativeLendingETHStrategy = artifacts.require('NativeLendingETHStrategy');
const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const controllerAddr = "0x093f6c270ac22ec240f0c6fd7414ea774ca8d3e5"; //real user 0.6
const lpHolder = "0x2775F5F54862ABA9829254bBE2A2C5B40682b9c7"; //real user 0.0254 lp
const assert = require('assert');
const MockLpToken = artifacts.require("../MockLpToken");

module.exports = async function (callback) {
    try {
        let WETH = await IWETH9.at(WETHAddr);
        let lpToken = await MockLpToken.new();

        const nativeLendingETHStrategy = await NativeLendingETHStrategy.new(controllerAddr, 'Native Lending', lpToken.address, WETHAddr);
        const nativeLendingETHStrategyAddr = nativeLendingETHStrategy.address;
        console.log("nativeLendingETHStrategyAddr is : ", nativeLendingETHStrategyAddr);

        const owner = await nativeLendingETHStrategy.owner();
        console.log("owner is : ", owner);

        const eth_deposit_amount = BigNumber(1).times(1e18);

        // Ensure owner has sufficient ETH balance
        let controllerETHBalance = await web3.eth.getBalance(controllerAddr);
        console.log("controllerETHBalance before deposit: ", controllerETHBalance);

        // assert(controllerETHBalance >= eth_deposit_amount, "controller does not have enough ETH to deposit");
        await nativeLendingETHStrategy.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        // Perform the deposit transaction
        const tx = await nativeLendingETHStrategy.depositIntoNative(eth_deposit_amount, {
            from: owner
        });

        // Capture the event from the transaction receipt
        const depositEvent = tx.logs.find(log => log.event === 'Deposit');
        if (depositEvent) {
            const { amount, mintAmount } = depositEvent.args;
            console.log("Deposit amount: ", amount.toString());
            console.log("Mint amount: ", mintAmount.toString());
        } else {
            console.log("No Deposit event found");
        }
        console.log("deposit success");
        let nativeLp = BigNumber(await lpToken.balanceOf(nativeLendingETHStrategyAddr));
        console.log("nativeLp is : ", nativeLp.toString(10));
        assert.strictEqual(nativeLp.toString(10), eth_deposit_amount.toString(10));

        let allValue = BigNumber(await nativeLendingETHStrategy.getAllValue.call({ from: owner }));
        console.log("allValue is : ", allValue.toString(10));
        assert.strictEqual(allValue.toString(10), eth_deposit_amount.times(2).toString(10));
        callback();
    } catch (e) {
        callback(e);
    }
}

