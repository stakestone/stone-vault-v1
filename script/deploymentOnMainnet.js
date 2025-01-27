const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const fs = require('fs');
const path = require("path");

const Stone = artifacts.require("Stone");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");

const STETHHoldingStrategy = artifacts.require("STETHHoldingStrategy");
const RETHHoldingStrategy = artifacts.require("RETHHoldingStrategy");
const SFraxETHHoldingStrategy = artifacts.require("SFraxETHHoldingStrategy");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");

const SwappingAggregator = artifacts.require("SwappingAggregator");

const MiningPool = artifacts.require("MiningPool");
const StoneAdapter = artifacts.require("StoneAdapter");
const StoneNFT = artifacts.require("StoneNFT");

const deployer = "0xc1364aD857462e1B60609D9e56b5E24C5c21a312";

const data = require("./mainnet.json");

module.exports = async function (callback) {
    try {
        const layerZeroEndpoint = "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675";
        const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
        const wETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const stETHUniPool = "0x63818BbDd21E69bE108A23aC1E84cBf66399Bd7D";
        const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
        const stETHSlippage = 998000;
        const stETHFee = 10000;

        const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        const rETHUniPool = "0xa4e0faA58465A2D369aa21B3e42d43374c6F9613";
        const rETHCurvePool = "0x0f3159811670c117c372428d4e69ac32325e4d0f";
        const rETHSlippage = 1080000;
        const rETHFee = 500;

        const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
        const frxETHUniPool = "0x8a15b2Dc9c4f295DCEbB0E7887DD25980088fDCB";
        const frxETHCurvePool = "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577";
        const frxETHSlippage = 998000;
        const frxETHFee = 500;

        let swappingAggregatorAddr;
        let swappingAggregator;
        if (data.hasOwnProperty("swappingAggregatorAddr") && data.swappingAggregatorAddr != "") {
            swappingAggregatorAddr = data.swappingAggregatorAddr;
            swappingAggregator = await SwappingAggregator.at(swappingAggregatorAddr);
            console.log("swappingAggregator: ", swappingAggregator.address);
        } else {
            swappingAggregator = await SwappingAggregator.new(
                wETHAddr,
                [stETHAddr, frxETHAddr, rETHAddr],
                [stETHUniPool, frxETHUniPool, rETHUniPool],
                [stETHCurvePool, frxETHCurvePool, rETHCurvePool],
                [0, 0, 1],
                [stETHSlippage, frxETHSlippage, rETHSlippage],
                [stETHFee, frxETHFee, rETHFee]
            );
            console.log("swappingAggregator: ", swappingAggregator.address);
            swappingAggregatorAddr = swappingAggregator.address;

            data.swappingAggregatorAddr = swappingAggregator.address;
            writeData(data);
        }

        let minterAddr;
        if ((data.hasOwnProperty("minterAddr") && data.minterAddr != "")
            || (data.hasOwnProperty("minterAddrTemp") && await isContractExists(data.minterAddrTemp))) {
            minterAddr = data.hasOwnProperty("minterAddr") ? data.minterAddr : data.minterAddrTemp;
            console.log("minterAddr: ", minterAddr);
        } else {
            minterAddr = await getFutureAddr(1);

            if (!data.hasOwnProperty("minterAddrTemp")) {
                data.minterAddrTemp = minterAddr;
                writeData(data);
            }
        }

        let stone;
        if (data.hasOwnProperty("stoneAddr") && data.stoneAddr != "") {
            stone = await Stone.at(data.stoneAddr);
            console.log("stone: ", stone.address);
        } else {
            stone = await Stone.new(data.minterAddrTemp, layerZeroEndpoint, BigNumber(10000).times(1e18).toString(10));
            console.log("stone: ", stone.address);

            data.stoneAddr = stone.address;
            writeData(data);
        }

        let stoneVaultAddr;
        if ((data.hasOwnProperty("stoneVaultAddr") && data.stoneVaultAddr != "")
            || (data.hasOwnProperty("stoneVaultAddrTemp") && await isContractExists(data.stoneVaultAddrTemp))) {
            stoneVaultAddr = data.hasOwnProperty("stoneVaultAddr") ? data.stoneVaultAddr : data.stoneVaultAddrTemp;
        } else {
            stoneVaultAddr = await getFutureAddr(1);

            if (!data.hasOwnProperty("stoneVaultAddrTemp")) {
                data.stoneVaultAddrTemp = stoneVaultAddr;
                writeData(data);
            }
        }

        let minter;
        if ((data.hasOwnProperty("minterAddr") && data.minterAddr != "")
            || (data.hasOwnProperty("minterAddrTemp") && await isContractExists(data.minterAddrTemp))) {
            minterAddr = data.hasOwnProperty("minterAddr") ? data.minterAddr : data.minterAddrTemp;
            minter = await Minter.at(minterAddr);
        } else {
            minter = await Minter.new(data.stoneAddr, data.stoneVaultAddrTemp);
            console.log("minter: ", minter.address);

            data.minterAddr = minter.address;
            writeData(data);
        }

        let proposalAddr;
        if ((data.hasOwnProperty("proposalAddr") && data.proposalAddr != "")
            || (data.hasOwnProperty("proposalAddrTemp") && await isContractExists(data.proposalAddrTemp))) {
            proposalAddr = data.hasOwnProperty("proposalAddr") ? data.proposalAddr : data.proposalAddrTemp;
        } else {
            proposalAddr = await getFutureAddr(1);

            if (!data.hasOwnProperty("proposalAddrTemp")) {
                data.proposalAddrTemp = proposalAddr;
                writeData(data);
            }
        }

        let assetsVaultAddr;
        if ((data.hasOwnProperty("assetsVaultAddr") && data.assetsVaultAddr != "")
            || (data.hasOwnProperty("assetsVaultAddrTemp") && await isContractExists(data.assetsVaultAddrTemp))) {
            assetsVaultAddr = data.hasOwnProperty("assetsVaultAddr") ? data.assetsVaultAddr : data.assetsVaultAddrTemp;
        } else {
            assetsVaultAddr = await getFutureAddr(2);

            if (!data.hasOwnProperty("assetsVaultAddrTemp")) {
                data.assetsVaultAddrTemp = assetsVaultAddr;
                writeData(data);
            }
        }

        let stETHHoldingStrategyAddr;
        if ((data.hasOwnProperty("stETHHoldingStrategyAddr") && data.stETHHoldingStrategyAddr != "")
            || (data.hasOwnProperty("stETHHoldingStrategyAddrTemp") && await isContractExists(data.stETHHoldingStrategyAddrTemp))) {
            stETHHoldingStrategyAddr = data.hasOwnProperty("stETHHoldingStrategyAddr") ? data.stETHHoldingStrategyAddr : data.stETHHoldingStrategyAddrTemp;
        } else {
            stETHHoldingStrategyAddr = await getFutureAddr(3);

            if (!data.hasOwnProperty("stETHHoldingStrategyAddrTemp")) {
                data.stETHHoldingStrategyAddrTemp = stETHHoldingStrategyAddr;
                writeData(data);
            }
        }

        let rETHHoldingStrategyAddr;
        if ((data.hasOwnProperty("rETHHoldingStrategyAddr") && data.rETHHoldingStrategyAddr != "")
            || (data.hasOwnProperty("rETHHoldingStrategyAddrTemp") && await isContractExists(data.rETHHoldingStrategyAddrTemp))) {
            rETHHoldingStrategyAddr = data.hasOwnProperty("rETHHoldingStrategyAddr") ? data.rETHHoldingStrategyAddr : data.rETHHoldingStrategyAddrTemp;
        } else {
            rETHHoldingStrategyAddr = await getFutureAddr(4);

            if (!data.hasOwnProperty("rETHHoldingStrategyAddrTemp")) {
                data.rETHHoldingStrategyAddrTemp = rETHHoldingStrategyAddr;
                writeData(data);
            }
        }

        let sFraxETHHoldingStrategyAddr;
        if ((data.hasOwnProperty("sFraxETHHoldingStrategyAddr") && data.sFraxETHHoldingStrategyAddr != "")
            || (data.hasOwnProperty("sFraxETHHoldingStrategyAddrTemp") && await isContractExists(data.sFraxETHHoldingStrategyAddrTemp))) {
            sFraxETHHoldingStrategyAddr = data.hasOwnProperty("sFraxETHHoldingStrategyAddr") ? data.sFraxETHHoldingStrategyAddr : data.sFraxETHHoldingStrategyAddrTemp;
        } else {
            sFraxETHHoldingStrategyAddr = await getFutureAddr(5);

            if (!data.hasOwnProperty("sFraxETHHoldingStrategyAddrTemp")) {
                data.sFraxETHHoldingStrategyAddrTemp = sFraxETHHoldingStrategyAddr;
                writeData(data);
            }
        }

        let rETHBalancerAuraStrategyAddr;
        if ((data.hasOwnProperty("rETHBalancerAuraStrategyAddr") && data.rETHBalancerAuraStrategyAddr != "")
            || (data.hasOwnProperty("rETHBalancerAuraStrategyAddrTemp") && await isContractExists(data.rETHBalancerAuraStrategyAddrTemp))) {
            rETHBalancerAuraStrategyAddr = data.hasOwnProperty("rETHBalancerAuraStrategyAddr") ? data.rETHBalancerAuraStrategyAddr : data.rETHBalancerAuraStrategyAddrTemp;
        } else {
            rETHBalancerAuraStrategyAddr = await getFutureAddr(6);

            if (!data.hasOwnProperty("rETHBalancerAuraStrategyAddrTemp")) {
                data.rETHBalancerAuraStrategyAddrTemp = rETHBalancerAuraStrategyAddr;
                writeData(data);
            }
        }

        let stoneVault;
        if ((data.hasOwnProperty("stoneVaultAddr") && data.stoneVaultAddr != "")
            || (data.hasOwnProperty("stoneVaultAddrTemp") && await isContractExists(data.stoneVaultAddrTemp))) {
            stoneVaultAddr = data.hasOwnProperty("stoneVaultAddr") ? data.stoneVaultAddr : data.stoneVaultAddrTemp;
            stoneVault = await StoneVault.at(stoneVaultAddr);
            console.log("stoneVault: ", stoneVault.address);
        } else {
            stoneVault = await StoneVault.new(
                minter.address,
                data.proposalAddrTemp,
                data.assetsVaultAddrTemp,
                [
                    data.stETHHoldingStrategyAddrTemp,
                    data.rETHHoldingStrategyAddrTemp,
                    data.sFraxETHHoldingStrategyAddrTemp,
                    data.rETHBalancerAuraStrategyAddrTemp
                ],
                [
                    50000,
                    0,
                    400000,
                    550000
                ]
            );
            console.log("stoneVault: ", stoneVault.address);

            data.stoneVaultAddr = stoneVault.address;
            writeData(data);
        }

        let proposal;
        if ((data.hasOwnProperty("proposalAddr") && data.proposalAddr != "")
            || (data.hasOwnProperty("proposalAddrTemp") && await isContractExists(data.proposalAddrTemp))) {
            proposalAddr = data.hasOwnProperty("proposalAddr") ? data.proposalAddr : data.proposalAddrTemp;
            proposal = await Proposal.at(proposalAddr);
            console.log("proposal: ", proposal.address);
        } else {
            proposal = await Proposal.new(stoneVault.address);
            console.log("proposal: ", proposal.address);

            data.proposalAddr = proposal.address;
            writeData(data);
        }

        const strategyControllerAddr = await stoneVault.strategyController();
        console.log("strategyController: ", strategyControllerAddr);

        data.strategyControllerAddr = strategyControllerAddr;
        fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
            JSON.stringify(data, null, 4),
            {
                flag: 'w'
            },
        )

        let assetsVault;
        if ((data.hasOwnProperty("assetsVaultAddr") && data.assetsVaultAddr != "")
            || (data.hasOwnProperty("assetsVaultAddrTemp") && await isContractExists(data.assetsVaultAddrTemp))) {
            assetsVaultAddr = data.hasOwnProperty("assetsVaultAddr") ? data.proposalAddr : data.assetsVaultAddrTemp;
            assetsVault = await AssetsVault.at(assetsVaultAddr);
            console.log("assetsVault: ", assetsVault.address);
        } else {
            assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
            console.log("assetsVault: ", assetsVault.address);

            data.assetsVaultAddr = assetsVault.address;
            writeData(data);
        }

        let stETHHoldingStrategy;
        if ((data.hasOwnProperty("stETHHoldingStrategyAddr") && data.stETHHoldingStrategyAddr != "")
            || (data.hasOwnProperty("stETHHoldingStrategyAddrTemp") && await isContractExists(data.stETHHoldingStrategyAddrTemp))) {
            stETHHoldingStrategyAddr = data.hasOwnProperty("stETHHoldingStrategyAddr") ? data.stETHHoldingStrategyAddr : data.stETHHoldingStrategyAddrTemp;
            stETHHoldingStrategy = await STETHHoldingStrategy.at(stETHHoldingStrategyAddr);
            console.log("stETHHoldingStrategy: ", stETHHoldingStrategy.address);
        } else {
            stETHHoldingStrategy = await STETHHoldingStrategy.new(
                strategyControllerAddr,
                "Lido Staked Ether(stETH)",
                stETHAddr,
                lidoWithdrawalQueueAddr,
                swappingAggregatorAddr
            );
            console.log("stETHHoldingStrategy: ", stETHHoldingStrategy.address);

            data.stETHHoldingStrategyAddr = stETHHoldingStrategy.address;
            writeData(data);
        }

        let rETHHoldingStrategy;
        if ((data.hasOwnProperty("rETHHoldingStrategyAddr") && data.rETHHoldingStrategyAddr != "")
            || (data.hasOwnProperty("rETHHoldingStrategyAddrTemp") && await isContractExists(data.rETHHoldingStrategyAddrTemp))) {
            rETHHoldingStrategyAddr = data.hasOwnProperty("rETHHoldingStrategyAddr") ? data.rETHHoldingStrategyAddr : data.rETHHoldingStrategyAddrTemp;
            rETHHoldingStrategy = await RETHHoldingStrategy.at(rETHHoldingStrategyAddr);
            console.log("rETHHoldingStrategy: ", rETHHoldingStrategy.address);
        } else {
            rETHHoldingStrategy = await RETHHoldingStrategy.new(
                strategyControllerAddr,
                swappingAggregatorAddr,
                "Rocket Pool ETH(rETH)",
            );
            console.log("rETHHoldingStrategy: ", rETHHoldingStrategy.address);

            data.rETHHoldingStrategyAddr = rETHHoldingStrategy.address;
            writeData(data);
        }

        let sFraxETHHoldingStrategy;
        if ((data.hasOwnProperty("sFraxETHHoldingStrategyAddr") && data.sFraxETHHoldingStrategyAddr != "")
            || (data.hasOwnProperty("sFraxETHHoldingStrategyAddrTemp") && await isContractExists(data.sFraxETHHoldingStrategyAddrTemp))) {
            sFraxETHHoldingStrategyAddr = data.hasOwnProperty("sFraxETHHoldingStrategyAddr") ? data.sFraxETHHoldingStrategyAddr : data.sFraxETHHoldingStrategyAddrTemp;
            sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.at(sFraxETHHoldingStrategyAddr);
            console.log("sFraxETHHoldingStrategy: ", sFraxETHHoldingStrategy.address);
        } else {
            sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.new(
                strategyControllerAddr,
                swappingAggregatorAddr,
                "Staked Frax Ether(sfrxETH)",
            );
            console.log("sFraxETHHoldingStrategy: ", sFraxETHHoldingStrategy.address);

            data.sFraxETHHoldingStrategyAddr = sFraxETHHoldingStrategy.address;
            writeData(data);
        }

        let rETHBalancerAuraStrategy;
        if ((data.hasOwnProperty("rETHBalancerAuraStrategyAddr") && data.rETHBalancerAuraStrategyAddr != "")
            || (data.hasOwnProperty("rETHBalancerAuraStrategyAddrTemp") && await isContractExists(data.rETHBalancerAuraStrategyAddrTemp))) {
            rETHBalancerAuraStrategyAddr = data.hasOwnProperty("rETHBalancerAuraStrategyAddr") ? data.rETHBalancerAuraStrategyAddr : data.rETHBalancerAuraStrategyAddrTemp;
            rETHBalancerAuraStrategy = await RETHBalancerAuraStrategy.at(rETHBalancerAuraStrategyAddr);
            console.log("RETHBalancerAuraStrategy: ", rETHBalancerAuraStrategy.address);
        } else {
            rETHBalancerAuraStrategy = await RETHBalancerAuraStrategy.new(
                strategyControllerAddr,
                swappingAggregatorAddr,
                "rBalancer(Aura) rETH-WETH ",
            );
            console.log("RETHBalancerAuraStrategy: ", rETHBalancerAuraStrategy.address);

            data.rETHBalancerAuraStrategyAddr = rETHBalancerAuraStrategy.address;
            writeData(data);
        }

        let miningPoolAddr;
        let miningPool;
        if (data.hasOwnProperty("miningPoolAddr") && data.miningPoolAddr != "") {
            miningPoolAddr = data.miningPoolAddr;
            miningPool = await MiningPool.at(miningPoolAddr);
            console.log("MiningPool: ", miningPool.address);
        } else {
            miningPool = await MiningPool.new(28 * 24 * 60 * 60);
            console.log("MiningPool: ", miningPool.address);

            data.miningPoolAddr = miningPool.address;
            writeData(data);
        }

        let stoneAdapterAddr;
        let stoneAdapter;
        if (data.hasOwnProperty("stoneAdapterAddr") && data.stoneAdapterAddr != "") {
            stoneAdapterAddr = data.stoneAdapterAddr;
            stoneAdapter = await StoneAdapter.at(stoneAdapterAddr);
            console.log("StoneAdapter: ", stoneAdapter.address);
        } else {
            stoneAdapter = await StoneAdapter.new();
            console.log("StoneAdapter: ", stoneAdapter.address);

            data.stoneAdapterAddr = stoneAdapter.address;
            writeData(data);
        }

        let stoneNFTAddr;
        let stoneNFT;
        if (data.hasOwnProperty("stoneNFTAddr") && data.stoneNFTAddr != "") {
            stoneNFTAddr = data.stoneNFTAddr;
            stoneNFT = await StoneNFT.at(stoneNFTAddr);
            console.log("StoneNFT: ", stoneNFT.address);
        } else {
            stoneNFT = await StoneNFT.new(data.miningPoolAddr);
            console.log("StoneNFT: ", stoneNFT.address);

            data.stoneNFTAddr = stoneNFT.address;
            writeData(data);
        }

        await miningPool.setSupportedTokens(
            [stone.address],
            [stoneAdapter.address],
            [true]
        );

        await miningPool.setNFT(stoneNFT.address);

        await rETHHoldingStrategy.setRouter(true, true);

        callback();
    } catch (e) {
        callback(e);
    }

    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const rs = web3.utils.sha3(encoded);
        return '0x' + rs.substr(rs.length - 40, 40);
    }

    async function isContractExists(address) {
        const rs = await web3.eth.getCode(address);

        if (rs != '0x') {
            return true;
        } else {
            return false;
        }

    }

    function writeData(data) {
        fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
            JSON.stringify(data, null, 4),
            {
                flag: 'w'
            },
        )
    }
}