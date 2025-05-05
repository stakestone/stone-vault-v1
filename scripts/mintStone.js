// const { ethers } = require("ethers");

// const Stone = artifacts.require("Stone");

// module.exports = async function (callback) {
//     try {
//         // 初始化 Ethers 提供者（兼容 Truffle）
//         const provider = new ethers.providers.Web3Provider(web3.currentProvider);
//         const stone = await Stone.at("0x7122985656e38BDC0302Db86685bb972b145bD3C");

//         const minterAddress = "0xEc306E46549A7E8f4fCE823D3058f2D134133B17";
//         const recipient = "0x22d130d251286e17b029d557d2928c5956efa8c4";
//         const amount = ethers.utils.parseEther("1000");

//         // 1. 给 minter 充值 ETH（Anvil 特有方法）
//         await provider.send("anvil_setBalance", [
//             minterAddress,
//             ethers.utils.hexlify(ethers.constants.WeiPerEther.mul(100)) // 100 ETH
//         ]);

//         // 2. 模拟 minter 账户
//         await provider.send("anvil_impersonateAccount", [minterAddress]);
//         const minterSigner = provider.getSigner(minterAddress);

//         // 3. 执行 mint
//         console.log(`Minting 1000 STONE to ${recipient}...`);
//         const tx = await stone.connect(minterSigner).mint(recipient, amount, {
//             gasLimit: 200000
//         });
//         await tx.wait();

//         // 4. 验证余额
//         const balance = await stone.balanceOf(recipient);
//         console.log(`✅ 成功！余额: ${ethers.utils.formatEther(balance)} STONE`);

//         // 5. 停止模拟
//         await provider.send("anvil_stopImpersonatingAccount", [minterAddress]);
//         callback();
//     } catch (error) {
//         console.error("错误:", error);
//         callback(error);
//     }
// };