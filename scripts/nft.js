// truffle compile
// truffle exec scripts/nft.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneNFT = artifacts.require("StoneNFT");
const MiningPool = artifacts.require("MiningPool");
const Stone = artifacts.require('Stone');

module.exports = async function (callback) {
    try {
        const taker1 = "0xff8f90A22b5D6d209D3a97100AB0F8f0a8520c6C";
        const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
        const stoneNFT = await StoneNFT.at("0xcf9F37F06D75274c610FB5e428f38273afc1CD0d");
        const stone = await Stone.at("0x9964C9a0F5c0Fd5E86Cf2d86765E0ae1eeCa680D");
        const miningPool = await MiningPool.at("0xA0A2917cB9fBf3159730Cb502e83Cc7b32202c7f");
        // await stone.approve(miningPool.address, BigNumber(100000).times(1e18), {
        //     from: taker1
        // });
        // await miningPool.stake(stone.address, BigNumber(1e18), {
        //     from: taker1
        // });

        let nftIds = await stoneNFT.getIdsByOwner(deployer);
        let len = nftIds.length;
        console.log("len is : ", len.toString(10));
        for (i = 0; i < len; i++) {
            propertiesById = await stoneNFT.propertiesById(nftIds[i]);
            console.log(i + "points is : ", BigNumber(propertiesById.points).toString(10));
            console.log(i + "minter is : ", propertiesById.minter);
            console.log(i + "startTime is : ", BigNumber(propertiesById.startTime).toString(10));
            console.log(i + "endTime is : ", BigNumber(propertiesById.endTime).toString(10));
        }
        let totalPoints = BigNumber(await miningPool.totalPoints());
        console.log("total points is : ", totalPoints.toString(10));

        // await sleep(300);
        await miningPool.terminate(stoneNFT.address, {
            from: deployer
        });
        console.log("miningPool is terminated!");
        totalPoints = BigNumber(await miningPool.totalPoints());
        console.log("terminate total points is : ", totalPoints.toString(10));

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