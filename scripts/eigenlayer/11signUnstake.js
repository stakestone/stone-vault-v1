//node scripts/eigenlayer/11signUnstake.js
const web3 = require("web3");
// Connect to an Ethereum node
const web = new web3.Web3('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');

// Ethereum account address
const accountAddress = '0x0dad1afea01f04fddc58d93c8fce4ee9540a30b0';
const message = {
  validators: [
    "0x904f16827fc8c1592a6a1cd7b497d9873fd4bdfd579e4c805efbbb3a8776447213c6c9161d312eba94676572aadb2543"
  ]
};
async function signMessage() {
  try {
    const privateKey = "0xb4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae";
    // const privateKeyBuffer = Buffer.from(privateKey, 'hex')

    // Sign unstake message
    let signedMessage = await web.eth.accounts.sign(JSON.stringify(message), privateKey);
    console.log("signedMessage: ", signedMessage);

  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

// Call the async function
signMessage();
