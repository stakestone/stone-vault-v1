// truffle compile
// truffle exec scripts/1buy.js --network local
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");
const taker1 = "0x82E9E542db3414E350A1BD74e7a8Dc10db42e9d5";
const web3 = new Web3('http://127.0.0.1:7777');
const stoneVaultAbi = require('../build/contracts/StoneVault.json').abi;

// 在命令行开启节点：
// anvil --fork-url https://mainnet.infura.io/v3/5da74360b63749e6b430ec4e7248ab8a --block-time 12 --port 7777 --chain-id 1338

async function main() {
    try {
        // 启用 impersonation
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [taker1],
            id: 1,
        });

        // 创建合约实例
        const vault = "0xA62F9C5af106FeEE069F38dE51098D9d81B90572";
        const stoneVault = new web3.eth.Contract(stoneVaultAbi, vault);

        // // 获取资产池余额
        // const assetsVaultAddress = "0x9485711f11B17f73f2CCc8561bcae05BDc7E9ad9";
        // const assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount:", web3.utils.fromWei(assetsVaultBalance, 'ether'), "ETH");

        // 获取用户提取额度
        const receipt = await stoneVault.methods.userReceipts(taker1).call();
        const { withdrawRound, withdrawShares, withdrawableAmount } = receipt;
        const withdrawable = web3.utils.fromWei(withdrawableAmount, 'ether');
        console.log(`取款为第：${withdrawRound} 轮`);
        console.log(`用户 ${taker1} 可取share额度为：${withdrawShares} `);
        console.log(`用户 ${taker1} 的可取额度为：${withdrawable} ETH`);
        const price = await stoneVault.methods.roundPricePerShare(167).call();
        console.log(`第${withdrawRound} 轮价格为：${price} `);
        const withdrawAmount = BigNumber(price).times(withdrawShares).div(1e18);
        console.log(`用户能取金额为：${withdrawAmount} `);

        await stoneVault.methods.instantWithdraw(withdrawAmount, 0).send({
            from: taker1,
        });

        console.log("Transaction hash:", tx.transactionHash);

        console.log("instantWithdraw finished!");
        return callback(); // 确保 Truffle 正确结束脚本
    } catch (e) {
        console.error("An error occurred:", error);
    }
}
main();
