const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:7777');
const NFTMiningPoolABI = require('../build/contracts/NFTMiningPool.json').abi;

module.exports = async function (callback) {
    try {
        // 合约地址
        const NFT_MINING_POOL_ADDRESS = '0x0FAC524F8cC56f693aB84fd30b888E38439cE43a';
        const POSITION_MANAGER_ADDRESS = '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff'; // NonfungiblePositionManager
        const USER_ADDRESS = '0x15f438c3fed4eb5474e3bc3655d0ab3cfd0cddf1';
        const NFT_ID = 6652;
        const FUNDER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        const FUNDER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        // 1. 初始化合约
        const nftMiningPool = new web3.eth.Contract(NFTMiningPoolABI, NFT_MINING_POOL_ADDRESS);
        const positionManager = new web3.eth.Contract([
            {
                "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
                "name": "ownerOf",
                "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
                "stateMutability": "view",
                "type": "function"
            }
        ], POSITION_MANAGER_ADDRESS);

        // 2. 检查初始所有权
        const initialOwner = await positionManager.methods.ownerOf(NFT_ID).call();
        console.log(`Initial NFT owner: ${initialOwner}`);

        // 3. 检查NFT是否已质押
        const stakedNFTs = await nftMiningPool.methods.getStakedLP(USER_ADDRESS).call();
        console.log("Staked NFTs:", stakedNFTs);
        if (!stakedNFTs.includes(NFT_ID.toString())) {
            throw new Error(`NFT #${NFT_ID} is not staked by this user!`);
        }

        // 4. 启用账户模拟
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_impersonateAccount",
            params: [USER_ADDRESS],
            id: 1,
        });
        //更新用户ETH额度
        // await web3.currentProvider.send({
        //     jsonrpc: "2.0",
        //     method: "anvil_setBalance",
        //     params: [USER_ADDRESS, "0xDE0B6B3A7640000"], // 1 ETH (in hex)
        //     id: 1,
        // });

        const tx = {
            from: FUNDER_ADDRESS,
            to: USER_ADDRESS,
            value: web3.utils.toWei('100', 'ether'), // 转 100 ETH
            gas: 21000, // 标准转账 Gas
        };

        // 2. 签名并发送
        const signedTx = await web3.eth.accounts.signTransaction(tx, FUNDER_PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('✅ 转账成功！Tx Hash:', receipt.transactionHash);
        console.log('用户余额:', web3.utils.fromWei(await web3.eth.getBalance(USER_ADDRESS), 'ether'), 'ETH');
        // 5. 执行Unstake
        console.log("Unstaking NFT...");
        const unstakeTx = await nftMiningPool.methods.unstake([NFT_ID]).send({
            from: USER_ADDRESS,
            gas: 1200000
        });
        console.log("✅ Unstake success! Tx hash:", unstakeTx.transactionHash);

        // 6. 验证所有权转移
        const newOwner = await positionManager.methods.ownerOf(NFT_ID).call();
        console.log(`New NFT owner: ${newOwner}`);

        if (newOwner.toLowerCase() === USER_ADDRESS.toLowerCase()) {
            console.log("✅ Ownership successfully transferred back to user");
        } else {
            console.log("❌ Ownership NOT transferred - something went wrong");
            console.log("Expected owner:", USER_ADDRESS);
            console.log("Actual owner:", newOwner);
        }

        // 7. 停止模拟
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "anvil_stopImpersonatingAccount",
            params: [USER_ADDRESS],
            id: 2,
        });

        callback();
    } catch (error) {
        console.error("❌ Error:", error.message || error);
        callback(error);
    }
};