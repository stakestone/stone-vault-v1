const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;

const MockToken = artifacts.require("MockToken");
const MiningPool = artifacts.require("MiningPool");
const StoneAdapter = artifacts.require("StoneAdapter");
const StoneNFT = artifacts.require("StoneNFT");

module.exports = async function (callback) {
    const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";
    const user1 = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";
    const user2 = "0xAC5CC232D28257b30d79d3b26760499BD33bC978";

    try {
        const miningPool = await MiningPool.at("0x8f5420e76eEC29027800D4e3e8E879617bdE709b");
        console.log("MiningPool: ", miningPool.address);
        const stoneNFT = await StoneNFT.at("0x129e49c0399E3C932D34c3b76A598214b5B82cf9");
        console.log("StoneNFT: ", stoneNFT.address);
        const token = await MockToken.at("0xEc901DA9c68E90798BbBb74c11406A32A70652C3");
        console.log("token: ", token.address);


        let user1LP = BigNumber(await token.balanceOf(user1));
        console.log(" user1 lp: ", user1LP.toString(10));
        let user2LP = BigNumber(await token.balanceOf(user2));
        console.log(" user2 lp: ", user2LP.toString(10));

        await token.isApprovedForAll(user1, miningPool.address, {
            from: user1
        });
        await token.isApprovedForAll(user2, miningPool.address, {
            from: user2
        });

        await miningPool.stake(token.address, user1LP.toString(10), {
            from: user1
        });
        await sleep(60);

        await miningPool.stake(token.address, user2LP.toString(10), {
            from: user2
        });
        await sleep(60);

        // await miningPool.stake(token.address, BigNumber(2e18).toString(10), {
        //     from: user1
        // });
        // await sleep(60);

        // await miningPool.stake(token.address, BigNumber(3e18).toString(10), {
        //     from: user2
        // });
        // await sleep(120);

        // await miningPool.unstake(token.address, BigNumber(1e18).toString(10), {
        //     from: deployer
        // });
        // await sleep(60);

        // await miningPool.unstake(token.address, BigNumber(2e18).toString(10), {
        //     from: user1
        // });
        // await sleep(60);

        // await miningPool.unstake(token.address, BigNumber(3e18).toString(10), {
        //     from: user2
        // });
        // await sleep(120);

        // // unstake all
        // await miningPool.unstake(token.address, BigNumber(1e18).toString(10), {
        //     from: deployer
        // });
        // await sleep(60);
        // await miningPool.unstake(token.address, BigNumber(2e18).toString(10), {
        //     from: user1
        // });
        // await sleep(60);

        let user1Points = await getUserPoints(miningPool, user1);
        console.log(`User 1 Points: ${BigNumber(user1Points).toString(10)}`);

        let user2Points = await getUserPoints(miningPool, user2);
        console.log(`User 2 Points: ${BigNumber(user2Points).toString(10)}`);

        let totalPoints = await miningPool.totalPoints();
        console.log(`totalPoints: ${BigNumber(totalPoints).toString(10)}`);

        console.log(`Total User Points: ${BigNumber(user1Points).plus(user2Points).toString(10)}`);

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