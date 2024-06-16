require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  // defaultNetwork: "sepolia",
  networks: {
    local: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/oOue1sa9aAJLZ8nvwf9Wx3N5URDH5UIG"
      }
    }
    // sepolia: {
    //   url: "https://sepolia.infura.io/v3/<key>",
    //   accounts: [privateKey1, privateKey2]
    // }
  },
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}
