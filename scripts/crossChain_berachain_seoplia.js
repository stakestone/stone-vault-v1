const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const ethers = require('ethers');
const Stone = artifacts.require("Stone");
module.exports = async function (callback) {
    try {
        //fee part
        const from_adress = "0x532C7CAF65974f813132C28ce80E6E10E5af26c4";
        const to_address = "0x532C7CAF65974f813132C28ce80E6E10E5af26c4";
        const bera_linkId = 10256;
        const stone_sepolia = await Stone.at("0x0D26Efb8bb3122DEd52e814b4B428133Efc82272");
        const amount = BigNumber(1e13).toString(10);
        const packedData = ethers.utils ? ethers.utils.solidityPack(["bytes"], ["0x"]) : "0x";

        let result = await stone_sepolia.sendFrom(
            from_adress,
            bera_linkId,
            to_address,
            amount,
            from_adress,
            ZERO_ADDRESS,
            packedData,
            {
                value: BigNumber(2e15).toString(),    //layzero gas fee
                // value: BigNumber(feePart.nativeFee).toString(10), //BigNumber(3e15).toString(),    //layzero gas fee
                from: from_adress
            }
        );

        callback();
    } catch (e) {
        console.error("Error:", e.message); // Log the error message for debugging

        callback(e);
    }
}
