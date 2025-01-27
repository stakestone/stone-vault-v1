const process = require("process");

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');

const Stone = artifacts.require("Stone");
const StoneCross = artifacts.require("StoneCross");

module.exports = async function (callback) {
    try {
        const network = process.argv[5];

        const config = {
            "ethereum": {
                "ID": 101,
                "EndPoint": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
                "STONE": "",
                "Done": false,
            },
            "linea": {
                "ID": 183,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "",
                "Done": false,
            },
            "mantle": {
                "ID": 181,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "",
                "Done": false,
            },
        }

        console.log("Network is: ", network);
        const conf = config[network];

        console.log("Config: ", conf);

        if (!conf.Done) {
            if (conf.STONE == "") {
                const stone = await StoneCross.new(conf.EndPoint, BigNumber(1000).times(1e18).toString(10));
                console.log("Stone: ", stone.address);
            } else {
                const stone = await Stone.at(conf.STONE);

                if (network == "ethereum") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["linea"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["linea"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["mantle"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["mantle"].ID, addrs);
                } else if (network == "linea") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["ethereum"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["ethereum"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["mantle"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["mantle"].ID, addrs);
                } else if (network == "mantle") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["ethereum"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["ethereum"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["linea"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["linea"].ID, addrs);
                }
            }
        }

        callback();
    } catch (e) {
        callback(e);
    }
}