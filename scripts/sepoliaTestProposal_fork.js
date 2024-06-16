// truffle compile
// truffle exec scripts/sepoliaTestLockStone.js --network sepolia
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const taker1 = "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535";
const executor = "0xAC5CC232D28257b30d79d3b26760499BD33bC978";
const proposer = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";
const revoker = "0x0DaD1AFEa01F04FdDC58d93c8Fce4Ee9540A30b0";
const setRole = "0x469A8E672dE83ac391e39Aed724a59BF8DEbfB4a";
const deployer = "0xff34F282b82489BfDa789816d7622d3Ae8199Af6";
const { time } = require("@openzeppelin/test-helpers");
const Stone = artifacts.require("Stone");
const MULTIPLIER = 1e18;
const { expectRevert } = require('@openzeppelin/test-helpers');
const assert = require('assert');
const Abi = web3.eth.abi;

const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");

const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");

module.exports = async function (callback) {
    try {
        const strategyControllerAddr = "0xfC119BE82d07382074C14f277498bCB2176e5Ea6";
        const strategyController = await StrategyController.at(strategyControllerAddr);
        // let strategies = await strategyController.getStrategies();
        // console.log("length is : ", strategies[0].length);

        // for (i = 0; i < strategies[0].length; i++) {
        //     console.log("strategy" + i + " is : ", strategies[0][i]);
        // }
        // console.log("strategyA's portion is : ", strategies[1][0].toString(10));
        // console.log("strategyB's portion is : ", strategies[1][1].toString(10));

        const strategyAAddr = "0xcf11e012C2bD8E5E20ab7A619Fc635b6b64e41aa";
        const strategyBAddr = "0x716d050515D7Ab43dfAcca81D2aDBf2F76591Cd4";

        const stoneVaultAddr = "0xfbbe4d65bd61b778161ed71ec9416988ee21e911"
        const stoneVault = await StoneVault.at(stoneVaultAddr);
        const stoneAddr = "0x0D26Efb8bb3122DEd52e814b4B428133Efc82272";
        const stone = await Stone.at(stoneAddr);
        // let price = await stoneVault.currentSharePrice.call();
        // console.log("current share price is : ", price.toString());

        const assetsVaultAddress = "0x940afc1c7b792f7afed70beb7fc40bc2d09bf916";
        const assetsVault = await AssetsVault.at(assetsVaultAddress);

        let proposal = await Proposal.new(stoneVaultAddr);
        console.log("proposal: ", proposal.address);
        await proposal.grantRole(await proposal.PROPOSE_ROLE(), proposer);
        await proposal.grantRole(await proposal.REVOKE_ROLE(), revoker);
        await proposal.grantRole(await proposal.EXECUTE_ROLE(), executor);
        await proposal.grantRole(await proposal.SET_PARAM_ROLE(), setRole);

        await stoneVault.deposit({
            value: BigNumber(1e15),
            from: taker1
        });
        let taker1_stone = BigNumber(await stone.balanceOf(taker1));
        console.log("taker1 stone : ", taker1_stone.toString(10));

        await sleep(2);
        await time.advanceBlock();

        await stoneVault.rollToNextRound({
            from: deployer
        });
        console.log("settlement finished!");

        await expectRevert.unspecified(proposal.setVotePeriod(1, {
            from: deployer
        }));
        let votePeriod = BigNumber(await proposal.votePeriod());
        console.log("cur votePeriod is : ", votePeriod.toString());
        let newVotePeriod = BigNumber(10);
        await proposal.setVotePeriod(newVotePeriod, { from: setRole });
        await sleep(2);
        await time.advanceBlock();
        await stoneVault.rollToNextRound({
            from: taker1
        });
        let changedVotePeriod = BigNumber(await proposal.votePeriod());
        console.log("changed votePeriod is : ", changedVotePeriod.toString());
        assert.strictEqual(changedVotePeriod.toString(), newVotePeriod.toString());
        // assert.notEqual(changedVotePeriod.toString(), votePeriod.toString())

        const fn1 = "updatePortfolioConfig(address[],uint256[])";
        const selector1 = Abi.encodeFunctionSignature(fn1);
        const encodedParams1 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[strategyAAddr, strategyBAddr], [7e5, 3e5]]
        );
        const data1 = `${selector1}${encodedParams1.split("0x")[1]}`
        console.log("data2: ", data1);
        await expectRevert.unspecified(proposal.propose(data1, {
            from: deployer
        }));
        await proposal.propose(data1, { from: proposer });

        proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);
        let proposalDetail = await proposal.proposalDetails(latestProposal);
        assert.strictEqual(proposalDetail.proposer, proposer);
        assert.strictEqual(proposalDetail.isRevoked, false);

        //revoke
        await expectRevert.unspecified(proposal.revokePeoposal(latestProposal, {
            from: deployer
        }));
        await proposal.revokePeoposal(latestProposal, { from: revoker });
        proposalDetail = await proposal.proposalDetails(latestProposal);
        assert.strictEqual(proposalDetail.isRevoked, true);
        // propose again
        const fn2 = "updatePortfolioConfig(address[],uint256[])";
        const selector2 = Abi.encodeFunctionSignature(fn2);
        const encodedParams2 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[strategyAAddr, strategyBAddr], [4e5, 6e5]]
        );
        const data2 = `${selector2}${encodedParams2.split("0x")[1]}`
        console.log("data2: ", data2);

        await proposal.propose(data2, { from: proposer });

        proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);

        // vote
        await stone.approve(proposal.address, BigNumber(1000).times(MULTIPLIER), {
            from: taker1
        });

        proposalDetail = await proposal.proposalDetails(latestProposal);
        console.log("is revoked? :", proposalDetail.isRevoked);
        console.log("deadline is :", BigNumber(proposalDetail.deadline));
        console.log("current block timestamp is :", BigNumber(await proposal.getBlockTimestamp()));

        await proposal.voteFor(latestProposal, BigNumber(1e13), true, {
            from: taker1
        })
        // revoke when it's votable
        await proposal.revokePeoposal(latestProposal, { from: revoker });
        proposalDetail = await proposal.proposalDetails(latestProposal);
        assert.strictEqual(proposalDetail.isRevoked, true);
        let canVote = await proposal.canVote(latestProposal);
        console.log("canVote or not : ", canVote);
        assert.strictEqual(canVote, false);
        // propose again
        const fn3 = "updatePortfolioConfig(address[],uint256[])";
        const selector3 = Abi.encodeFunctionSignature(fn3);
        const encodedParams3 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[strategyAAddr, strategyBAddr], [3e5, 7e5]]
        );
        const data3 = `${selector3}${encodedParams3.split("0x")[1]}`
        console.log("data3: ", data3);

        await proposal.propose(data3, { from: proposer });

        proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);
        await proposal.voteFor(latestProposal, BigNumber(1e13), true, {
            from: taker1
        })
        await sleep(newVotePeriod);
        await time.advanceBlock();
        await stoneVault.rollToNextRound({
            from: deployer
        });
        console.log("can vote?");
        canVote = await proposal.canVote(latestProposal);
        console.log("canVote or not : ", canVote);
        assert.strictEqual(canVote, false);
        let canExec = await proposal.canExec(latestProposal);
        console.log("canExec or not : ", canExec);
        assert.strictEqual(canExec, true);

        // revoke again when it's executable
        await proposal.revokePeoposal(latestProposal, { from: revoker });
        proposalDetail = await proposal.proposalDetails(latestProposal);
        assert.strictEqual(proposalDetail.isRevoked, true);
        canExec = await proposal.canExec(latestProposal);
        console.log("canExec or not : ", canExec);
        assert.strictEqual(canExec, false);

        // proposal again
        const fn4 = "updatePortfolioConfig(address[],uint256[])";
        const selector4 = Abi.encodeFunctionSignature(fn4);
        const encodedParams4 = Abi.encodeParameters(
            ["address[]", "uint256[]"],
            [[strategyAAddr, strategyBAddr], [3e5, 7e5]]
        );
        const data4 = `${selector4}${encodedParams3.split("0x")[1]}`
        console.log("data4: ", data4);

        await proposal.propose(data4, { from: proposer });

        proposals = await proposal.getProposals();
        console.log("proposals are : ", proposals.toString(10));

        latestProposal = proposals[proposals.length - 1];
        console.log("latestProposal: ", latestProposal);
        await proposal.voteFor(latestProposal, BigNumber(1e13), true, {
            from: taker1
        })
        await sleep(newVotePeriod);
        await time.advanceBlock();
        await stoneVault.rollToNextRound({
            from: deployer
        });
        console.log("can vote?");
        canVote = await proposal.canVote(latestProposal);
        console.log("canVote or not : ", canVote);
        assert.strictEqual(canVote, false);
        canExec = await proposal.canExec(latestProposal);
        console.log("canExec or not : ", canExec);
        assert.strictEqual(canExec, true);

        await expectRevert.unspecified(proposal.execProposal(latestProposal, {
            from: deployer
        }));
        await proposal.execProposal(latestProposal, { from: executor });
        proposalDetail = await proposal.proposalDetails(latestProposal);
        assert.notEqual(proposalDetail.executedTime, 0);
        canExec = await proposal.canExec(latestProposal);
        console.log("canExec or not : ", canExec);
        assert.strictEqual(canExec, false);

        callback();

    } catch (e) {
        callback(e);
    }
    function sleep(s) {
        return new Promise((resolve) => {
            setTimeout(resolve, s * 1000);
        });
    }
}