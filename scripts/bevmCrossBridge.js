const axios = require('axios');

const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
let privacycode = '';
//3.设置测试网络 infura
let infuraUrl = 'https://mainnet.infura.io/v3/。。';
const provider = new HDWalletProvider(privacycode, infuraUrl);
const web3 = new Web3(provider);
// console.log('version:________', web3.version)
// console.log('web3-eth.curretProvider_____________', web3.currentProvider)
const BigNumber = require('bignumber.js');

// Contract ABI and address
const contractAbi = [{ "inputs": [{ "internalType": "address", "name": "_stone", "type": "address" }, { "internalType": "address payable", "name": "_vault", "type": "address" }, { "internalType": "address", "name": "_bridge", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "srcAddr", "type": "address" }, { "indexed": false, "internalType": "string", "name": "dstAddr", "type": "string" }, { "indexed": false, "internalType": "uint256", "name": "etherAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "stoneAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "gasPaid", "type": "uint256" }], "name": "BridgeTo", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferStarted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "inputs": [], "name": "acceptOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "_swapId", "type": "bytes32" }, { "internalType": "string", "name": "_dstAddress", "type": "string" }, { "internalType": "uint256", "name": "_gasPaidForCrossChain", "type": "uint256" }], "name": "bridgeTo", "outputs": [{ "internalType": "uint256", "name": "stoneMinted", "type": "uint256" }], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pendingOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "stone", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "vault", "outputs": [{ "internalType": "address payable", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_token", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdrawToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
const contractAddress = '0x53dde9a818ff2bdb9e54b9149a5e66dca5df6c7f';

// User information
const fromAddress = '0xa9B3cBcF3668e819bd35ba308dECb640DF143394';
const toAddress = '0xa9B3cBcF3668e819bd35ba308dECb640DF143394';
const fromChain = 'Ethereum';
const toChain = 'ChainXEvm';
const fromToken = '0x7122985656e38BDC0302Db86685bb972b145bD3C';
const amount = 0.001; // 跨链金额（以代币单位表示）
const apiUrl = 'https://api.bevm.io/bridge/bridgeOut';
// Deploy BEVM contract
const contract = new web3.eth.Contract(contractAbi, contractAddress);

// Send cross-chain request
const bridgeOut = async () => {
    try {
        // Get gas fee from BEVM API
        const gasFeeResponse = await axios.post(apiUrl, {
            fromAddress,
            toAddress,
            fromChain,
            toChain,
            fromToken,
            amount,
        });
        const gasFee = gasFeeResponse.data.estGas;
        console.log("gasFee is : ", gasFee);
        // Encode cross-chain transaction data
        let swapId = web3.utils.randomHex(32);
        console.log("swapId is : ", swapId);

        // const data = contract.methods.bridgeTo(
        //     swapId, toAddress, gasFee
        // ).encodeABI();

        // const tx = {
        //     to: contractAddress,
        //     data: data,
        //     value: amount, // Ensure value is in wei
        //     from: fromAddress, // Replace with your account address

        // };

        // // Send cross-chain transaction
        // const txReceipt = await web3.eth.sendTransaction(tx);

        console.log(`跨链交易已发送：${tx.transactionHash}`);
    } catch (error) {
        console.error(error);
    }
};

bridgeOut();
