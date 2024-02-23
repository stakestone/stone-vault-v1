const { ZERO_ADDRESS, MAX_UINT256 } = require('@openzeppelin/test-helpers/src/constants');
const BigNumber = require('bignumber.js');
const RLP = require('rlp');
const Abi = web3.eth.abi;

const IERC20 = artifacts.require("IERC20");
const RETHBalancerAuraStrategy = artifacts.require("RETHBalancerAuraStrategy");

const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92";
const AURA_REWARD_POOL =
    "0xdd1fe5ad401d4777ce89959b7fa587e569bf125d";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

module.exports = async function (callback) {
    try {
        // await web3.eth.sendTransaction({
        //     from: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        //     to: deployer,
        //     value: BigNumber(1e19).toString(10)
        // });

        const rETHBalancerAuraStrategy = await RETHBalancerAuraStrategy.new(
            deployer,
            require("./mainnet.json").swappingAggregatorAddr,
            "rETH Balancer Aura Strategy",
        );
        console.log("RETHBalancerAuraStrategy: ", rETHBalancerAuraStrategy.address);

        const getOnchainLpPrice = await rETHBalancerAuraStrategy.getOnchainLpPrice();
        console.log("getOnchainLpPrice: ", BigNumber(getOnchainLpPrice).div(1e18).toString(10));

        await sleep(100);

        console.log("-- deposit --");
        await rETHBalancerAuraStrategy.deposit({
            value: BigNumber(1).times(1e18).toString(10)
        });


        // Check Balancer LP - test only
        let BalancerLPAddr = "0x1E19CF2D73a72Ef1332C882F20534B6519Be0276";
        let balancerLP = await IERC20.at(BalancerLPAddr);
        let balanceOfBalancerLP = await balancerLP.balanceOf(rETHBalancerAuraStrategy.address);
        console.log("balanceOfBalancerLP: ", BigNumber(balanceOfBalancerLP).div(1e18).toString(10));

        // Check Aura LP 
        const AuraLPAddr = "0xDd1fE5AD401D4777cE89959b7fa587e569Bf125D";
        const auraLP = await IERC20.at(AuraLPAddr);
        const balanceOfAuraLP = await auraLP.balanceOf(rETHBalancerAuraStrategy.address);
        console.log("balanceOfAuraLP: ", BigNumber(balanceOfAuraLP).div(1e18).toString(10));

        console.log("-- withdraw --");
        const balanceOfETH = await rETHBalancerAuraStrategy.withdraw.call(
            BigNumber(1).times(1e18).toString(10)
        );
        console.log("balanceOfETH: ", BigNumber(balanceOfETH).div(1e18).toString(10));

        await rETHBalancerAuraStrategy.withdraw(
            BigNumber(0.9).times(1e18).toString(10)
        );


        // Check Balancer LP - test only
        BalancerLPAddr = "0x1E19CF2D73a72Ef1332C882F20534B6519Be0276";
        balancerLP = await IERC20.at(BalancerLPAddr);
        balanceOfBalancerLP = await balancerLP.balanceOf(rETHBalancerAuraStrategy.address);
        console.log("balanceOfBalancerLP: ", BigNumber(balanceOfBalancerLP).div(1e18).toString(10));

        // Check WETH - test only
        let WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        let weth = await IERC20.at(WETHAddr);
        let balanceOfWEth = await weth.balanceOf(rETHBalancerAuraStrategy.address);
        console.log("balanceOfWEth: ", BigNumber(balanceOfWEth).div(1e18).toString(10));

        await rETHBalancerAuraStrategy.claimRewards();

        let BAL_TOKEN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        let bal = await IERC20.at(BAL_TOKEN);
        let balanceOfBAL = await bal.balanceOf(rETHBalancerAuraStrategy.address);
        console.log("balanceOfBAL: ", BigNumber(balanceOfBAL).div(1e18).toString(10));

        let AURA_TOKEN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        let aura = await IERC20.at(AURA_TOKEN);
        let balanceOfAURA = await aura.balanceOf(rETHBalancerAuraStrategy.address);
        console.log("balanceOfAURA: ", BigNumber(balanceOfAURA).div(1e18).toString(10));



        callback();
    } catch (e) {
        callback(e);
    }
}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}