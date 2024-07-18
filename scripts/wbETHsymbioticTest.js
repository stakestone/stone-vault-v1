const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
const ethers = require('ethers');

const SymbioticDepositWBETHStrategy = artifacts.require("SymbioticDepositWBETHStrategy");
const IUnwrapTokenV1ETH = artifacts.require("IUnwrapTokenV1ETH");
const IERC20 = artifacts.require("IERC20");

const deployer = "0xc1364ad857462e1b60609d9e56b5e24c5c21a312";

// const config = require("./mainnet.json")

const wbETHAddr = "0xa2E3356610840701BDf5611a53974510Ae27E2e1";
const unwrapTokenV1ETHAddr = "0x79973d557CD9dd87eb61E250cc2572c990e20196";
const collateralAddr = "0x422f5accc812c396600010f224b320a743695f85";

module.exports = async function (callback) {
    try {
        await web3.eth.sendTransaction({
            from: "0x70b1256966b230eE7aB22F17796Bf8797f3288Fc",
            to: deployer,
            value: BigNumber(500).times(1e18).toString(10)
        });

        const symbioticDepositWBETHStrategy = await SymbioticDepositWBETHStrategy.new(
            deployer,
            wbETHAddr,
            unwrapTokenV1ETHAddr,
            collateralAddr,
            "SymbioticDepositWBETHStrategy"
        );
        console.log("symbioticDepositWBETHStrategy: ", symbioticDepositWBETHStrategy.address);

        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await depositToStrategy(symbioticDepositWBETHStrategy, 200);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await wrapToWBETH(symbioticDepositWBETHStrategy, 100);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await depositIntoSymbiotic(symbioticDepositWBETHStrategy, 50);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await depositIntoSymbiotic(symbioticDepositWBETHStrategy, 5);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await withdrawFromSymbiotic(symbioticDepositWBETHStrategy, 20);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await withdrawFromSymbiotic(symbioticDepositWBETHStrategy, 15);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        let id = await requestToEther(symbioticDepositWBETHStrategy, 10);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        id = await requestToEther(symbioticDepositWBETHStrategy, 20);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await finalizeWithdrawal();
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        await claimPendingAssets(symbioticDepositWBETHStrategy);
        await checkStrategy(symbioticDepositWBETHStrategy.address);

        callback();
    } catch (e) {
        callback(e);
    }

    async function claimPendingAssets(strategy) {
        console.log(`======== claim all pending assets ========`);

        const unwrapTokenV1ETH = await IUnwrapTokenV1ETH.at(unwrapTokenV1ETHAddr);
        const userWithdrawRequests = await unwrapTokenV1ETH.getUserWithdrawRequests(strategy.address);

        for (var i = 0; i < userWithdrawRequests.length; i++) {
            await strategy.claimPendingAssets(0);
        }
    }

    async function finalizeWithdrawal() {
        console.log(`======== finalizeWithdrawal ========`);

        const unwrapTokenV1ETH = await IUnwrapTokenV1ETH.at(unwrapTokenV1ETHAddr);

        const rechargeAddress = await unwrapTokenV1ETH.rechargeAddress();
        const operatorAddress = await unwrapTokenV1ETH.operatorAddress();

        let needRechargeEthAmount = await unwrapTokenV1ETH.getNeedRechargeEthAmount();
        console.log("needRechargeEthAmount: ", BigNumber(needRechargeEthAmount).div(1e18).toString(10));

        await web3.eth.sendTransaction({
            from: "0x70b1256966b230eE7aB22F17796Bf8797f3288Fc",
            to: rechargeAddress,
            value: BigNumber(needRechargeEthAmount).plus(1e18).toString(10)
        });

        const provider = ethers.getDefaultProvider("http://localhost:8545");
        await provider.send("hardhat_impersonateAccount", [rechargeAddress]);
        await provider.send("hardhat_impersonateAccount", [operatorAddress]);

        if (needRechargeEthAmount > 0) {
            const rechargeAddress_signer = await provider.getSigner(
                rechargeAddress
            );
            const fn_rechargeFromRechargeAddress = "rechargeFromRechargeAddress()";
            const selector_increaseLimit = Abi.encodeFunctionSignature(fn_rechargeFromRechargeAddress);
            await rechargeAddress_signer.sendTransaction({
                to: unwrapTokenV1ETHAddr,
                value: BigNumber(needRechargeEthAmount).toString(10),
                data: selector_increaseLimit
            });
            await sleep(5);
        }

        const startAllocatedEthIndex = await unwrapTokenV1ETH.startAllocatedEthIndex();
        const nextIndex = await unwrapTokenV1ETH.nextIndex();

        if (startAllocatedEthIndex.toNumber() < nextIndex.toNumber()) {
            console.log("--- allocate ---")
            const operatorAddress_signer = await provider.getSigner(
                operatorAddress
            );
            const fn_allocate = "allocate(uint256)";
            const selector_allocate = Abi.encodeFunctionSignature(fn_allocate);
            let encodedParams_allocate = Abi.encodeParameters(
                ["uint256"],
                [
                    nextIndex.toNumber() - startAllocatedEthIndex.toNumber()
                ]
            );
            const data_allocate = `${selector_allocate}${encodedParams_allocate.split("0x")[1]}`
            await operatorAddress_signer.sendTransaction({
                to: unwrapTokenV1ETHAddr,
                value: 0,
                data: data_allocate
            });
            await sleep(5);
        }

        const lockTime = await unwrapTokenV1ETH.lockTime();
        await provider.send("evm_increaseTime", [lockTime.toNumber()]);
        await sleep(5);
    }

    async function requestToEther(strategy, amount) {
        console.log(`======== request ${amount} wbETH To ether ========`)
        const txResult = (await strategy.requestToEther(
            BigNumber(amount).times(1e18).toString(10)
        )).receipt;
        // console.log("tx: ", tx);

        let log;
        let topic = "0x96d07fd2bc9180dce2d22cb77edc26050eeb85876cff9714d58346b2974a8665";
        for (var i = 0; i < txResult.rawLogs.length; i++) {
            if (txResult.rawLogs[i].topics[0] == topic) {
                log = txResult.rawLogs[i];
            }
        }

        const abi = {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "uint256",
                "name": "wbethAmount",
                "type": "uint256"
            }, {
                "indexed": false,
                "internalType": "uint256",
                "name": "ethAmount",
                "type": "uint256"
            }, {
                "indexed": false,
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }],
            "name": "RequestWithdraw",
            "type": "event"
        }

        let decodedEvent = Abi.decodeParameters(abi.inputs, log.data);
        return decodedEvent.index;
    }

    async function withdrawFromSymbiotic(strategy, amount) {
        console.log(`======== withdraw ${amount} wbETH To Symbiotic ========`)
        await strategy.withdrawFromSymbiotic(
            BigNumber(amount).times(1e18).toString(10)
        );
    }

    async function depositIntoSymbiotic(strategy, amount) {
        console.log(`======== deposit ${amount} wbETH To Symbiotic ========`)
        await strategy.depositIntoSymbiotic(
            BigNumber(amount).times(1e18).toString(10)
        );
    }

    async function wrapToWBETH(strategy, amount) {
        console.log(`======== wrap ${amount} ETH To WBETH ========`)
        await strategy.wrapToWBETH(
            BigNumber(amount).times(1e18).toString(10),
            ZERO_ADDRESS
        );
    }

    async function depositToStrategy(strategy, amount) {
        console.log(`======== Deposit ${amount} ETH ========`)
        await strategy.deposit({
            value: BigNumber(amount).times(1e18).toString(10),
            from: deployer
        });
    }

    async function checkStrategy(strategyAddr) {
        const strategy = await SymbioticDepositWBETHStrategy.at(strategyAddr);
        const wbETH = await IERC20.at(wbETHAddr);

        let ethBalance = await web3.eth.getBalance(strategyAddr);
        console.log("ethBalance: ", BigNumber(ethBalance).div(1e18).toString(10));

        let wbETHBalance = await wbETH.balanceOf(strategyAddr);
        console.log("wbETH Balance: ", BigNumber(wbETHBalance).div(1e18).toString(10));

        let getWBETHValue = await strategy.getWBETHValue.call();
        console.log("getWBETHValue: ", BigNumber(getWBETHValue).div(1e18).toString(10));

        let checkPendingAssets = await strategy.checkPendingAssets();
        console.log("totalClaimable: ", BigNumber(checkPendingAssets.totalClaimable).div(1e18).toString(10));
        console.log("totalPending: ", BigNumber(checkPendingAssets.totalPending).div(1e18).toString(10));

        let getAllValue = await strategy.getAllValue.call();
        console.log("getAllValue: ", BigNumber(getAllValue).div(1e18).toString(10));
    }

}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}