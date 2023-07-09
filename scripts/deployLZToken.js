const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const process = require("process");
const createClient = require('@layerzerolabs/scan-client');

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;

const Stone = artifacts.require("Stone");
const StoneVault = artifacts.require("StoneVault");
const StoneCross = artifacts.require("StoneCross");

const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";
const vault = "0x850a21f764E8Ce603baa3cDFd34C4DF4538E32DE";

module.exports = async function (callback) {
    try {
        const network = process.argv[5];

        const config = {
            "goerli": {
                "ID": 10121,
                "EndPoint": "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23",
                "STONE": "0x66B8e3BC9397A9FAFCeD498B3548BF0B1de580Aa",
                "Done": true,
            },
            "arbtest": {
                "ID": 10143,
                "EndPoint": "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab",
                "STONE": "0x64ee45Be2E1609b9829E82ADC9d92Bf00dF73d9d",
                "Done": true,
            },
            "bsctest": {
                "ID": 10102,
                "EndPoint": "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
                "STONE": "0x8e88D825eB9392985eD8E836e1588AdfAAB14AaD",
                "Done": false,
            },
        }

        console.log("Network is: ", network);
        const conf = config[network];

        console.log("Config: ", conf);

        if (!conf.Done) {
            if (conf.STONE == "") {
                const stone = await StoneCross.new(conf.EndPoint);
                console.log("Stone: ", stone.address);
            } else {
                const stone = await Stone.at(conf.STONE);

                if (network == "goerli") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["arbtest"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["arbtest"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["bsctest"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["bsctest"].ID, addrs);
                } else if (network == "arbtest") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["goerli"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["goerli"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["bsctest"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["bsctest"].ID, addrs);
                } else if (network == "bsctest") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["goerli"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["goerli"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["arbtest"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["arbtest"].ID, addrs);
                }
            }
        } else {
            if (network == "goerli") {
                // const stoneVault = await StoneVault.at(vault);
                // await stoneVault.deposit({
                //     value: BigNumber(1e17).toString(10)
                // });

                const stone = await Stone.at(conf.STONE);
                console.log("Stone Balance: ", await getStoneBalance(stone));

                let feed = await stone.updatePrice(
                    config["arbtest"].ID,
                    config["arbtest"].STONE
                    , {
                        value: BigNumber(1e16).toString(10)
                    })
                console.log("feed: ", feed.tx);
                await createClient.waitForMessageReceived(conf.ID, feed.tx)
                    .then((message) => {
                        console.log(message);
                    }).finally(() => {
                        console.log("getTxStatus");
                    });

                let tx = await stone.sendFrom(
                    deployer,
                    config["arbtest"].ID,
                    deployer,
                    BigNumber(5e15).toString(10),
                    deployer,
                    ZERO_ADDRESS,
                    ethers.utils.solidityPack(
                        ["bytes"],
                        ["0x"]),
                    {
                        value: BigNumber(1e16).toString(10)
                    }
                );
                console.log("Tx: ", tx.tx);
                await createClient.waitForMessageReceived(conf.ID, tx.tx)
                    .then((message) => {
                        console.log(message);

                    }).finally(() => {
                        console.log("getTxStatus");
                    });

                tx = await stone.sendFrom(
                    deployer,
                    config["bsctest"].ID,
                    deployer,
                    BigNumber(5e15).toString(10),
                    deployer,
                    ZERO_ADDRESS,
                    ethers.utils.solidityPack(
                        ["bytes"],
                        ["0x"]),
                    {
                        value: BigNumber(1e16).toString(10)
                    }
                );
                await createClient.waitForMessageReceived(conf.ID, tx.tx)
                    .then((message) => {
                        console.log(message);

                    }).finally(() => { });
                console.log("Tx: ", tx.tx);

                console.log("Stone Balance: ", await getStoneBalance(stone));

            } else if (network == "arbtest") {
                const stone = await StoneCross.at(conf.STONE);
                console.log("Stone Balance: ", await getStoneBalance(stone));

                const price = await stone.tokenPrice();
                console.log("Price: ", BigNumber(price).div(1e18).toString(10));


                let tx = await stone.sendFrom(
                    deployer,
                    config["goerli"].ID,
                    deployer,
                    BigNumber(1e15).toString(10),
                    deployer,
                    ZERO_ADDRESS,
                    ethers.utils.solidityPack(
                        ["bytes"],
                        ["0x"]),
                    {
                        value: BigNumber(1e16).toString(10)
                    }
                );
                console.log("Tx: ", tx.tx);
                await createClient.waitForMessageReceived(conf.ID, tx.tx)
                    .then((message) => {
                        console.log(message);

                    }).finally(() => {
                        console.log("getTxStatus");
                    });

                tx = await stone.sendFrom(
                    deployer,
                    config["bsctest"].ID,
                    deployer,
                    BigNumber(1e15).toString(10),
                    deployer,
                    ZERO_ADDRESS,
                    ethers.utils.solidityPack(
                        ["bytes"],
                        ["0x"]),
                    {
                        value: BigNumber(1e16).toString(10)
                    }
                );
                console.log("Tx: ", tx.tx);
                await createClient.waitForMessageReceived(conf.ID, tx.tx)
                    .then((message) => {
                        console.log(message);

                    }).finally(() => {
                        console.log("getTxStatus");
                    });

                console.log("Stone Balance: ", await getStoneBalance(stone));
            } else if (network == "bsctest") {
                const stone = await Stone.at(conf.STONE);
                console.log("Stone Balance: ", await getStoneBalance(stone));

                let tx = await stone.sendFrom(
                    deployer,
                    config["goerli"].ID,
                    deployer,
                    BigNumber(1e15).toString(10),
                    deployer,
                    ZERO_ADDRESS,
                    ethers.utils.solidityPack(
                        ["bytes"],
                        ["0x"]),
                    {
                        value: BigNumber(1e16).toString(10)
                    }
                );
                await createClient.waitForMessageReceived(conf.ID, tx.tx)
                    .then((message) => {
                        console.log(message);

                    }).finally(() => {
                        console.log("getTxStatus");
                    });

                tx = await stone.sendFrom(
                    deployer,
                    config["arbtest"].ID,
                    deployer,
                    BigNumber(1e15).toString(10),
                    deployer,
                    ZERO_ADDRESS,
                    ethers.utils.solidityPack(
                        ["bytes"],
                        ["0x"]),
                    {
                        value: BigNumber(1e16).toString(10)
                    }
                );
                await createClient.waitForMessageReceived(conf.ID, tx.tx)
                    .then((message) => {
                        console.log(message);

                    }).finally(() => {
                        console.log("getTxStatus");
                    });

                console.log("Stone Balance: ", await getStoneBalance(stone));
            }
        }

        callback();
    } catch (e) {
        callback(e);
    }

    async function getStoneBalance(stone) {
        const bal = await stone.balanceOf(deployer);

        return BigNumber(bal).div(1e18).toString(10);
    }

    async function getTxStatus(id, tx) {
        createClient.waitForMessageReceived(id, tx)
            .then((message) => {
                console.log(message);

            }).finally(() => {
                console.log("getTxStatus");
            });

    }


}