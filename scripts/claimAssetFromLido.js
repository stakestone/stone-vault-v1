// truffle compile
// truffle exec scripts/claimAssetFromLido.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
//const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");


module.exports = async function (callback) {
    try {

        const stETHHoldingStrategy = await STETHHoldingStrategy.at("0xF97C478f34E1dBA7E399b973f4b720bA5885290b");

        let pending = BigNumber(await stETHHoldingStrategy.getPendingValue.call());

        console.log("stETH pending is : ", pending.toString(10));
        // await stETHHoldingStrategy.claimAllPendingAssets.call();

        // pending = BigNumber(await stETHHoldingStrategy.getPendingValue.call());

        // console.log("stETH pending after claim is : ", pending.toString(10));
        callback();
    } catch (e) {
        callback(e);
    }

}