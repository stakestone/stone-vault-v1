const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');

const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");

const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";

module.exports = async function (callback) {
    try {
        const minterAddr = await getFutureAddr(1);
        console.log("minterAddr: ", minterAddr);

        const stone = await Stone.new(minterAddr);
        console.log("stone: ", stone.address);

        const stoneVaultAddr = await getFutureAddr(1);
        console.log("stoneVaultAddr: ", stoneVaultAddr);

        const minter = await Minter.new(stone.address, [stoneVaultAddr]);
        console.log("minter: ", minter.address);

        const assetsVaultAddr = await getFutureAddr(2);
        console.log("assetsVaultAddr: ", assetsVaultAddr);

        const mockNullStrategyAAddr = await getFutureAddr(3);
        const mockNullStrategyBAddr = await getFutureAddr(4);
        console.log("mockNullStrategyAAddr: ", mockNullStrategyAAddr);
        console.log("mockNullStrategyBAddr: ", mockNullStrategyBAddr);

        const proposalAddr = await getFutureAddr(1);
        console.log("proposalAddr: ", proposalAddr);

        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);

        const proposal = await Proposal.new(stoneVault.address);
        console.log("proposal: ", proposal.address);

        const strategyControllerAddr = await stoneVault.strategyController();
        console.log("strategyController: ", strategyControllerAddr);

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);

        await stoneVault.deposit({
            value: BigNumber(1e16).toString(10),
        });
        await stone.approve(stoneVault.address, MAX_UINT256);
        await stoneVault.requestWithdraw(BigNumber(2e15).toString(10));
        await stoneVault.cancelWithdraw(BigNumber(1e15).toString(10))

        let currentSharePrice = await stoneVault.currentSharePrice();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));


        await stoneVault.instantWithdraw(0, BigNumber(5e15).toString(10));
        currentSharePrice = await stoneVault.currentSharePrice();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.rollToNextRound();
        currentSharePrice = await stoneVault.currentSharePrice();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.rollToNextRound();
        currentSharePrice = await stoneVault.currentSharePrice();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));

        await stoneVault.rollToNextRound();
        currentSharePrice = await stoneVault.currentSharePrice();
        console.log("currentSharePrice: ", BigNumber(currentSharePrice).div(1e18).toString(10));

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
}