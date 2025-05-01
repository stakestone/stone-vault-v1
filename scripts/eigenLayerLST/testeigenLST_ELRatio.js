const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const IERC20 = artifacts.require("IERC20");
const EigenLSTRestaking = artifacts.require('strategies/eigen/EigenLSTRestaking');
const StoneVault = artifacts.require("StoneVault");
const Stone = artifacts.require("Stone");
const stoneAddr = "0x7122985656e38BDC0302Db86685bb972b145bD3C";
const stETHAddr = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84";
const user = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394"; //for stETH
const ELStrAddr = '0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982';
const stakeStoneAddr = '0xA62F9C5af106FeEE069F38dE51098D9d81B90572';
const abi = {
    "anonymous": false,
    "inputs": [
        {
            "indexed": false,
            "internalType": "bytes32",
            "name": "withdrawalRoot",
            "type": "bytes32"
        },
        {
            "components": [
                {
                    "internalType": "address",
                    "name": "staker",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "delegatedTo",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "withdrawer",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "nonce",
                    "type": "uint256"
                },
                {
                    "internalType": "uint32",
                    "name": "startBlock",
                    "type": "uint32"
                },
                {
                    "internalType": "address[]",
                    "name": "strategies",
                    "type": "address[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "shares",
                    "type": "uint256[]"
                }
            ],
            "indexed": false,
            "internalType": "struct IDelegationManager.Withdrawal",
            "name": "withdrawal",
            "type": "tuple"
        }
    ],
    "name": "WithdrawalQueued",
    "type": "event"
}
module.exports = async function (callback) {
    try {
        let stakeStone = await StoneVault.at(stakeStoneAddr);
        let stone = await Stone.at(stoneAddr);
        const eigenLSTRestaking = await EigenLSTRestaking.at(ELStrAddr);
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);

        let restakingValue = BigNumber(await eigenLSTRestaking.getRestakingValue({
            from: user
        }));
        console.log("restakingValue is : ", restakingValue.toString(10));

        let unstakingValue = BigNumber(await eigenLSTRestaking.getUnstakingValue({ from: user }));
        console.log("unstakingValue is : ", unstakingValue.toString(10));

        let price = BigNumber(await stakeStone.currentSharePrice.call());
        console.log("price is : ", price.toString(10));

        let total = BigNumber(await stone.totalSupply());
        console.log("total is : ", total.toString(10));

        let ratio = restakingValue.plus(unstakingValue).div(total)
        console.log("ratio is : ", ratio.toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}



