const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
const StoneVault = artifacts.require("StoneVault");

const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const MockToken = artifacts.require("MockToken");

module.exports = async function (callback) {
    const user = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";

    try {

        const stone = await MockToken.at("0xC64f5835b45672f8e7d0DC24540314408a4EAc28");
        console.log("token: ", stone.address);
        const eth_deposit_amount = BigNumber(4e17);
        const stoneVault = await StoneVault.at("0xfbb4203DC426498fDc80fe081e4E4bD99c949e06");
        await stoneVault.deposit({
            value: eth_deposit_amount,
            from: user
        });
        let userStone = BigNumber(await stone.balanceOf(user));
        console.log("userStone is : ", userStone.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}
