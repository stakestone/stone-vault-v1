const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const { ethers } = require("ethers");
const Stone = artifacts.require("Stone");
const StoneOFT = artifacts.require("StoneOFT");
module.exports = async function (callback) {
    try {
        const bnb_linkId = 102;
        const eth_linkId = 101;
        const blast_linkId = 243;
        const sei_linkId = 280;
        const arbitrum_linkId = 110;
        const optimism_linkId = 111;
        const manta_linkId = 217;
        const base_linkId = 184;
        // const stone_blast = await Stone.at("0xD2012fc1B913cE50732ebcaa7E601fe37Ac728C6");
        // const stone_optimism = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        // const stone_mode = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        // const stone_mantle = await Stone.at("0x2Fde62942759d7C0aaf25952Da4098423bC1264C");
        // const stone_astar = await Stone.at("0x80137510979822322193FC997d400D5A6C747bf7");
        // const stone_manta = await Stone.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");
        const aptos_linkId = 108;
        const from_adress = "0xEd6e4c3B1D0E93e52cC7C5aD5e4A897822033b13";
        //aptos account
        const to_address = "0x2ca806a12a4e368150a03fec27256f1988d580b92f524d1d5ddcea8b3ac65b51";
        const stone_eth = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");
        const stone_forAptos = await StoneOFT.at("0x8235139902590521BA96b9c26009D34080388d67");
        const amount = BigNumber(1e13);
        const packedData = "0x00010000000000000000000000000000000000000000000000000000000000030d40";
        const tupleData = [from_adress, ZERO_ADDRESS, packedData];
        await stone_eth.approve(stone_forAptos.address, BigNumber(100000).times(1e18), {
            from: from_adress
        });
        let result = await stone_forAptos.sendFrom(
            from_adress,
            aptos_linkId,
            to_address,
            amount,
            tupleData,
            {
                value: BigNumber(2e17).toString(),    //layzero gas fee
                from: from_adress
            }
        );
        console.log("cross success ");

        callback();
    } catch (e) {
        console.error("Error:", e.message); // Log the error message for debugging
        callback(e);
    }
}
