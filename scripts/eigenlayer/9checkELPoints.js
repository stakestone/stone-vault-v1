const BigNumber = require('bignumber.js');

async function getPoints(address) {
    try {
        const { default: fetch } = await import('node-fetch');
        const { ethers } = await import('ethers'); // 导入ethers模块
        const url = `https://goerli.eigenlayer.xyz/api/trpc/tokenStaking.getRestakingPoints,nativeStaking.getNativeStakingSummaryByEigenpod?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22staker%22%3A%22${address}%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22podOwnerAddress%22%3A%22${address}%22%7D%7D%7D`;
        const response = await fetch(url);
        const data = await response.json();
        console.log("data[0].result.data.json is : ", data[0].result.data.json);
        const totalIntegratedShares = data[0].result.data.json.reduce((total, obj) => total + BigInt(obj.integratedShares), BigInt(0));
        console.log("totalIntegratedShares is :", totalIntegratedShares);
        const points = ethers.formatEther(ethers.BigNumber.from(totalIntegratedShares)); // 使用utils.bigNumberify转换为BigNumber
        return points;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

// Replace the addresses with the actual addresses
const stakerAddress = "0xCD040cDc8f5ec149B8470e7FC1347e344B302374";
const podOwnerAddress = "0x17b8aA377a7B334F9E54dbC9Ee1D7BC55723B058";

// Call the function to get points
getPoints(stakerAddress)
    .then(points => {
        console.log("Points:", points);
    })
    .catch(error => {
        console.error("Error:", error);
    });

