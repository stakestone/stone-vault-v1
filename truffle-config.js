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
            //     gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
            //     gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
        },
        test: {
            network_id: 1337,
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba"],
                "https://fethereum.stakestone.io", 0, 1), //save, test6
        },
        holesky: {
            network_id: 17000,
            gas: 9333911040000,
            confirmations: 0,   //wait for block confirmation
            skipDryRun: true,
            timeoutBlocks: 200,
            networkCheckTimeout: 10000,
            provider: () => new HDWalletProvider(['9b59754c6dd4903dcaf129087fed52e088c97a96da80023927876a33179a886b', 'e5d6a316a1d237169b28034cdb246af0fad0e133f7f0384e6125525a88c351bc'],
                // "https://holesky.infura.io/v3/5da74360b63749e6b430ec4e7248ab8a", 0, 2),
                "https://ethereum-holesky-rpc.publicnode.com", 0, 2),
        },
        bsctest: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 5000000000,
            confirmations: 0,   //wait for block confirmation
            skipDryRun: true,
            timeoutBlocks: 200,
            networkCheckTimeout: 10000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b165944051b5f10b23d36ecb0c5701a4d82b068b4b5508fd67e31fac6267b9a6", "0769a49e3af0bb6aac473fbc6b8ee097d182b136f17b76585f841036578bf7ed", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b089dc6a373771d00fb58fbd0951a5d0ad7236478dd32945f6ac29dd92ea59d4"],
                "https://data-seed-prebsc-2-s3.binance.org:8545/", 0, 6),
        },
        bsc: {
            network_id: 56,
            provider: () => new HDWalletProvider(["5725d1e23b2355573f96caede4f8716ab17494c0559f9c2a9a30c246f7cfccbc", "a667d6ce2f53a0eed31237118a2a64b292d9a7d83d4020723b25df2053c4e5b8", "9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://bsc-dataseed.binance.org/", 0, 4),
        },
        goerli: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae", "ad71217e310fbd0fdfd7fb627788cc770710140d6ea8d32b9360f6f2babac136", "b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae", "e5d6a316a1d237169b28034cdb246af0fad0e133f7f0384e6125525a88c351bc"],
                "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", 0, 4),
        },
        sepolia: {
            network_id: "*",
            chainId: "11155111",
            //A1,A2,A3,formaltest1 
            // rpc节点可以去infru里面找
            provider: () => new HDWalletProvider(["05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45", "9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "a667d6ce2f53a0eed31237118a2a64b292d9a7d83d4020723b25df2053c4e5b8", "b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae"],
                "https://sepolia.infura.io/v3/5da74360b63749e6b430ec4e7248ab8a", 0, 4),
        },
        modeTestnet: {
            network_id: "*",
            gas: 0x663be0,
            gasPrice: 0x2540be400,
            //A1,A2,A3,formaltest1
            provider: () => new HDWalletProvider(["9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "a667d6ce2f53a0eed31237118a2a64b292d9a7d83d4020723b25df2053c4e5b8", "b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://sepolia.mode.network", 0, 4),
        },
        mode: {
            network_id: 34443,
            provider: () => new HDWalletProvider(["d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://mainnet.mode.network", 0, 4),
        },
        scrollTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://scroll-sepolia.blockpi.network/v1/rpc/public", 0, 3),
        },
        scroll: {
            network_id: 534352,
            provider: () => new HDWalletProvider(["d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://rpc.scroll.io/", 0, 3),
        },
        metis: {
            network_id: 1088,
            provider: () => new HDWalletProvider(["d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://andromeda.metis.io/?owner=1088", 0, 3),
        },
        metisTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://goerli.gateway.metisdevops.link", 0, 3),
        },
        lineaTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://rpc.goerli.linea.build", 0, 2),
        },
        linea: {
            network_id: "*",
            provider: () => new HDWalletProvider(["9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://1rpc.io/linea", 0, 3),
        },
        mantleTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "cebeffe7a1cb192c87dace25252f7cac4beea27e36fe95d1650936f0b0de734c"],
                "https://rpc.testnet.mantle.xyz", 0, 2),
        },
        mantle: {
            network_id: "*",
            provider: () => new HDWalletProvider(["9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://rpc.mantle.xyz", 0, 3),
        },
        baseTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba"],
                "https://goerli.base.org", 0, 2),
        },
        base: {
            network_id: "*",
            provider: () => new HDWalletProvider(["10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://mainnet.base.org", 0, 2),
        },
        mantaTestnet: {
            network_id: "*",
            gas: 6700000,
            gasPrice: 10000000000,
            provider: () => new HDWalletProvider(["b4fd3edd62fc2afbf64b77293dd90a78248be94e2ebd12d0edf002da9dc9c4ae", "9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8"],
                "https://manta-testnet.calderachain.xyz/http", 0, 2),
        },
        eth: {
            network_id: 1,
            skipDryRun: true,
            provider: () => new HDWalletProvider(["05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45", "d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "0769a49e3af0bb6aac473fbc6b8ee097d182b136f17b76585f841036578bf7ed"],
                "https://mainnet.infura.io/v3/a692b15ced594525bd24d241645d0fb3", 0, 3),
        },
        manta: {
            network_id: 169,
            skipDryRun: true,
            provider: () => new HDWalletProvider(["9443975153eedd6dee8d8a54164494b507f7467fc5bca41f436cb7023462b2f8", "0769a49e3af0bb6aac473fbc6b8ee097d182b136f17b76585f841036578bf7ed"],
                "https://pacific-rpc.manta.network/http", 0, 2),
        },
        AstarzkEVM: {
            network_id: 3776,
            provider: () => new HDWalletProvider(["d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba", "05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45"],
                "https://rpc.startale.com/astar-zkevm", 0, 3),
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
        merlin: {
            network_id: 4200,
            provider: () => new HDWalletProvider(["05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45", "d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba"],
                "https://rpc.merlinchain.io", 0, 3),
        },
        xlayer: {
            network_id: 196,
            provider: () => new HDWalletProvider(["05b062e1ad3090361635c58264e9ef614dc4c1866cce3fd8bb4bb72539d5ac45", "d1af49db36673585ed5fee2e9aa3719814b3ed1c27f59585e1d13a6e1475aca2", "10f5b3fd5a19505cef031805bc6373a2542532d2898e5e05a7e08ab9c2d00cba"],
                "https://xlayerrpc.okx.com", 0, 3),
        }
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
                },
                viaIR: true
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