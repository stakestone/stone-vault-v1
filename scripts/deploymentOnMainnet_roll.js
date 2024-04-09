// truffle exe scripts/deploymentOnMainnet_roll.js --network local
const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const fs = require('fs');
const path = require("path");

const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");

const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const RETHHoldingStrategy = artifacts.require("RETHHoldingStrategy");
const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");

const SwappingAggregator = artifacts.require("SwappingAggregator");

const MiningPool = artifacts.require("MiningPool");
const StoneAdapter = artifacts.require("StoneAdapter");
const StoneNFT = artifacts.require("StoneNFT");

const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const ROLL = artifacts.require("external/Roll");
const data = require("../test.json");

module.exports = async function (callback) {
    try {
        let stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        let rETHBalancerAuraStrategyAddr = "0x856EdF1B835ea02Bf11B16F041DF5A13Ef1EC3d1";
        ///
        let roll;
        if (data.hasOwnProperty("rollAddr") && data.rollAddr != "") {
            rollAddr = data.rollAddr;
            roll = await ROLL.at(rollAddr);
            console.log("roll: ", roll.address);
        } else {
            roll = await ROLL.new(stoneVaultAddr, rETHBalancerAuraStrategyAddr);
            console.log("roll is created: ", roll.address);

            data.rollAddr = roll.address;
            writeData(data);
        }

        callback();
    } catch (e) {
        callback(e);
    }

    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const rs = web3.utils.sha3(encoded);
        return '0x' + rs.substr(rs.length - 40, 40);
    }

    async function isContractExists(address) {
        const rs = await web3.eth.getCode(address);

        if (rs != '0x') {
            return true;
        } else {
            return false;
        }

    }

    function writeData(data) {
        fs.writeFileSync(path.resolve(__dirname, './test.json'),
            JSON.stringify(data, null, 4),
            {
                flag: 'w'
            },
        )
    }
}