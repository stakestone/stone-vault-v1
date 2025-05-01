const process = require("process");

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');

const Stone = artifacts.require("Stone");
const StoneCross = artifacts.require("StoneCross");

module.exports = async function (callback) {
    try {
        const network = process.argv[5];

        const config = {
            "Ethereum": {
                "ID": 101,
                "EndPoint": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
                "STONE": "0x7122985656e38BDC0302Db86685bb972b145bD3C",
                "Done": false,
            },
            "Linea": {
                "ID": 183,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "0x93F4d0ab6a8B4271f4a28Db399b5E30612D21116",
                "Done": false,
            },
            "Mode": {
                "ID": 260,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "0x80137510979822322193FC997d400D5A6C747bf7",
                "Done": false,
            },
            "Scroll": {
                "ID": 214,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "0x80137510979822322193FC997d400D5A6C747bf7",
                "Done": false,
            },
            "Zircuit": {
                "ID": 303,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "0x80137510979822322193FC997d400D5A6C747bf7",
                "Done": false,
            },
            "Manta": {
                "ID": 217,
                "EndPoint": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
                "STONE": "0xEc901DA9c68E90798BbBb74c11406A32A70652C3",
                "Done": false,
            },
            "BNB": {
                "ID": 102,
                "EndPoint": "0x3c2269811836af69497E5F486A85D7316753cf62",
                "STONE": "0x80137510979822322193FC997d400D5A6C747bf7",
                "Done": false,
            }
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
                if (network == "BNB") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Zircuit"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Zircuit"].ID, addrs);
                } else if (network == "Linea") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Zircuit"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Zircuit"].ID, addrs);
                } else if (network == "Scroll") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Zircuit"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Zircuit"].ID, addrs);
                }
                else if (network == "Mode") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Zircuit"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Zircuit"].ID, addrs);
                }
                else if (network == "Manta") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Zircuit"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Zircuit"].ID, addrs);
                }
                else if (network == "Zircuit") {
                    let addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Ethereum"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Ethereum"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["BNB"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["BNB"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Manta"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Manta"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Linea"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Linea"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Scroll"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Scroll"].ID, addrs);
                    addrs = ethers.utils.solidityPack(
                        ["address", "address"],
                        [config["Mode"].STONE, conf.STONE]);
                    await stone.setTrustedRemote(config["Mode"].ID, addrs);
                }
            }
        }

        callback();
    } catch (e) {
        callback(e);
    }
}