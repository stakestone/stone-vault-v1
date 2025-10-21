const BigNumber = require('bignumber.js');
const ethers = require('ethers');

const Abi = web3.eth.abi;

const IERC20 = artifacts.require("IERC20");

const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
const eigenLSTRestakingAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";

const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddr = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";

const eventAbi = {
    "anonymous": false,
    "inputs": [{
        "indexed": false,
        "internalType": "bytes32",
        "name": "withdrawalRoot",
        "type": "bytes32"
    }, {
        "components": [{
            "internalType": "address",
            "name": "staker",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "delegatedTo",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "withdrawer",
            "type": "address"
        }, {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
        }, {
            "internalType": "uint32",
            "name": "startBlock",
            "type": "uint32"
        }, {
            "internalType": "contract IStrategy[]",
            "name": "strategies",
            "type": "address[]"
        }, {
            "internalType": "uint256[]",
            "name": "scaledShares",
            "type": "uint256[]"
        }],
        "indexed": false,
        "internalType": "struct IDelegationManagerTypes.Withdrawal",
        "name": "withdrawal",
        "type": "tuple"
    }, {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "sharesToWithdraw",
        "type": "uint256[]"
    }],
    "name": "SlashingWithdrawalQueued",
    "type": "event"
};

const queueAbi = {
    "inputs": [{
        "components": [{
            "internalType": "contract IStrategy[]",
            "name": "strategies",
            "type": "address[]"
        }, {
            "internalType": "uint256[]",
            "name": "depositShares",
            "type": "uint256[]"
        }, {
            "internalType": "address",
            "name": "__deprecated_withdrawer",
            "type": "address"
        }],
        "internalType": "struct IDelegationManagerTypes.QueuedWithdrawalParams[]",
        "name": "params",
        "type": "tuple[]"
    }],
    "name": "queueWithdrawals",
    "outputs": [{
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
    }],
    "stateMutability": "nonpayable",
    "type": "function"
};

const completeAbi = {
    "inputs": [{
        "components": [{
            "internalType": "address",
            "name": "staker",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "delegatedTo",
            "type": "address"
        }, {
            "internalType": "address",
            "name": "withdrawer",
            "type": "address"
        }, {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
        }, {
            "internalType": "uint32",
            "name": "startBlock",
            "type": "uint32"
        }, {
            "internalType": "contract IStrategy[]",
            "name": "strategies",
            "type": "address[]"
        }, {
            "internalType": "uint256[]",
            "name": "scaledShares",
            "type": "uint256[]"
        }],
        "internalType": "struct IDelegationManagerTypes.Withdrawal",
        "name": "withdrawal",
        "type": "tuple"
    }, {
        "internalType": "contract IERC20[]",
        "name": "tokens",
        "type": "address[]"
    }, {
        "internalType": "bool",
        "name": "receiveAsTokens",
        "type": "bool"
    }],
    "name": "completeQueuedWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
};

const errorsAbi = [{
    "inputs": [],
    "name": "ActivelyDelegated",
    "type": "error"
}, {
    "inputs": [],
    "name": "CallerCannotUndelegate",
    "type": "error"
}, {
    "inputs": [],
    "name": "CurrentlyPaused",
    "type": "error"
}, {
    "inputs": [],
    "name": "FullySlashed",
    "type": "error"
}, {
    "inputs": [],
    "name": "InputAddressZero",
    "type": "error"
}, {
    "inputs": [],
    "name": "InputArrayLengthMismatch",
    "type": "error"
}, {
    "inputs": [],
    "name": "InputArrayLengthZero",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidNewPausedStatus",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidPermissions",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
}, {
    "inputs": [],
    "name": "InvalidSnapshotOrdering",
    "type": "error"
}, {
    "inputs": [],
    "name": "NotActivelyDelegated",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyAllocationManager",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyEigenPodManager",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyPauser",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyStrategyManagerOrEigenPodManager",
    "type": "error"
}, {
    "inputs": [],
    "name": "OnlyUnpauser",
    "type": "error"
}, {
    "inputs": [],
    "name": "OperatorNotRegistered",
    "type": "error"
}, {
    "inputs": [],
    "name": "OperatorsCannotUndelegate",
    "type": "error"
}, {
    "inputs": [],
    "name": "SaltSpent",
    "type": "error"
}, {
    "inputs": [],
    "name": "SignatureExpired",
    "type": "error"
}, {
    "inputs": [{
        "internalType": "string",
        "name": "str",
        "type": "string"
    }],
    "name": "StringTooLong",
    "type": "error"
}, {
    "inputs": [],
    "name": "WithdrawalDelayNotElapsed",
    "type": "error"
}, {
    "inputs": [],
    "name": "WithdrawalNotQueued",
    "type": "error"
}, {
    "inputs": [],
    "name": "WithdrawerNotCaller",
    "type": "error"
}];

