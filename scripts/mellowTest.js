const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;
const ethers = require('ethers');

const MellowDepositWstETHStrategy = artifacts.require("MellowDepositWstETHStrategy");
const IERC20 = artifacts.require("IERC20");
const StoneVault = artifacts.require("StoneVault");
const ILidoWithdrawalQueue = artifacts.require("ILidoWithdrawalQueue");
const IMellowVault = artifacts.require("IMellowVault");

const deployer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const config = require("./mainnet.json")

const wstETHAddr = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const mellowVaultAddr = "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a";
const operator = "0x4a3c7F2470Aa00ebE6aE7cB1fAF95964b9de1eF4";
const stoneVaultAddr = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
// expect the normal work flow run successfully.
module.exports = async function (callback) {
    try {

        await web3.eth.sendTransaction({
            from: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            to: operator,
            value: BigNumber(100).times(1e18).toString(10)
        });

        const mellowDepositWstETHStrategy = await MellowDepositWstETHStrategy.new(
            deployer,
            wstETHAddr,
            lidoWithdrawalQueueAddr,
            mellowVaultAddr,
            "MellowDepositWstETHStrategy"
        );
        console.log("mellowDepositWstETHStrategy: ", mellowDepositWstETHStrategy.address);

        await checkStrategy(mellowDepositWstETHStrategy.address);

        await depositToStrategy(mellowDepositWstETHStrategy, 200);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await wrapToWstETH(mellowDepositWstETHStrategy, 100);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await depositIntoMellow(mellowDepositWstETHStrategy, 50);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await depositIntoMellow(mellowDepositWstETHStrategy, 5);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await requestWithdrawFromMellow(mellowDepositWstETHStrategy, 40);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await processWithdrawals(mellowDepositWstETHStrategy.address);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await unwrapToStETH(mellowDepositWstETHStrategy, 30);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await requestToEther(mellowDepositWstETHStrategy, 30);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await requestWithdrawFromMellow(mellowDepositWstETHStrategy, 10);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        await cancelWithdrawFromMellow(mellowDepositWstETHStrategy);
        await checkStrategy(mellowDepositWstETHStrategy.address);

        callback();
    } catch (e) {
        callback(e);
    }

    async function cancelWithdrawFromMellow(strategy) {
        console.log(`======== cancelWithdrawFromMellow ========`)
        await strategy.cancelWithdrawFromMellow();
    }

    async function requestToEther(strategy, amount) {
        console.log(`======== request ${amount} stETH To ether ========`)
        await strategy.requestToEther(
            BigNumber(amount).times(1e18).toString(10)
        );
    }

    async function unwrapToStETH(strategy, amount) {
        console.log(`======== unwrap ${amount} wstETH To stETH ========`)
        await strategy.unwrapToStETH(
            BigNumber(amount).times(1e18).toString(10)
        );
    }

    async function processWithdrawals(strategy) {
        console.log(`======== processWithdrawals ========`)

        const provider = ethers.getDefaultProvider("http://localhost:8545");
        await provider.send("hardhat_impersonateAccount", [operator]);

        const signer = await provider.getSigner(
            operator
        );
        const fn_processWithdrawals = "processAll()";
        const selector_processWithdrawals = Abi.encodeFunctionSignature(fn_processWithdrawals);

        await signer.sendTransaction({
            to: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
            data: selector_processWithdrawals
        });
        await sleep(5);
    }

    async function requestWithdrawFromMellow(strategy, amount) {
        console.log(`======== withdraw ${amount} shares From Mellow ========`)

        await strategy.requestWithdrawFromMellow(
            BigNumber(amount).times(1e18).toString(10),
            BigNumber(amount).times(1e18).toString(10)
        );
    }

    async function depositIntoMellow(strategy, amount) {
        console.log(`======== deposit ${amount} wstETH To Mellow ========`)
        const lpRate = BigNumber(await strategy.getLpRate());
        console.log("lprate is : ", lpRate.toString(10));
        const minLpReceived = BigNumber(amount).times(1e18).div(lpRate).times(1e18).toFixed(0).toString(10);

        await strategy.depositIntoMellow(
            BigNumber(amount).times(1e18).toString(10),
            minLpReceived
        );
    }

    async function wrapToWstETH(strategy, amount) {
        console.log(`======== wrap ${amount} ETH To WBETH ========`)
        await strategy.mintToWstETH(
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
        const strategy = await MellowDepositWstETHStrategy.at(strategyAddr);
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const stETH = await IERC20.at(stETHAddr);
        const wstETH = await IERC20.at(wstETHAddr);
        const lidoWithdrawalQueue = await ILidoWithdrawalQueue.at(lidoWithdrawalQueueAddr);

        let ethBalance = await web3.eth.getBalance(strategyAddr);
        console.log("ethBalance: ", BigNumber(ethBalance).div(1e18).toString(10));

        let stETHBalance = await stETH.balanceOf(strategyAddr);
        console.log("stETH Balance: ", BigNumber(stETHBalance).div(1e18).toString(10));

        let wstETHBalance = await wstETH.balanceOf(strategyAddr);
        console.log("wstETH Balance: ", BigNumber(wstETHBalance).div(1e18).toString(10));

        let depositedValue = await strategy.getDepositedValue();
        console.log("depositedValue: ", BigNumber(depositedValue).div(1e18).toString(10));

        let pendingValueFromMellow = await strategy.getPendingValueFromMellow();
        console.log("pendingValueFromMellow: ", BigNumber(pendingValueFromMellow).div(1e18).toString(10));

        let allids = await lidoWithdrawalQueue.getWithdrawalRequests(strategyAddr);
        allids = allids.map((id) => {
            return id.toNumber();
        })
        console.log("total pending num: ", allids.length);
        console.log("all ids: ", allids);

        let checkPendingAssets = await strategy.checkPendingAssets.call();
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