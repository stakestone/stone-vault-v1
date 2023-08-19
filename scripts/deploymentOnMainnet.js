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
const BalancerLPAuraStrategy = artifacts.require("BalancerLPAuraStrategy");

const SwappingAggregator = artifacts.require("SwappingAggregator");

const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";

const data = require("./mainnet.json");

module.exports = async function (callback) {
    try {
        const layerZeroEndpoint = "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675";
        const lidoWithdrawalQueueAddr = "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1";
        const wETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
        const stETHUniPool = "0x8f8eaaF88448ba31BdffF6aD8c42830c032C6392";
        const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
        const stETHSlippage = 999000;
        const stETHFee = 10000;

        const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
        const rETHUniPool = "0xa4e0faA58465A2D369aa21B3e42d43374c6F9613";
        const rETHCurvePool = "0x0f3159811670c117c372428d4e69ac32325e4d0f";
        const rETHSlippage = 999000;
        const rETHFee = 500;

        const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
        const frxETHUniPool = "0x8a15b2Dc9c4f295DCEbB0E7887DD25980088fDCB";
        const frxETHCurvePool = "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577";
        const frxETHSlippage = 999000;
        const frxETHFee = 500;

        let minterAddr;
        if (data.hasOwnProperty("minterAddr") && data.minterAddr != "") {
            minterAddr = data.minterAddr;
            console.log("minterAddr: ", minterAddr);
        } else {
            minterAddr = await getFutureAddr(1);
        }

        let stone;
        if (data.hasOwnProperty("stoneAddr") && data.stoneAddr != "") {
            stone = await Stone.at(data.stoneAddr);
            console.log("stone: ", stone.address);
        } else {
            stone = await Stone.new(minterAddr, layerZeroEndpoint);
            console.log("stone: ", stone.address);

            data.stoneAddr = stone.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let stoneVaultAddr;
        if (data.hasOwnProperty("stoneVaultAddr") && data.stoneVaultAddr != "") {
            stoneVaultAddr = data.stoneVaultAddr;
        } else {
            stoneVaultAddr = await getFutureAddr(1);
        }

        let minter;
        if (data.hasOwnProperty("minterAddr") && data.minterAddr != "") {
            minterAddr = data.minterAddr;
        } else {
            minter = await Minter.new(data.stoneAddr, stoneVaultAddr);
            console.log("minter: ", minter.address);

            data.minterAddr = minter.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let assetsVaultAddr;
        if (data.hasOwnProperty("assetsVaultAddr") && data.assetsVaultAddr != "") {
            assetsVaultAddr = data.assetsVaultAddr;
        } else {
            assetsVaultAddr = await getFutureAddr(2);
        }

        let stETHHoldingStrategyAddr;
        if (data.hasOwnProperty("stETHHoldingStrategyAddr") && data.stETHHoldingStrategyAddr != "") {
            stETHHoldingStrategyAddr = data.stETHHoldingStrategyAddr;
        } else {
            stETHHoldingStrategyAddr = await getFutureAddr(3);
        }

        let rETHHoldingStrategyAddr;
        if (data.hasOwnProperty("rETHHoldingStrategyAddr") && data.rETHHoldingStrategyAddr != "") {
            rETHHoldingStrategyAddr = data.rETHHoldingStrategyAddr;
        } else {
            rETHHoldingStrategyAddr = await getFutureAddr(4);
        }

        let sFraxETHHoldingStrategyAddr;
        if (data.hasOwnProperty("sFraxETHHoldingStrategyAddr") && data.sFraxETHHoldingStrategyAddr != "") {
            sFraxETHHoldingStrategyAddr = data.sFraxETHHoldingStrategyAddr;
        } else {
            sFraxETHHoldingStrategyAddr = await getFutureAddr(5);
        }

        let balancerLPAuraStrategyAddr;
        if (data.hasOwnProperty("balancerLPAuraStrategyAddr") && data.balancerLPAuraStrategyAddr != "") {
            balancerLPAuraStrategyAddr = data.balancerLPAuraStrategyAddr;
        } else {
            balancerLPAuraStrategyAddr = await getFutureAddr(6);
        }

        let proposalAddr;
        if (data.hasOwnProperty("proposalAddr") && data.proposalAddr != "") {
            proposalAddr = data.proposalAddr;
        } else {
            proposalAddr = await getFutureAddr(1);
        }

        let stoneVault;
        if (data.hasOwnProperty("stoneVaultAddr") && data.stoneVaultAddr != "") {
            stoneVaultAddr = data.stoneVaultAddr;
            stoneVault = await StoneVault.at(stoneVaultAddr);
            console.log("stoneVault: ", stoneVault.address);
        } else {
            stoneVault = await StoneVault.new(
                minter.address,
                proposalAddr,
                assetsVaultAddr,
                [stETHHoldingStrategyAddr, rETHHoldingStrategyAddr, sFraxETHHoldingStrategyAddr, balancerLPAuraStrategyAddr],
                [5e5, 3e5, 1e5, 1e5]
            );
            console.log("stoneVault: ", stoneVault.address);

            data.stoneVaultAddr = stoneVault.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let proposal;
        if (data.hasOwnProperty("proposalAddr") && data.proposalAddr != "") {
            proposalAddr = data.proposalAddr;
            proposal = await Proposal.at(proposalAddr);
            console.log("proposal: ", proposal.address);
        } else {
            proposal = await Proposal.new(stoneVault.address);
            console.log("proposal: ", proposal.address);

            data.proposalAddr = proposal.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        const strategyControllerAddr = await stoneVault.strategyController();
        console.log("strategyController: ", strategyControllerAddr);

        let assetsVault;
        if (data.hasOwnProperty("assetsVaultAddr") && data.assetsVaultAddr != "") {
            assetsVaultAddr = data.proposalAddr;
            assetsVault = await AssetsVault.at(assetsVaultAddr);
            console.log("assetsVault: ", assetsVault.address);
        } else {
            assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
            console.log("assetsVault: ", assetsVault.address);

            data.assetsVaultAddr = assetsVault.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let swappingAggregatorAddr;
        let swappingAggregator;
        if (data.hasOwnProperty("swappingAggregatorAddr") && data.swappingAggregatorAddr != "") {
            swappingAggregatorAddr = data.swappingAggregatorAddr;
            swappingAggregator = await SwappingAggregator.at(swappingAggregatorAddr);
            console.log("swappingAggregator: ", swappingAggregator.address);
        } else {
            swappingAggregator = await SwappingAggregator.new(
                wETHAddr,
                [stETHAddr, frxETHAddr],
                [stETHUniPool, frxETHUniPool],
                [stETHCurvePool, frxETHCurvePool],
                [stETHSlippage, frxETHSlippage],
                [stETHFee, frxETHFee]
            );
            console.log("swappingAggregator: ", swappingAggregator.address);

            data.swappingAggregatorAddr = swappingAggregator.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let stETHHoldingStrategy;
        if (data.hasOwnProperty("stETHHoldingStrategyAddr") && data.stETHHoldingStrategyAddr != "") {
            stETHHoldingStrategyAddr = data.stETHHoldingStrategyAddr;
            stETHHoldingStrategy = await STETHHoldingStrategy.at(stETHHoldingStrategyAddr);
            console.log("stETHHoldingStrategy: ", stETHHoldingStrategy.address);
        } else {
            stETHHoldingStrategy = await STETHHoldingStrategy.new(
                strategyControllerAddr,
                "stETH Holding Strategy",
                stETHAddr,
                lidoWithdrawalQueueAddr,
                swappingAggregatorAddr
            );
            console.log("assetsVault: ", assetsVault.address);

            data.stETHHoldingStrategyAddr = stETHHoldingStrategy.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let rETHHoldingStrategy;
        if (data.hasOwnProperty("rETHHoldingStrategyAddr") && data.rETHHoldingStrategyAddr != "") {
            rETHHoldingStrategyAddr = data.rETHHoldingStrategyAddr;
            rETHHoldingStrategy = await RETHHoldingStrategy.at(rETHHoldingStrategyAddr);
            console.log("rETHHoldingStrategy: ", rETHHoldingStrategy.address);
        } else {
            rETHHoldingStrategy = await RETHHoldingStrategy.new(
                strategyControllerAddr,
                "rETH Holding Strategy",
            );
            console.log("assetsVault: ", assetsVault.address);

            data.rETHHoldingStrategyAddr = rETHHoldingStrategy.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let sFraxETHHoldingStrategy;
        if (data.hasOwnProperty("sFraxETHHoldingStrategyAddr") && data.sFraxETHHoldingStrategyAddr != "") {
            sFraxETHHoldingStrategyAddr = data.sFraxETHHoldingStrategyAddr;
            sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.at(sFraxETHHoldingStrategyAddr);
            console.log("sFraxETHHoldingStrategy: ", sFraxETHHoldingStrategy.address);
        } else {
            sFraxETHHoldingStrategy = await SFraxETHHoldingStrategy.new(
                strategyControllerAddr,
                swappingAggregatorAddr,
                "sfrxETH Holding Strategy",
            );
            console.log("sFraxETHHoldingStrategy: ", sFraxETHHoldingStrategy.address);

            data.sFraxETHHoldingStrategyAddr = sFraxETHHoldingStrategy.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        let balancerLPAuraStrategy;
        if (data.hasOwnProperty("balancerLPAuraStrategyAddr") && data.balancerLPAuraStrategyAddr != "") {
            balancerLPAuraStrategyAddr = data.balancerLPAuraStrategyAddr;
            balancerLPAuraStrategy = await BalancerLPAuraStrategy.at(balancerLPAuraStrategyAddr);
            console.log("BalancerLPAuraStrategy: ", balancerLPAuraStrategy.address);
        } else {
            balancerLPAuraStrategy = await BalancerLPAuraStrategy.new(
                strategyControllerAddr,
                swappingAggregatorAddr,
                "Balancer Aura Strategy",
            );
            console.log("BalancerLPAuraStrategy: ", balancerLPAuraStrategy.address);

            data.balancerLPAuraStrategyAddr = balancerLPAuraStrategy.address;
            fs.writeFileSync(path.resolve(__dirname, './mainnet.json'),
                JSON.stringify(data, null, 4),
                {
                    flag: 'w'
                },
            )
        }

        console.log("stoneVault.deposit");
        await stoneVault.deposit({
            value: BigNumber(1e16).toString(10),
        });

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
}