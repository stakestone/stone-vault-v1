const Web3 = require("web3");
const web3 = new Web3('http://127.0.0.1:7777');

const send = async (method, params = []) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method,
            params,
            id: Math.floor(Math.random() * 1000000),
        }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};

// 使用 anvil_mine 来推进多个区块
const mineBlocks = async (blockCount) => {
    if (blockCount <= 0) return;

    // 使用 anvil_mine 批量挖掘区块
    const result = await send("anvil_mine", [blockCount.toString()]);
    return result;
};

// 传统的时间推进（单个区块）
const increaseTime = async (seconds) => {
    const timeResult = await send("evm_increaseTime", [seconds]);
    const mineResult = await send("evm_mine", []);
    return { timeResult, mineResult };
};

module.exports = {
    // 使用 anvil_mine 的批量区块推进
    blocks: (count) => mineBlocks(count),

    // 传统时间推进（单个区块）
    seconds: (s) => increaseTime(s),
    minutes: (m) => increaseTime(m * 60),
    hours: (h) => increaseTime(h * 3600),
    days: (d) => increaseTime(d * 24 * 3600),
    mine: () => send("evm_mine"),

    // 直接调用
    mineBlocks,
    increaseTime
};