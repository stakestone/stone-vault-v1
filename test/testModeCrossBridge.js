const BigNumber = require('bignumber.js');

const DepositBridge = artifacts.require("DepositBridge");

const user = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
const destuser = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";

module.exports = async function (callback) {
    let dstAddress = destuser;
    let gasPaidForCrossChain = BigNumber(1e15);
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