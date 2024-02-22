// const Web3 = require('web3');
const web3 = require("web3");
// Connect to an Ethereum node
const web = new web3.Web3('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');

// Your Ethereum account private key
const privateKey = 'e5d6a316a1d237169b28034cdb246af0fad0e133f7f0384e6125525a88c351bc';

// Ethereum account address
const accountAddress = '0x613670cC9D11e8cB6ea297bE7Cac08187400C936';
const rawData = "0xc82655b7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000030978bc0549b5f3eec0b7a3e6a11a814d1773ea320fc971b2233215d5a86f6b0ef22a61417f3d2f2d2524fcbe069cd18ae000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020010000000000000000000000239f07289c8b9f2f195da3c17920542df9f16fe50000000000000000000000000000000000000000000000000000000000000060893fe721debaabcd4c3e56aad61f10d787cb2ab98379edb51a097d9b3bb5eae6133b9b816c457abca835def490f0ecd903319125ec9d1197d795697d21909738b5222bd01cc9531abe1a4efd95692bc5ca72f84a94481f780a2b0b2cbba7d4ff0000000000000000000000000000000000000000000000000000000000000001ed5c6e29498226bc8be7c5a14fd3fc8d3a54af5fc6d8cc2eadf4a6a77be8aea9";

async function sendTransaction() {
    try {
        // Create the transaction object
        const transactionObject = {
            from: accountAddress,
            to: "0xA4C31ed561f14151AC1849C6dC5B9D56d96af32c",
            value: "0x1bc16d674ec800000", // Amount of ETH in hexadecimal (32 ETH in wei)
            data: rawData,
            gas: 6700000,
            gasPrice: 10000000000
        };

        // Sign the transaction
        const signedTransaction = await web.eth.accounts.signTransaction(transactionObject, privateKey);

        // Send the signed transaction
        const receipt = await web.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        console.log('Transaction receipt:', receipt);
    } catch (error) {
        console.error('Error sending transaction:', error);
    }
}

// Call the async function
sendTransaction();