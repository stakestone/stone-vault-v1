const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;

const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const ILidoWithdrawalQueue = artifacts.require("ILidoWithdrawalQueue");
const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");

const MockToken = artifacts.require("MockToken");
const MiningPool = artifacts.require("MiningPool");
const StoneAdapter = artifacts.require("StoneAdapter");
const StoneNFT = artifacts.require("StoneNFT");

module.exports = async function (callback) {
    const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
    const user1 = "0x613670cC9D11e8cB6ea297bE7Cac08187400C936";
    const user2 = "0xcd3B766CCDd6AE721141F452C550Ca635964ce71";

    try {
        // await web3.eth.sendTransaction({
        //     from: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        //     to: deployer,
        //     value: BigNumber(1e20).toString(10)
        // });

        const miningPool = await MiningPool.new(60);
        console.log("MiningPool: ", miningPool.address);

        const stoneAdapter = await StoneAdapter.new();
        console.log("StoneAdapter: ", stoneAdapter.address);

        const stoneNFT = await StoneNFT.new(miningPool.address);
        console.log("StoneNFT: ", stoneNFT.address);

        const token = await MockToken.new("Mock Token", "Mock Token");
        console.log("token: ", token.address);

        await miningPool.setSupportedTokens(
            [token.address],
            [stoneAdapter.address],
            [true]
        );

        await miningPool.setNFT(stoneNFT.address);

        await token.mint(deployer, BigNumber(1000).times(1e18).toString(10));
        await token.mint(user1, BigNumber(1000).times(1e18).toString(10));
        await token.mint(user2, BigNumber(1000).times(1e18).toString(10));

        await miningPool.setSupportedTokens(
            [token.address],
            [stoneAdapter.address],
            [true]
        );

        await token.approve(miningPool.address, MAX_UINT256, {
            from: deployer
        });
        await token.approve(miningPool.address, MAX_UINT256, {
            from: user1
        });
        await token.approve(miningPool.address, MAX_UINT256, {
            from: user2
        });

        await miningPool.stake(token.address, BigNumber(1e18).toString(10), {
            from: deployer
        });
        await sleep(60);

        await miningPool.stake(token.address, BigNumber(2e18).toString(10), {
            from: user1
        });
        await sleep(60);

        await miningPool.stake(token.address, BigNumber(3e18).toString(10), {
            from: user2
        });
        await sleep(60);

        await miningPool.stake(token.address, BigNumber(1e18).toString(10), {
            from: deployer
        });
        await sleep(60);

        await miningPool.stake(token.address, BigNumber(2e18).toString(10), {
            from: user1
        });
        await sleep(60);

        await miningPool.stake(token.address, BigNumber(3e18).toString(10), {
            from: user2
        });
        await sleep(120);

        await miningPool.unstake(token.address, BigNumber(1e18).toString(10), {
            from: deployer
        });
        await sleep(60);

        await miningPool.unstake(token.address, BigNumber(2e18).toString(10), {
            from: user1
        });
        await sleep(60);

        await miningPool.unstake(token.address, BigNumber(3e18).toString(10), {
            from: user2
        });
        await sleep(120);

        // unstake all
        await miningPool.unstake(token.address, BigNumber(1e18).toString(10), {
            from: deployer
        });
        await sleep(60);
        await miningPool.unstake(token.address, BigNumber(2e18).toString(10), {
            from: user1
        });
        await sleep(60);


        let user0Points = await getUserPoints(miningPool, deployer);
        console.log(`User 0 Points: ${BigNumber(user0Points).toString(10)}`);

        let user1Points = await getUserPoints(miningPool, user1);
        console.log(`User 1 Points: ${BigNumber(user1Points).toString(10)}`);

        let user2Points = await getUserPoints(miningPool, user2);
        console.log(`User 2 Points: ${BigNumber(user2Points).toString(10)}`);

        let totalPoints = await miningPool.totalPoints();
        console.log(`totalPoints: ${BigNumber(totalPoints).toString(10)}`);

        console.log(`Total User Points: ${BigNumber(user0Points).plus(user1Points).plus(user2Points).toString(10)}`);

        callback();
    } catch (e) {
        callback(e);
    }

    async function getUserPoints(miningPool, user) {
        let points = 0;
        let getPendingNFTLength = await miningPool.getPendingNFTLength(user);

        console.log("User: ", user);
        for (var i = 0; i < getPendingNFTLength; i++) {
            let pendingNFT = await miningPool.pendingNFT(user, i);

            // console.log(`${i} NFT: ${pendingNFT.points} Points`);
            points = BigNumber(points).plus(pendingNFT.points);
        }

        const globalUpdateTime = await miningPool.globalUpdateTime();
        const updateTime = await miningPool.updateTime(user);
        const getAllPositionValue = await miningPool.getAllPositionValue(user);

        const currentPendingPoints = await miningPool.currentPendingPoints(user);
        const pendingPoints = BigNumber(globalUpdateTime).minus(updateTime).times(getAllPositionValue).plus(currentPendingPoints);
        console.log("currentPendingPoints: ", BigNumber(currentPendingPoints).toString(10));
        console.log("pendingPoints: ", pendingPoints.toString(10));
        console.log("user total: ", BigNumber(points).plus(pendingPoints).toString(10))

        return BigNumber(points).plus(pendingPoints);
    }
}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}