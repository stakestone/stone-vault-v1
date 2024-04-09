const web3 = require("web3");
// Connect to an Ethereum node
const web = new web3.Web3('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');

// Your Ethereum account private key
const privateKey = 'ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136';

// Ethereum account address
const accountAddress = '0x693385E040a9b038f6e87bc49a34D5645EAf66e5';
const rawData = "0xc82655b7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000030aacf97754fa3b98833f90767d57aae7bac9c7a70a8a1beb03d892f95923d4098d3e2a913696da040f032823a5cbe42260000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200100000000000000000000007f6a925a67c315b48d3f1e76989c6203a4e0bae80000000000000000000000000000000000000000000000000000000000000060924bc2f529b3e6a4618ec52111d4b6b29e734382e4bb7672f555d8ecad4d9adab650ff34e58bada543d0df70cdd415e509233e9bce53238df16c299b8b0d60881fd93bfea32fa685ddda4204e0e15d4b7cb0812401ae4185b631539e71eae97f00000000000000000000000000000000000000000000000000000000000000015e1a45472d0dedbd51fa0eccf4a0036bc1a647ab882d4e188ffdcd73f73648e4";

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