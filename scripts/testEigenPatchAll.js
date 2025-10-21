const BigNumber = require('bignumber.js');
const ethers = require('ethers');

const Abi = web3.eth.abi;

const IERC20 = artifacts.require("IERC20");

const EigenLSTRestaking = artifacts.require("EigenLSTRestaking");
const EigenLSTRestakingPatch = artifacts.require("EigenLSTRestakingPatch");
const Strategy = artifacts.require("Strategy");
const StrategyController = artifacts.require("StrategyController");
const StoneVault = artifacts.require("StoneVault");
const Proposal = artifacts.require("Proposal");
const Stone = artifacts.require("Stone");

const eigenLSTRestakingAddr = "0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982";
const strategyControllerAddr = "0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2";

const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

const delegationManagerAddr = "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A";
const eigenStrategyAddr = "0x93c4b944D05dfe6df7645A86cd2206016c51564D";

const config = require("./mainnet.json");
const { MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');

const whale1 = "0x34669322bdfCa9e801CA334e7B0E6D69d1F87137";
const whale2 = "0x47d7f7Fa8288b9367Eb5fA4E50fD1017E99608B1";
const whale3 = "0xE588aF7B7187913E0cDdf364AC72acB8506dBA63";

const user1 = "0xc2f369965d772CfAbDaC13AcF396DEEa4A864CB3";
const user2 = "0x4e4a90782C2f96F2365E5F2768ccDb6e201429D5";
const user3 = "0x3021674985d3C9cA922253094082Af68DfEE26A6";

const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312"

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
    try {
        const eigenLSTRestaking = await EigenLSTRestaking.at(eigenLSTRestakingAddr);
        const stETH = await IERC20.at(stETHAddr);
        const proposal = await Proposal.at(config.proposalAddr);
        const stone = await Stone.at(config.stoneAddr);
        const stoneVault = await StoneVault.at(config.stoneVaultAddr);
        const strategyController = await StrategyController.at(config.strategyControllerAddr);

        const provider = ethers.getDefaultProvider("http://localhost:7777");

        let currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[Initial STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("[Patch 合约部署中...] ");
        const eigenLSTRestakingPatch = await EigenLSTRestakingPatch.new(
            strategyControllerAddr,
            "EigenLayer LST Restaking Patch",
            delegationManagerAddr,
            eigenStrategyAddr,
            eigenLSTRestakingAddr
        );
        console.log("EigenLSTRestakingPatch: ", eigenLSTRestakingPatch.address);
        console.log("1. 部署 Patch 策略 [√]")

        console.log("[当前策略情况:] ");
        let getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            console.log(`${getStrategies.addrs[i]}: ${getStrategies.portions[i]}`)
        }
        const proposer = "0x83000EF01eD5C15462ef20066091Abd3654e523f";
        console.log("[proposer:] ", proposer);

        console.log("[提案中...] ");

        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams2 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[
                '0x87D004f22BDD5F9c85AD6D3F74F1fB6e7A256982',
                '0x2D70868f12A05b8C347974415baC5de053DAa376',
                "0x58907ad5c7eD1EaB5FdCc0Cc347F25bF5BC0e7da",
                eigenLSTRestakingPatch.address
            ],
            [
                1000000,
                0,
                0,
                0
            ]
            ]
        );
        const data2 = `${selector2}${encodedParams2.split("0x")[1]}`

        const fn3 = "propose(bytes)";
        const selector3 = Abi.encodeFunctionSignature(fn3);
        const encodedParams3 = Abi.encodeParameters(
            ["bytes"],
            [
                data2
            ]
        );
        const proposeData = `${selector3}${encodedParams3.split("0x")[1]}`
        // console.log("[提案数据: ]", proposeData);

        const signer = await provider.getSigner(
            proposer
        );
        await signer.sendTransaction({
            to: proposal.address,
            value: 0,
            data: proposeData
        });

        await sleep(12);

        let proposals = await proposal.getProposals();
        let latestProposal = proposals[proposals.length - 1];
        console.log("[最新提案: ]", latestProposal);

        console.log("2. 提案 Proposal [√]");

        await proposal.voteFor(latestProposal, 1, true);
        console.log("3. Vote for proposal... [√]");

        await provider.send("evm_increaseTime", [86401]);
        console.log("4. 86400 seconds later... [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[执行提案前 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await proposal.execProposal(latestProposal);
        console.log("5. 执行提案 [√]");

        console.log("[执行提案后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        console.log("6. 验证提案结果 [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[执行提案后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.rollToNextRound();
        console.log("7. 提案后结算 [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[结算后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("[结算后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        await stoneVault.destroyStrategy("0x2D70868f12A05b8C347974415baC5de053DAa376");
        await stoneVault.destroyStrategy("0x58907ad5c7eD1EaB5FdCc0Cc347F25bF5BC0e7da");

        console.log("8. Destroy 策略 [√]");

        console.log("[Destroy 后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }
        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[Destroy 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.setRebaseInterval(1);
        await stoneVault.rollToNextRound();
        console.log("9. 提案后结算 [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[结算后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await instantWithdraw(provider, whale1, 3500);

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[Instant Withdraw 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("10. Whale Instant Withdraw 3500 STONE [√]");

        await approve(provider, whale2, stone.address, stoneVault.address, 100000);
        await requestWithdraw(provider, whale2, 2850);

        console.log("11. Whale Request Withdraw 2850 STONE [√]");

        await stoneVault.rollToNextRound();
        console.log("12. Request Withdraw 后结算 [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[Request Withdraw 结算后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("[Unrestaking 前策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        console.log("[Unrestake 前 EigenLSTRestaking State ]");
        getRestakingValue = await eigenLSTRestaking.getRestakingValue();
        console.log("getRestakingValue: ", BigNumber(getRestakingValue).div(1e18).toString(10));
        getUnstakingValue = await eigenLSTRestaking.getUnstakingValue();
        console.log("getUnstakingValue: ", BigNumber(getUnstakingValue).div(1e18).toString(10));
        getAllValue = await eigenLSTRestaking.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        let queueData = web3.eth.abi.encodeFunctionCall(queueAbi, [
            [
                {
                    "strategies": [eigenStrategyAddr],
                    "depositShares": [BigNumber(10000).times(1e18).toString(10)],
                    "__deprecated_withdrawer": eigenLSTRestakingAddr
                },
            ]
        ]);
        let queueTx = await eigenLSTRestaking.invoke(delegationManagerAddr, queueData);

        console.log("13. Unrestake [√]");

        console.log("[Unrestake 后 EigenLSTRestaking State ]");
        getRestakingValue = await eigenLSTRestaking.getRestakingValue();
        console.log("getRestakingValue: ", BigNumber(getRestakingValue).div(1e18).toString(10));
        getUnstakingValue = await eigenLSTRestaking.getUnstakingValue();
        console.log("getUnstakingValue: ", BigNumber(getUnstakingValue).div(1e18).toString(10));
        getAllValue = await eigenLSTRestaking.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        console.log("[Unrestaking 后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[Unrestaking 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        /* await stoneVault.rollToNextRound(); */
        console.log("14. Unrestake 后结算失败 [x]");

        await depositFor(provider, whale1, deployer, 3600);
        await stoneVault.instantWithdraw(0, BigNumber(3000).times(1e18).toString(10));

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[用户 Instant Withdraw 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("15. 用户 Instant Withdraw (Buffer 取款) [√]");

        await approve(provider, whale3, stone.address, stoneVault.address, 100000);
        await requestWithdraw(provider, whale3, 1000);

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[用户 Request Withdraw 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("16. 用户 Request Withdraw [√]");

        /* await stoneVault.rollToNextRound(); */
        console.log("17. 结算失败 [x]");

        for (var i = 0; i < 100; i++) {
            await provider.send("anvil_mine", [1008]);
        }

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

        await eigenLSTRestaking.invoke(delegationManagerAddr, completeData);

        console.log("[CompleteWithdraw 后 EigenLSTRestaking State ]");
        getRestakingValue = await eigenLSTRestaking.getRestakingValue();
        console.log("getRestakingValue: ", BigNumber(getRestakingValue).div(1e18).toString(10));
        getUnstakingValue = await eigenLSTRestaking.getUnstakingValue();
        console.log("getUnstakingValue: ", BigNumber(getUnstakingValue).div(1e18).toString(10));
        getAllValue = await eigenLSTRestaking.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));

        console.log("[CompleteWithdraw 后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[CompleteWithdraw 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        console.log("18. EigenLayer completeWithdraw [√]");

        await stoneVault.rollToNextRound();

        console.log("19. completeWithdraw 后结算 [√]");

        console.log("[CompleteWithdraw 结算后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[CompleteWithdraw 结算后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.instantWithdraw(0, BigNumber(200).times(1e18).toString(10));

        console.log("20. 用户 Instant Withdraw [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[CompleteWithdraw 结算后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.requestWithdraw(BigNumber(100).times(1e18).toString(10));

        console.log("21. 用户 Request Withdraw [√]");

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[用户 Request Withdraw 后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.rollToNextRound();

        console.log("22. 用户 Request Withdraw 后结算 [√]");

        console.log("[用户 Request Withdraw 结算后策略情况:] ");
        getStrategies = await strategyController.getStrategies();

        for (var i = 0; i < getStrategies.addrs.length; i++) {
            const strategy = await Strategy.at(getStrategies.addrs[i]);
            const value = await strategy.getAllValue.call();
            console.log(`${getStrategies.addrs[i]}: Portion: ${getStrategies.portions[i]} Value: ${BigNumber(value).div(1e18).toString(10)}`);
        }

        currentSharePrice = await stoneVault.currentSharePrice.call();
        console.log("[用户 Request Withdraw 结算后 STONE Price: ]", BigNumber(currentSharePrice).div(1e18).toString(10));


        callback();
    } catch (e) {
        callback(e);
    }
}

async function instantWithdraw(provider, user, share) {
    const fn = "instantWithdraw(uint256,uint256)";
    const selector = Abi.encodeFunctionSignature(fn);
    const encodedParams = Abi.encodeParameters(
        ["uint256", "uint256"],
        [
            0, BigNumber(share).times(1e18).toString(10)
        ]
    );
    const data = `${selector}${encodedParams.split("0x")[1]}`

    const signer = await provider.getSigner(
        user
    );
    await signer.sendTransaction({
        to: config.stoneVaultAddr,
        value: 0,
        data: data
    });

    await sleep(12);

}

async function requestWithdraw(provider, user, share) {
    const fn = "requestWithdraw(uint256)";
    const selector = Abi.encodeFunctionSignature(fn);
    const encodedParams = Abi.encodeParameters(
        ["uint256"],
        [
            BigNumber(share).times(1e18).toString(10)
        ]
    );
    const data = `${selector}${encodedParams.split("0x")[1]}`

    const signer = await provider.getSigner(
        user
    );
    await signer.sendTransaction({
        to: config.stoneVaultAddr,
        value: 0,
        data: data
    });

    await sleep(12);
}

async function depositFor(provider, user, to, ether) {
    const fn = "depositFor(address)";
    const selector = Abi.encodeFunctionSignature(fn);
    const encodedParams = Abi.encodeParameters(
        ["address"],
        [
            to
        ]
    );
    const data = `${selector}${encodedParams.split("0x")[1]}`

    const signer = await provider.getSigner(
        user
    );
    await signer.sendTransaction({
        to: config.stoneVaultAddr,
        value: BigNumber(ether).times(1e18).toString(10),
        data: data
    });

    await sleep(12);
}

async function approve(provider, user, token, spender, amount) {
    const fn = "approve(address,uint256)";
    const selector = Abi.encodeFunctionSignature(fn);
    const encodedParams = Abi.encodeParameters(
        ["address", "uint256"],
        [
            spender, BigNumber(amount).times(1e18).toString(10)
        ]
    );
    const data = `${selector}${encodedParams.split("0x")[1]}`

    const signer = await provider.getSigner(
        user
    );
    await signer.sendTransaction({
        to: token,
        value: 0,
        data: data
    });

    await sleep(12);
}

function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}