module.exports = async function (callback) {
    const safeExit = (error) => {
        if (typeof callback === 'function') {
            callback(error);
        } else {
            if (error) console.error(error);
            process.exit(error ? 1 : 0);
        }
    };
    try {
        // 在脚本中添加这个函数来分解getInvestedValue
        async function printInvestedValueComponents(contract) {
            // 1. 获取ETH余额
            const etherValue = await web3.eth.getBalance(contract.address);

            // 2. 获取stETH余额
            const stETH = await IERC20.at(stETHAddr);
            const tokenValue = await stETH.balanceOf(contract.address);

            // 3. 获取可提取和待处理的资产
            const pendingAssets = await contract.checkPendingAssets.call();
            const claimableValue = pendingAssets[1];
            const pendingValue = pendingAssets[2];

            // 4. 获取EigenLayer质押价值
            const eigenValue = await contract.getRestakingValue.call();

            // 5. 获取解质押中的价值
            const unstakingValue = await contract.getUnstakingValue.call();

            // 打印所有组成部分
            console.log("======== getInvestedValue 组成部分 =========");
            console.log("1. etherValue (ETH余额):", BigNumber(etherValue).div(1e18).toString(10));
            console.log("2. tokenValue (stETH余额):", BigNumber(tokenValue).div(1e18).toString(10));
            console.log("3. claimableValue (可提取stETH):", BigNumber(claimableValue).div(1e18).toString(10));
            console.log("4. pendingValue (待处理stETH):", BigNumber(pendingValue).div(1e18).toString(10));
            console.log("5. eigenValue (Eigen质押价值):", BigNumber(eigenValue).div(1e18).toString(10));
            console.log("6. unstakingValue (解质押中价值):", BigNumber(unstakingValue).div(1e18).toString(10));

            // 计算总和
            const total = BigNumber(etherValue)
                .plus(tokenValue)
                .plus(claimableValue)
                .plus(pendingValue)
                .plus(eigenValue)
                .plus(unstakingValue)
                .div(1e18);

            console.log("各部分总和:", total.toString(10));

            // 对比getAllValue的结果
            const getAllValue = await contract.getAllValue.call();
            console.log("getAllValue返回值:", BigNumber(getAllValue).div(1e18).toString(10));
        }

        // for (var i = 0; i < errorsAbi.length; i++) {
        //     const errorcode = web3.eth.abi.encodeFunctionSignature(errorsAbi[i]);

        //     if (errorcode == "0xf1ecf5c2") {
        //         console.log(errorsAbi[i]);
        //     }

        // }
        const provider = ethers.getDefaultProvider("http://localhost:7777");

        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [deployer],
            id: 1,
        });
        const eigenLSTRestaking = await EigenLSTRestaking.at(eigenLSTRestakingAddr);
        const stETH = await IERC20.at(stETHAddr);

        const eigenLSTRestakingPatch = await EigenLSTRestakingPatch.new(
            strategyControllerAddr,
            "EigenLayer LST Restaking Patch",
            delegationManagerAddr,
            eigenStrategyAddr,
            eigenLSTRestakingAddr,
            { from: deployer }
        );
        console.log("EigenLSTRestakingPatch: ", eigenLSTRestakingPatch.address);
        console.log("======== EigenLSTRestaking Initial State =========");
        let getRestakingValue = await eigenLSTRestaking.getRestakingValue();
        console.log("getRestakingValue: ", BigNumber(getRestakingValue).div(1e18).toString(10));
        let getUnstakingValue = await eigenLSTRestaking.getUnstakingValue();
        console.log("getUnstakingValue: ", BigNumber(getUnstakingValue).div(1e18).toString(10));
        let getAllValue = await eigenLSTRestaking.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));
        let stETHBalance = await stETH.balanceOf(eigenLSTRestakingAddr);
        console.log("stETH Balance: ", BigNumber(stETHBalance).div(1e18).toString(10));
        console.log("======== printInvestedValueComponents Initial State =========");
        await printInvestedValueComponents(eigenLSTRestaking);

        console.log("======== Patch Initial State =========");
        getAllValue = await eigenLSTRestakingPatch.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        console.log("-------- queueWithdrawals --------");
        const queueData = web3.eth.abi.encodeFunctionCall(queueAbi, [
            [
                {
                    "strategies": [eigenStrategyAddr],
                    "depositShares": [BigNumber(14500).times(1e18).toString(10)],
                    "__deprecated_withdrawer": eigenLSTRestakingAddr
                }
            ]
        ]);
        const queueTx = await eigenLSTRestaking.invoke(delegationManagerAddr, queueData,
            { from: deployer, gas: 500000 }
        );

        console.log("======== EigenLSTRestaking State =========");
        getRestakingValue = await eigenLSTRestaking.getRestakingValue();
        console.log("getRestakingValue: ", BigNumber(getRestakingValue).div(1e18).toString(10));
        getUnstakingValue = await eigenLSTRestaking.getUnstakingValue();
        console.log("getUnstakingValue: ", BigNumber(getUnstakingValue).div(1e18).toString(10));
        getAllValue = await eigenLSTRestaking.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));
        stETHBalance = await stETH.balanceOf(eigenLSTRestakingAddr);
        console.log("stETH Balance: ", BigNumber(stETHBalance).div(1e18).toString(10));
        console.log("======== printInvestedValueComponents State =========");
        await printInvestedValueComponents(eigenLSTRestaking);

        console.log("======== Patch State =========");
        getAllValue = await eigenLSTRestakingPatch.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        for (var i = 0; i < 100; i++) {
            await provider.send("anvil_mine", [1008]);
        }
        // 3. 检查当前区块和时间戳
        const currentBlock = await web3.eth.getBlockNumber();
        const currentTimestamp = (await web3.eth.getBlock(currentBlock)).timestamp;
        console.log("Current block:", currentBlock);
        console.log("Current timestamp:", currentTimestamp);

        console.log("-------- completeQueuedWithdrawal --------");

        const withdrawTxHash = queueTx.tx;
        const txResult = await web3.eth.getTransactionReceipt(withdrawTxHash);
        let topic = "0x26b2aae26516e8719ef50ea2f6831a2efbd4e37dccdf0f6936b27bc08e793e30";

        let log;
        for (var i = 0; i < txResult.logs.length; i++) {
            if (txResult.logs[i].topics[0] == topic) {
                log = txResult.logs[i];
            }
        }

        let decodedEvent = Abi.decodeParameters(eventAbi.inputs, log.data);
        // console.log("Decoded event: ", decodedEvent);

        let completeData = web3.eth.abi.encodeFunctionCall(completeAbi, [
            {
                staker: decodedEvent.withdrawal.staker,
                delegatedTo: decodedEvent.withdrawal.delegatedTo,
                withdrawer: decodedEvent.withdrawal.withdrawer,
                nonce: decodedEvent.withdrawal.nonce,
                startBlock: decodedEvent.withdrawal.startBlock,
                strategies: decodedEvent.withdrawal.strategies,
                scaledShares: decodedEvent.withdrawal.scaledShares,
            },
            [stETHAddr],
            true,
        ]);
        // console.log("completeData: ", completeData);

        await eigenLSTRestaking.invoke(delegationManagerAddr, completeData,
            { from: deployer }
        );

        console.log("======== EigenLSTRestaking State =========");
        getRestakingValue = await eigenLSTRestaking.getRestakingValue();
        console.log("getRestakingValue: ", BigNumber(getRestakingValue).div(1e18).toString(10));
        getUnstakingValue = await eigenLSTRestaking.getUnstakingValue();
        console.log("getUnstakingValue: ", BigNumber(getUnstakingValue).div(1e18).toString(10));
        getAllValue = await eigenLSTRestaking.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));
        stETHBalance = await stETH.balanceOf(eigenLSTRestakingAddr);
        console.log("stETH Balance: ", BigNumber(stETHBalance).div(1e18).toString(10));
        console.log("======== printInvestedValueComponents Initial State =========");
        await printInvestedValueComponents(eigenLSTRestaking);

        console.log("======== Patch State =========");
        getAllValue = await eigenLSTRestakingPatch.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        safeExit();
    } catch (e) {
        console.error("Execution failed:", {
            message: e.message,
            stack: e.stack,
            receipt: e.receipt
        });
        safeExit(e);
    }
}
