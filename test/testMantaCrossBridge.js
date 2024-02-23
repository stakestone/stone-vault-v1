const BigNumber = require('bignumber.js');

const DepositBridge = artifacts.require("DepositBridge");

const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const user1 = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";
const user2 = "0xAC5CC232D28257b30d79d3b26760499BD33bC978";

module.exports = async function (callback) {
    let dstAddress = user1;
    let gasPaidForCrossChain = BigNumber(1e16);
    try {
        let amount = BigNumber(1e14);
        const depositBridge = await DepositBridge.at("0xdAf1695c41327b61B9b9965Ac6A5843A3198cf07");
        console.log("depositBridge is : ", depositBridge.address);
        let estimateGas = await depositBridge.estimateSendFee(
            amount,
            dstAddress);
        console.log("nativeFee is :", BigNumber(estimateGas.nativeFee).toString(10));
        console.log("zroFee is :", BigNumber(estimateGas.zroFee).toString(10));

        await depositBridge.bridgeTo(amount, dstAddress, gasPaidForCrossChain, {
            value: BigNumber(2e16).toString(10),    //layzero gas fee
            from: user1
        });
        console.log("depositBridge success amount is :", amount.toString(10));
        // let depAmount = BigNumber(2e17);
        // await web3.eth.sendTransaction({
        //     from: deployer,
        //     to: depositBridge.address,
        //     value: depAmount.toString(10)
        // })
        // let realAmount = depAmount.minus(BigNumber(estimateGas.nativeFee));

        // console.log("depositBridge success realAmount is :", realAmount.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}