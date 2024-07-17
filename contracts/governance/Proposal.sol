// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {Minter} from "../token/Minter.sol";
import {StoneVault} from "../StoneVault.sol";

contract Proposal is AccessControlEnumerable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint256;

    address public immutable stoneToken;

    address public immutable stoneVault;

    bytes32 public constant PROPOSE_ROLE = keccak256("PROPOSE_ROLE");
    bytes32 public constant REVOKE_ROLE = keccak256("REVOKE_ROLE");
    bytes32 public constant EXECUTE_ROLE = keccak256("EXECUTE_ROLE");
    bytes32 public constant SET_PARAM_ROLE = keccak256("SET_PARAM_ROLE");

    uint256 public votePeriod = 7 * 24 * 60 * 60;

    uint256 public constant minVotePeriod = 24 * 60 * 60;
    uint256 public constant maxVotePeriod = 30 * 24 * 60 * 60;

    EnumerableSet.AddressSet private proposals;
    mapping(address => ProposalDetail) public proposalDetails;

    mapping(address => mapping(address => uint256)) public polls; // user => proposal => polls

    struct ProposalDetail {
        address proposer;
        uint256 deadline;
        uint256 support;
        uint256 oppose;
        uint256 executedTime;
        bool isRevoked;
        bytes data;
    }

    event VoteFor(address proposal, uint256 poll, bool flag);
    event RetrieveToken(address proposal, uint256 poll);
    event SetVotePeriod(uint256 period);
    event ProposalRevoked(address proposal);
    event ProposalExecuted(address proposal);
    event Invoked(address indexed targetAddress, bytes data);

    constructor(address payable _stoneVault) {
        stoneVault = _stoneVault;
        address minter = StoneVault(_stoneVault).minter();
        stoneToken = Minter(minter).stone();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function propose(bytes calldata _data) external onlyRole(PROPOSE_ROLE) {
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
            false,
            _data
        );
    }

    function revokeProposal(address _proposal) external onlyRole(REVOKE_ROLE) {
        ProposalDetail storage detail = proposalDetails[_proposal];

        detail.isRevoked = true;

        emit ProposalRevoked(_proposal);
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
        require(voteAmount != 0, "not vote");
        require(!canVote(_proposal), "proposal still active");

        polls[msg.sender][_proposal] = 0;

        TransferHelper.safeTransfer(stoneToken, msg.sender, voteAmount);

        emit RetrieveToken(_proposal, voteAmount);
    }

    function retrieveAllToken() external {
        uint256 withAmount;

        uint256 length = proposals.length();
        for (uint i; i < length; i++) {
            address addr = proposals.at(i);
            uint256 voteAmount = polls[msg.sender][addr];

            if (!canVote(addr) && voteAmount != 0) {
                polls[msg.sender][addr] = 0;
                withAmount = withAmount.add(voteAmount);

                emit RetrieveToken(addr, voteAmount);
            }
        }
        TransferHelper.safeTransfer(stoneToken, msg.sender, withAmount);
    }

    function execProposal(address _proposal) external onlyRole(EXECUTE_ROLE) {
        require(canExec(_proposal), "cannot exec");

        ProposalDetail storage detail = proposalDetails[_proposal];

        detail.executedTime = block.timestamp;

        invoke(detail.data);

        emit ProposalExecuted(_proposal);
    }

    function setVotePeriod(uint256 _period) external onlyRole(SET_PARAM_ROLE) {
        require(_period >= minVotePeriod, "too short for a proposal");
        require(_period <= maxVotePeriod, "too long for a proposal");

        votePeriod = _period;

        emit SetVotePeriod(_period);
    }

    function getProposal(uint256 _i) public view returns (address addr) {
        return proposals.at(_i);
    }

    function getProposals() public view returns (address[] memory addrs) {
        uint256 length = proposals.length();

        addrs = new address[](length);

        for (uint256 i; i < length; i++) {
            addrs[i] = proposals.at(i);
        }
    }

    function canVote(address _proposal) public view returns (bool result) {
        ProposalDetail memory detail = proposalDetails[_proposal];

        if (!proposals.contains(_proposal) || detail.isRevoked) {
            return false;
        }
        return block.timestamp < detail.deadline ? true : false;
    }

    function canExec(address _proposal) public view returns (bool result) {
        ProposalDetail memory detail = proposalDetails[_proposal];

        if (!proposals.contains(_proposal) || detail.isRevoked) {
            return false;
        }

        if (block.timestamp < detail.deadline) {
            return false;
        }
        if (detail.executedTime != 0) {
            return false;
        }

        return detail.support > detail.oppose;
    }

    function invoke(bytes memory data) internal returns (bytes memory result) {
        bool success;
        (success, result) = stoneVault.call{value: 0}(data);
        if (!success) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
        emit Invoked(stoneVault, data);
    }
}
