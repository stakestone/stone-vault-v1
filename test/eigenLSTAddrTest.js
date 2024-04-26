const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');

const Abi = web3.eth.abi;

const IStrategyManager = artifacts.require("IStrategyManager");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");
const IERC20 = artifacts.require("IERC20");

const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";
const stETHAddr = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";
const lidoWithdrawalQueueAddr = "0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50";
const strategyManagerAddr = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
const delegationManagerAddr = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
const eigenStrategyAddr = "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3";

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
        const strategyManager = await IStrategyManager.at(strategyManagerAddr);
        const delegationManager = await IDelegationManager.at(delegationManagerAddr);
        const eigenStrategy = await IEigenStrategy.at(eigenStrategyAddr);
        const stETH = await IERC20.at(stETHAddr);

        await stETH.approve(strategyManager.address, MAX_UINT256);

        // depositIntoStrategy - 0.1 stETH restaked
        await strategyManager.depositIntoStrategy(
            eigenStrategy.address,
            stETH.address,
            BigNumber(1e17).toString(10));

        // delegateTo - 0.1 stETH delegated, userUnderlying 0.1
        const operator = "0x09edAAd15aAbe7A6DC630303fBb76290eE7b8b1c";
        await delegationManager.delegateTo(
            operator,
            {
                signature: "0x",
                expiry: 0
            },
            "0x"
        );

        let userUnderlying = await eigenStrategy.userUnderlyingView(deployer);
        console.log("userUnderlying: ", BigNumber(userUnderlying).div(1e18).toString(10));

        let shares = await eigenStrategy.shares(deployer);
        console.log("shares: ", BigNumber(shares).div(1e18).toString(10));


        // queueWithdrawals
        const queueWithdrawalsTx = await delegationManager.queueWithdrawals(
            [
                {
                    strategies: [eigenStrategyAddr],
                    shares: [BigNumber(shares).toString(10)],
                    withdrawer: deployer
                }
            ]
        );
        let rawLogs = queueWithdrawalsTx.receipt.rawLogs;
        let topic = "0x9009ab153e8014fbfb02f2217f5cde7aa7f9ad734ae85ca3ee3f4ca2fdd499f9";
        let log;

        for (var i = 0; i < rawLogs.length; i++) {
            if (rawLogs[i].topics[0] == topic) {
                log = rawLogs[i];
            }
        }

        // console.log("withdraw log: ", log);

        let decodedEvent = Abi.decodeParameters(abi.inputs, log.data);
        console.log("Decoded event: ", decodedEvent);

        userUnderlying = await eigenStrategy.userUnderlyingView(deployer);
        console.log("userUnderlying: ", BigNumber(userUnderlying).div(1e18).toString(10));

        await sleep(200);
        await delegationManager.completeQueuedWithdrawal(
            {
                staker: decodedEvent.withdrawal.staker,
                delegatedTo: decodedEvent.withdrawal.delegatedTo,
                withdrawer: decodedEvent.withdrawal.withdrawer,
                nonce: decodedEvent.withdrawal.nonce,
                startBlock: decodedEvent.withdrawal.startBlock,
                strategies: decodedEvent.withdrawal.strategies,
                shares: decodedEvent.withdrawal.shares,
            },
            [stETHAddr],
            0,
            true
        );

        // await strategyManager.depositIntoStrategy(
        //     eigenStrategy.address,
        //     stETH.address,
        //     BigNumber(1e17).toString(10));

        // undelegate - unstake all & undelegate, userUnderlying 0
        const undelegateTx = await delegationManager.undelegate(deployer);
        // console.log("rawLogs: ", undelegateTx.receipt.rawLogs);
        rawLogs = undelegateTx.receipt.rawLogs;


        for (var i = 0; i < rawLogs.length; i++) {
            if (rawLogs[i].topics[0] == topic) {
                log = rawLogs[i];
            }
        }

        // console.log("withdraw log: ", log);

        decodedEvent = Abi.decodeParameters(abi.inputs, log.data);
        console.log("Decoded event: ", decodedEvent);

        userUnderlying = await eigenStrategy.userUnderlyingView(deployer);
        console.log("userUnderlying: ", BigNumber(userUnderlying).div(1e18).toString(10));

        await sleep(200);
        await delegationManager.completeQueuedWithdrawal(
            {
                staker: decodedEvent.withdrawal.staker,
                delegatedTo: decodedEvent.withdrawal.delegatedTo,
                withdrawer: decodedEvent.withdrawal.withdrawer,
                nonce: decodedEvent.withdrawal.nonce,
                startBlock: decodedEvent.withdrawal.startBlock,
                strategies: decodedEvent.withdrawal.strategies,
                shares: decodedEvent.withdrawal.shares,
            },
            [stETHAddr],
            0,
            true
        );

        userUnderlying = await eigenStrategy.userUnderlyingView(deployer);
        console.log("userUnderlying: ", BigNumber(userUnderlying).div(1e18).toString(10));

        callback();
    } catch (e) {
        callback(e);
    }
}

function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}