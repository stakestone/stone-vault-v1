const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");
const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const chai = require('chai');
const IStrategyManager = artifacts.require("IStrategyManager");
const IDelegationManager = artifacts.require("IDelegationManager");
const IEigenStrategy = artifacts.require("IEigenStrategy");
const IERC20 = artifacts.require("IERC20");
const IWithdrawalQueueERC721 = artifacts.require("IWithdrawalQueueERC721");
const ILidoWithdrawalQueue = artifacts.require("ILidoWithdrawalQueue");
const EigenStrategy = artifacts.require('EigenStrategy');
const EigenLSTRestaking = artifacts.require('strategies/eigen/EigenLSTRestaking');
const lidoWithdrawalQueueAddr = "0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50";
const stETHAddr = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";
const SwappingAggregator = artifacts.require("MockSwappingAggregator");
const controllerAddr = "0xAFbf909a63CD97B131d99F2d1898717A0ac236ce"; //eigenTest1
const withdrawalQueueERC721Addr = "0xFF72B5cdc701E9eE677966B2702c766c38F412a4";
const delegationManagerAddr = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
const eigenStrategyAddr = "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3"; //for stETH
const strategyManagerAddr = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";
const withdrawalQueueAccount = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034";
const bankAddr = "0x613670cC9D11e8cB6ea297bE7Cac08187400C936"; // testbuteigen
const assert = require('assert');

module.exports = async function (callback) {
    try {
        let stETH = await IERC20.at(stETHAddr);
        let eigenStrategy = await IEigenStrategy.at(eigenStrategyAddr);
        const strategyManager = await IStrategyManager.at(strategyManagerAddr);
        const delegationManager = await IDelegationManager.at(delegationManagerAddr);
        const withdrawalQueueERC721 = await IWithdrawalQueueERC721.at(lidoWithdrawalQueueAddr);
        const lidoWithdrawalQueue = await ILidoWithdrawalQueue.at(lidoWithdrawalQueueAddr);

        let account = await withdrawalQueueERC721.getRoleAdmin("0x485191a2ef18512555bd4426d18a716ce8e98c80ec2de16394dcf86d7d91bc80");
        console.log("account is : ", account);
        let withdrawalQueueAccountBalance = BigNumber(await web3.eth.getBalance(withdrawalQueueAccount));
        console.log("withdrawalQueueAccountBalance is : ", BigNumber(withdrawalQueueAccountBalance).toString(10));


        let account1 = await withdrawalQueueERC721.getRoleMember("0x485191a2ef18512555bd4426d18a716ce8e98c80ec2de16394dcf86d7d91bc80", BigNumber(0));
        console.log("account1 is : ", account1);

        await stETH.approve(strategyManager.address, MAX_UINT256);

        let swappingAggregator = await SwappingAggregator.new({ from: deployer });
        swappingAggregatorAddr = swappingAggregator.address;
        console.log("swappingAggregatorAddr is : ", swappingAggregatorAddr);

        await stETH.approve(swappingAggregatorAddr, BigNumber(100000).times(1e18), {
            from: bankAddr
        });
        await stETH.transfer(swappingAggregatorAddr, BigNumber(21).times(1e18), { from: bankAddr });
        let swappingAggregatorBalance_stETH = BigNumber(await stETH.balanceOf(swappingAggregatorAddr));
        console.log("swapAggre account stETH balance : ", swappingAggregatorBalance_stETH.toString());
        let swappingAggregatorBalance = BigNumber(await web3.eth.getBalance(swappingAggregatorAddr));
        console.log("swapAggre account balance: ", swappingAggregatorBalance.toString());

        const eigenLSTRestaking = await EigenLSTRestaking.new(controllerAddr, stETHAddr, lidoWithdrawalQueueAddr, strategyManagerAddr, delegationManagerAddr, eigenStrategyAddr, swappingAggregatorAddr, 'EigenLSTRestaking', { from: deployer });
        const eigenLSTRestakingAddr = eigenLSTRestaking.address;
        console.log("eigenLSTRestakingAddr is : ", eigenLSTRestakingAddr);
        await eigenLSTRestaking.setRouter(false, false, { from: deployer });

        const eth_deposit_amount = BigNumber(1).times(1e18);
        await eigenLSTRestaking.deposit({
            value: eth_deposit_amount,
            from: controllerAddr
        });
        console.log("deposit success");
        before_swapToToken_stEth = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("before swapToToken stETH balance : ", before_swapToToken_stEth.toString());
        await eigenLSTRestaking.swapToToken(eth_deposit_amount, { from: deployer });
        console.log("swapToToken success");
        swapToToken_stEth = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("after swapToToken stETH balance : ", swapToToken_stEth.toString());

        eigenETH_bef = await web3.eth.getBalance(eigenLSTRestakingAddr);
        console.log("eigenETH_bef balance : ", eigenETH_bef.toString());

        swapToToken_stEth = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("before swapToEther 1 stETH balance : ", swapToToken_stEth.toString());
        await eigenLSTRestaking.swapToEther(swapToToken_stEth, { from: deployer });
        swapToToken_stEth = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("after swapToEther 2 stETH balance : ", swapToToken_stEth.toString());

        last_finalized = await withdrawalQueueERC721.getLastFinalizedRequestId();
        last_requestid = await withdrawalQueueERC721.getLastRequestId();
        console.log("last_finalized is : ", BigNumber(last_finalized).toString(10));
        console.log("last_requestid is : ", BigNumber(last_requestid).toString(10));

        let quest = await withdrawalQueueERC721.prefinalize.call([BigNumber(2889)], BigNumber(1e18));
        console.log("ethToLock is : ", BigNumber(quest.ethToLock).toString(10));
        console.log("sharesToBurn is : ", BigNumber(quest.sharesToBurn).toString(10));

        eth_after_swapToToken = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        console.log("after swapToEther 2 eth account balance: ", eth_after_swapToToken.toString());
        let tx = await eigenLSTRestaking.checkPendingAssets.call();

        console.log("totalClaimable is : ", BigNumber(tx.totalClaimable).toString(10));
        console.log("totalPending is : ", BigNumber(tx.totalPending).toString(10));
        await withdrawalQueueERC721.finalize(BigNumber(last_requestid), BigNumber(1e18), { value: BigNumber(9e17), from: withdrawalQueueAccount });
        tx = await eigenLSTRestaking.checkPendingAssets.call();

        console.log("totalClaimable is : ", BigNumber(tx.totalClaimable).toString(10));
        console.log("totalPending is : ", BigNumber(tx.totalPending).toString(10));
        last_finalized = await withdrawalQueueERC721.getLastFinalizedRequestId();
        last_requestid = await withdrawalQueueERC721.getLastRequestId();
        console.log("last_finalized is : ", BigNumber(last_finalized).toString(10));
        console.log("last_requestid is : ", BigNumber(last_requestid).toString(10));
        await eigenLSTRestaking.claimAllPendingAssets({ from: deployer });
        swapToToken_stEth = BigNumber(await stETH.balanceOf(eigenLSTRestakingAddr));
        console.log("after swapToEther 3 stETH balance : ", swapToToken_stEth.toString());
        eth_after_swapToToken = BigNumber(await web3.eth.getBalance(eigenLSTRestakingAddr));
        console.log("after swapToEther 3 eth account balance: ", eth_after_swapToToken.toString());
        tx = await eigenLSTRestaking.checkPendingAssets.call();

        console.log("totalClaimable is : ", BigNumber(tx.totalClaimable).toString(10));
        console.log("totalPending is : ", BigNumber(tx.totalPending).toString(10));


        callback();
    } catch (e) {
        callback(e);
    }
}



