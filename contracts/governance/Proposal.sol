// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {Minter} from "../token/Minter.sol";
import {StoneVault} from "../StoneVault.sol";

contract Proposal {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint256;

    address public immutable stoneToken;

    address public immutable stoneVault;

    address public proposer;

    uint256 public votePeriod = 7 * 24 * 60 * 60;

    EnumerableSet.AddressSet private proposals;
    mapping(address => ProposalDetail) public proposalDetails;

    mapping(address => mapping(address => uint256)) public polls; // user => proposal => polls

    struct ProposalDetail {
        address proposer;
        uint256 deadline;
        uint256 support;
        uint256 oppose;
        uint256 executedTime;
        bytes data;
    }

    event VoteFor(address proposal, uint256 poll, bool flag);
    event RetrieveToken(address proposal, uint256 poll);
    event SetProposer(address oldProposer, address newProposer);
    event SetVotePeriod(uint256 period);
    event Invoked(address indexed targetAddress, bytes data);

    modifier onlyProposer() {
        require(proposer == msg.sender, "not proposer");
        _;
    }

    constructor(address payable _stoneVault) {
        proposer = msg.sender;
        stoneVault = _stoneVault;
        address minter = StoneVault(_stoneVault).minter();
        stoneToken = Minter(minter).stone();
    }

    function propose(bytes calldata _data) external onlyProposer {
        uint256 deadline = block.timestamp + votePeriod;

        bytes32 data = keccak256(abi.encodePacked(_data, deadline));
        address proposalAddr = address(uint160(bytes20(data)));

        require(!proposals.contains(proposalAddr), "proposal exists");
        proposals.add(proposalAddr);

        proposalDetails[proposalAddr] = ProposalDetail(
            msg.sender,
            deadline,
            0,
            0,
            0,
            _data
        );
    }

    function voteFor(address _proposal, uint256 _poll, bool _flag) external {
        require(canVote(_proposal), "cannot vote");

        TransferHelper.safeTransferFrom(
            stoneToken,
            msg.sender,
            address(this),
            _poll
        );

        ProposalDetail storage detail = proposalDetails[_proposal];
        if (_flag) {
            detail.support = detail.support.add(_poll);
        } else {
            detail.oppose = detail.oppose.add(_poll);
        }

        polls[msg.sender][_proposal] = polls[msg.sender][_proposal].add(_poll);

        emit VoteFor(_proposal, _poll, _flag);
    }

    function retrieveTokenFor(address _proposal) external {
        uint256 voteAmount = polls[msg.sender][_proposal];
        require(voteAmount > 0, "not vote");
        require(!canVote(_proposal), "proposal still active");

        polls[msg.sender][_proposal] = 0;

        TransferHelper.safeTransfer(stoneToken, msg.sender, voteAmount);

        emit RetrieveToken(_proposal, voteAmount);
    }

    function retrieveAllToken() external {
        uint256 withAmount;
        for (uint i = 0; i < proposals.length(); i++) {
            address addr = proposals.at(i);
            uint256 voteAmount = polls[msg.sender][addr];

            polls[msg.sender][addr] = 0;

            if (!canVote(addr) && voteAmount > 0) {
                withAmount = withAmount.add(voteAmount);

                emit RetrieveToken(addr, voteAmount);
            }
        }
        TransferHelper.safeTransfer(stoneToken, msg.sender, withAmount);
    }

    function execProposal(address _proposal) external {
        require(canExec(_proposal), "cannot exec");

        ProposalDetail storage detail = proposalDetails[_proposal];

        invoke(stoneVault, detail.data);

        detail.executedTime = block.timestamp;
    }

    function setProposer(address _proposer) external onlyProposer {
        emit SetProposer(proposer, _proposer);

        proposer = _proposer;
    }

    function setVotePeriod(uint256 _period) external onlyProposer {
        votePeriod = _period;

        emit SetVotePeriod(_period);
    }

    function getProposal(uint256 _i) public view returns (address addr) {
        return proposals.at(_i);
    }

    function getProposals() public view returns (address[] memory addrs) {
        uint256 length = proposals.length();

        addrs = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            addrs[i] = proposals.at(i);
        }
    }

    function canVote(address _proposal) public view returns (bool result) {
        if (!proposals.contains(_proposal)) {
            return false;
        }
        ProposalDetail memory detail = proposalDetails[_proposal];
        return block.timestamp < detail.deadline ? true : false;
    }

    function canExec(address _proposal) public view returns (bool result) {
        if (!proposals.contains(_proposal)) {
            return false;
        }

        ProposalDetail memory detail = proposalDetails[_proposal];
        if (block.timestamp < detail.deadline) {
            return false;
        }
        if (detail.executedTime > 0) {
            return false;
        }

        return detail.support > detail.oppose ? true : false;
    }

    function invoke(
        address target,
        bytes memory data
    ) internal returns (bytes memory result) {
        bool success;
        (success, result) = target.call{value: 0}(data);
        if (!success) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        emit Invoked(target, data);
    }
}
