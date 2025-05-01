const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const chai = require('chai');
const Abi = web3.eth.abi;
const IStrategyManager = artifacts.require("IStrategyManager");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");
const IERC20 = artifacts.require("IERC20");
const EigenLSTRestaking = artifacts.require('strategies/eigen/EigenLSTRestaking');
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"; //real
const SwappingAggregator = artifacts.require("MockSwappingAggregator");
const controllerAddr = "0xAFbf909a63CD97B131d99F2d1898717A0ac236ce"; //eigenTest1
const delegationManagerAddr = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
const eigenStrategyAddr = "0xfaAc8B3Fba2fcC01e4DDB5d5Fc761578d0D05545"; //for stETH
// const strategyManagerAddr = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
const deployer = "0x613670cC9D11e8cB6ea297bE7Cac08187400C936";
const eigenLSTRestakingAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
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
        // let stETH = await IERC20.at(stETHAddr);
        // let eigenStrategy = await IEigenStrategy.at(eigenStrategyAddr);
        // const strategyManager = await IStrategyManager.at(strategyManagerAddr);
        // const delegationManager = await IDelegationManager.at(delegationManagerAddr);
        // await stETH.approve(strategyManager.address, MAX_UINT256);

        // let swappingAggregator = await SwappingAggregator.new({ from: deployer });
        // swappingAggregatorAddr = swappingAggregator.address;
        // console.log("swappingAggregatorAddr is : ", swappingAggregatorAddr);

        // await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
        //     from: bankAddr
        // });
        // await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
        // let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        // console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());

        // let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        // console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

        const eigenLSTRestaking = await EigenLSTRestaking.at(eigenLSTRestakingAddr);
        let res = BigNumber(await eigenLSTRestaking.getRestakingValue({ from: deployer }));
        console.log("getRestakingValue is : ", res.toString(10));
        let res1 = BigNumber(await eigenLSTRestaking.getUnstakingValue({ from: deployer }));
        console.log("getUnstakingValue is : ", res1.toString(10));
        let res2 = BigNumber(await eigenLSTRestaking.checkPendingAssets({ from: deployer }));
        let claimableValue = BigNumber(await res2.claimableValue());
        let pendingValue = BigNumber(await res2.pendingValue());
        console.log("claimableValue is : ", claimableValue.toString(10));
        console.log("pendingValue is : ", pendingValue.toString(10));

        value = BigNumber(await eigenLSTRestaking.getInvestedValue.call({
            from: controllerAddr
        }));
        console.log("value is : ", value.toString());
        callback();
    } catch (e) {
        callback(e);
    }
}



