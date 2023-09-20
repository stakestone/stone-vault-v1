/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

// const HDWalletProvider = require('@truffle/hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
    /**
     * Networks define how you connect to your ethereum client and let you set the
     * defaults web3 uses to send transactions. If you don't specify one truffle
     * will spin up a development blockchain for you on port 9545 when you
     * run `develop` or `test`. You can ask a truffle command to use a specific
     * network from the command line, e.g
     *
     * $ truffle test --network <network-name>
     */
    networks: {
        // Useful for testing. The `development` name is special - truffle uses it by default
        // if it's defined here and no other network is specified at the command line.
        // You should run a client (like ganache-cli, geth or parity) in a separate terminal
        // tab if you use this network and you must also set the `host`, `port` and `network_id`
        // options below to some value.
        //
        // development: {
        //  host: "127.0.0.1",     // Localhost (default: none)
        //  port: 8545,            // Standard Ethereum port (default: none)
        //  network_id: "*",       // Any network (default: none)
        // },
        // Another network with more advanced options...
        // advanced: {
        // port: 8777,             // Custom port
        // network_id: 1342,       // Custom network
        // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
        // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
        // from: <address>,        // Account to send txs from (default: accounts[0])
        // websockets: true        // Enable EventEmitter interface for web3 (default: false)
        // },
        // Useful for deploying to a public network.
        // NB: It's important to wrap the provider as a function.
        // ropsten: {
        // provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/YOUR-PROJECT-ID`),
        // network_id: 3,       // Ropsten's id
        // gas: 5500000,        // Ropsten has a lower block limit than mainnet
        // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
        // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
        // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
        // },
        // Useful for private networks
        // private: {
        // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
        // network_id: 2111,   // This network is yours, in the cloud.
        // production: true    // Treats this network as if it was a public net. (default: false)
        // }
        local: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            gas: 200000000,
            gasPrice: 20000000000,
        },
        test: {
            network_id: 1337,
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba"],
                "https://fethereum.stakestone.io", 0, 1), //save, test6
        },
        bsctest: {
            network_id: "*",
            gas: 12000000,
            gasPrice: 30000000000,
            confirmations: 0,   //wait for block confirmation
            skipDryRun: true,
            timeoutBlocks: 200,
            networkCheckTimeout: 10000,
            provider: () => new HDWalletProvider(["ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b165944051b5f10b23d36ecb0c5701a4d82b068b4b5508fd67e31fac6267b9a6", "0769a49e3af0bb6aac473fbc6b8ee097d182b136f17b76585f841036578bf7ed", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b089dc6a373771d00fb58fbd0951a5d0ad7236478dd32945f6ac29dd92ea59d4"],
                "https://data-seed-prebsc-2-s3.binance.org:8545/", 0, 5),
        },
        bsc: {
            network_id: 56,
            gas: 6700000,
            gasPrice: 5000000000,
            confirmations: 2,
            skipDryRun: true,
            timeoutBlocks: 200,
            networkCheckTimeout: 10000,
            provider: () => new HDWalletProvider([
                "a8d19774024ab0f7809d9f822c01a5d2f460ad2dac08d537587095e0270e0acc"
            ],
                "https://bsc-dataseed.binance.org/", 0, 1),
        },
        goerli: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b089dc6a373771d00fb58fbd0951a5d0ad7236478dd32945f6ac29dd92ea59d4", "86aa2dd445fd069fb78d3b6093f644890d40a0705741dabb8d9b2637449ae891", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c", "c53e33382659eaa0036f280a565f065df7026ef3886e1e6f442142b8ab196a32"],
                "https://goerli.infura.io/v3/23fb86be94634b77a5f0f97bd47526a0", 0, 7),
        },
        mantleTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b089dc6a373771d00fb58fbd0951a5d0ad7236478dd32945f6ac29dd92ea59d4", "86aa2dd445fd069fb78d3b6093f644890d40a0705741dabb8d9b2637449ae891", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c", "c53e33382659eaa0036f280a565f065df7026ef3886e1e6f442142b8ab196a32"],
                "https://rpc.testnet.mantle.xyz	", 0, 7),
        },
        eth: {
            network_id: 1,
            skipDryRun: true,
            // gas: 4465030,
            // gasPrice: 10000000000,
            // confirmations: 0,   //wait for block confirmation
            // timeoutBlocks: 200,
            // networkCheckTimeout: 10000,
            //new test, test2
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "0769a49e3af0bb6aac473fbc6b8ee097d182b136f17b76585f841036578bf7ed", "", "", "", "", ""],
                "https://mainnet.infura.io/v3/a692b15ced594525bd24d241645d0fb3", 0, 2),
        },
        arbtest: {
            network_id: 421613,
            gas: 15000000,
            gasPrice: 35000000000,
            confirmations: 2,    // # of confs to wait between deployments. (default: 0)
            timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
            skipDryRun: true,    // Skip dry run before migrations? (default: false for public nets )
            provider: () => new HDWalletProvider(["ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b089dc6a373771d00fb58fbd0951a5d0ad7236478dd32945f6ac29dd92ea59d4", "86aa2dd445fd069fb78d3b6093f644890d40a0705741dabb8d9b2637449ae891", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c", "c53e33382659eaa0036f280a565f065df7026ef3886e1e6f442142b8ab196a32"],
                "https://goerli-rollup.arbitrum.io/rpc", 0, 7),
        },
    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
        // timeout: 100000
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: "pragma",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 20
                }
            }
        }
    }
};
ErrorType = {
    REVERT: "revert",
    INVALID_OPCODE: "invalid opcode",
    OUT_OF_GAS: "out of gas",
    INVALID_JUMP: "invalid JUMP"
}