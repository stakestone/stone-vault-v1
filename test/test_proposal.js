const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const RLP = require('rlp');
const Abi = web3.eth.abi;
const truffleAssert = require('truffle-assertions');
const Stone = artifacts.require("Stone");
const MockToken = artifacts.require("MockToken");
const Minter = artifacts.require("Minter");
const Proposal = artifacts.require("Proposal");
const AssetsVault = artifacts.require("AssetsVault");
const StoneVault = artifacts.require("StoneVault");
const StrategyController = artifacts.require("StrategyController");
const MockNullStrategy = artifacts.require("MockNullStrategy");
const withdrawFeeRate = 0;
const { expectRevert } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');

contract("test_proposal", async ([deployer, feeRecipient, taker1, taker2, proposer, revoker, executor, setRole]) => {

    const ONE_HUNDRED_PERCENT = 1e6;
    const MULTIPLIER = 1e18;
    const minDeposit = BigNumber(1).times(1e17);
    const DECIMALS = 1e18;

    async function getFutureAddr(index) {
        const nonce = await web3.eth.getTransactionCount(deployer);
        const encoded = RLP.encode([deployer, nonce + index]);
        const encodedBuffer = Buffer.from(encoded);
        const rs = web3.utils.sha3(encodedBuffer);
        return '0x' + rs.substr(rs.length - 40, 40);
    }

    let minter, assetsVaultAddr, mockNullStrategyAAddr, mockNullStrategyBAddr, stone, proposalAddr;
    let currentTime = Math.floor(Date.now() / 1000);

    beforeEach(async () => {
        const minterAddr = await getFutureAddr(1);
        console.log("minterAddr: ", minterAddr);
        const cap = BigNumber(10000e18);
        const layerzeroEndpoint = "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23";
        stone = await Stone.new(minterAddr, layerzeroEndpoint, cap);

        console.log("stone: ", stone.address);

        const stoneVaultAddr = await getFutureAddr(1);
        console.log("stoneVaultAddr: ", stoneVaultAddr);

        minter = await Minter.new(stone.address, stoneVaultAddr);
        console.log("minter: ", minter.address);

        assetsVaultAddr = await getFutureAddr(1);
        console.log("assetsVaultAddr: ", assetsVaultAddr);

        mockNullStrategyAAddr = await getFutureAddr(2);
        mockNullStrategyBAddr = await getFutureAddr(3);
        console.log("mockNullStrategyAAddr: ", mockNullStrategyAAddr);
        console.log("mockNullStrategyBAddr: ", mockNullStrategyBAddr);
        proposalAddr = await getFutureAddr(4);
        console.log("proposalAddr: ", proposalAddr);

    });

    it("test_proposal role", async () => {
        const stoneVault = await StoneVault.new(
            minter.address,
            proposalAddr,
            assetsVaultAddr,
            currentTime,
            [mockNullStrategyAAddr, mockNullStrategyBAddr],
            [5e5, 5e5]
        );
        console.log("stoneVault: ", stoneVault.address);

        const strategyControllerAddr = await stoneVault.strategyController();

        const assetsVault = await AssetsVault.new(stoneVault.address, strategyControllerAddr);
        console.log("assetsVault: ", assetsVault.address);

        const mockNullStrategyA = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy A");
        console.log("mockNullStrategyA: ", mockNullStrategyA.address);

        const mockNullStrategyB = await MockNullStrategy.new(strategyControllerAddr, "Mock Strategy B");
        console.log("mockNullStrategyB: ", mockNullStrategyB.address);

        let proposal = await Proposal.new(stoneVault.address);
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
            [[mockNullStrategyA.address, mockNullStrategyB.address], [7e5, 3e5]]
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
            [[mockNullStrategyA.address, mockNullStrategyB.address], [4e5, 6e5]]
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
            [[mockNullStrategyA.address, mockNullStrategyB.address], [3e5, 7e5]]
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
            [[mockNullStrategyA.address, mockNullStrategyB.address], [3e5, 7e5]]
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


    });

    function sleep(s) {
        return new Promise((resolve) => {
            setTimeout(resolve, s * 1000);
        });
    }

});