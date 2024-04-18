const BigNumber = require('bignumber.js');

const DepositBridge = artifacts.require("DepositBridge");

const user = "0x2D243d1F365c23eD87DEC86e8291BaE754c149C6";
const destuser = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";

module.exports = async function (callback) {
    let dstAddress = destuser;
    try {
        let amount = BigNumber(1e15);
        //astar zkevm 
        const depositBridge = await DepositBridge.at("0xFb4cb3F473203faC25d292701e3274c298909A03");
        console.log("depositBridge is : ", depositBridge.address);
        let feePart = await depositBridge.estimateSendFee(
            amount,
            dstAddress);
        console.log("nativeFee is :", BigNumber(feePart.nativeFee).toString(10));
        console.log("zroFee is :", BigNumber(feePart.zroFee).toString(10));
        let gasPaidForCrossChain = BigNumber(feePart.nativeFee);

        await depositBridge.bridgeTo(amount, dstAddress, gasPaidForCrossChain, {
            value: amount.plus(gasPaidForCrossChain).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
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