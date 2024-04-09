const BigNumber = require('bignumber.js');

const DepositBridge = artifacts.require("DepositBridge");

const user = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
const destuser = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";

module.exports = async function (callback) {
    let dstAddress = destuser;
    try {
        let amount = BigNumber(1e15);
        const depositBridge = await DepositBridge.at("0x1b70Ff1e5152FDb8425A2B84b098DF2F9C1DF54E");
        console.log("depositBridge is : ", depositBridge.address);
        let feePart = await depositBridge.estimateSendFee(
            amount,
            dstAddress);
        console.log("nativeFee is :", BigNumber(feePart.nativeFee).toString(10));
        console.log("zroFee is :", BigNumber(feePart.zroFee).toString(10));
        let gasPaidForCrossChain = BigNumber(feePart.nativeFee);

        await depositBridge.bridgeTo(amount, dstAddress, gasPaidForCrossChain, {
            value: amount.plus(BigNumber(feePart.nativeFee)).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
            from: user
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