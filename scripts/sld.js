const axios = require("axios");
const { ethers } = require("ethers");

// 配置 BscScan API
const BSCSCAN_API_KEY = "3GVIXJ4C8XJGUT5MG5TXXUAP4YZ4Z9C1E5"; // 替换为你的 BscScan API Key
const TOKEN_ADDRESS = "0x1ef6A7e2c966fb7C5403EFEFdE38338b1a95a084"; // Token 合约地址
const BSCSCAN_API_URL = `https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress=${TOKEN_ADDRESS}&page=1&offset=1000&apikey=${BSCSCAN_API_KEY}`;

// 配置本地 fork 环境
const FORK_URL = "http://localhost:7777"; // anvil 或 hardhat 的本地 fork 环境
const provider = new ethers.providers.JsonRpcProvider(FORK_URL);

// Token 合约 ABI（仅需要 balanceOf 方法）
const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];

// 创建 Token 合约对象
const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);

// 获取 Token 持有者列表
async function getTokenHolders() {
    try {
        const response = await axios.get(BSCSCAN_API_URL);
        if (response.data.status === "1") {
            return response.data.result; // 返回持有者列表
        } else {
            throw new Error(`BscScan API 错误: ${response.data.message}`);
        }
    } catch (error) {
        console.error("获取 Token 持有者列表失败:", error);
        return [];
    }
}

// 查询每个持有者的余额
async function getTokenBalances(holders) {
    const balances = [];
    for (const holder of holders) {
        const address = holder.TokenHolderAddress;
        const balance = await tokenContract.balanceOf(address);
        balances.push({
            address: address,
            balance: ethers.utils.formatUnits(balance, 18) // 转换为单位（假设 Token 有 18 位小数）
        });
    }
    return balances;
}

// 主函数
async function main() {
    // 获取 Token 持有者列表
    const holders = await getTokenHolders();
    console.log(`获取到 ${holders.length} 个持有者`);

    // 查询每个持有者的余额
    const balances = await getTokenBalances(holders);
    console.log("持有者余额:", balances);

    // 保存结果到文件（可选）
    const fs = require("fs");
    fs.writeFileSync("token_balances.json", JSON.stringify(balances, null, 2));
    console.log("结果已保存到 token_balances.json");
}

// 运行主函数
main().catch((error) => {
    console.error("脚本执行失败:", error);
});