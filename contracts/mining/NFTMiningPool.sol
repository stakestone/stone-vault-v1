// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {INonfungiblePositionManager} from "../interfaces/INonfungiblePositionManager.sol";
import {StoneNFT} from "./StoneNFT.sol";

contract NFTMiningPool is ReentrancyGuard, IERC721Receiver {
    address public immutable lp_token;

    address public immutable stone;
    address public immutable weth;

    mapping(address => uint256[]) public stakedLPs;
    mapping(uint256 => address) public ownedBy;

    mapping(address => uint256) public stakeTime;
    mapping(address => uint256) public updateTime;

    mapping(address => NFTDetail[]) public pendingNFT;

    uint256 public cycle;

    uint256 public terminateTime;

    address public nft;
    address public governance;

    struct NFTDetail {
        uint256 points;
        uint256 startTime;
        uint256 endTime;
    }

    modifier onlyGovernance() {
        require(governance == msg.sender, "not governace");
        _;
    }

    event TransferGovernance(address oldAddr, address newAddr);
    event Terminated(uint256 time);
    event NFTStaked(address user, uint256 id);
    event NFTUnstaked(address user, uint256 id);

    constructor(
        uint256 _cycle,
        address _lp_token,
        address _stone,
        address _weth
    ) {
        governance = msg.sender;

        cycle = _cycle;
        lp_token = _lp_token;
        stone = _stone;
        weth = _weth;
    }

    function stake(uint256[] memory _ids) external {
        _stakeFor(msg.sender, _ids);
    }

    function stakeFor(address _user, uint256[] memory _ids) external {
        _stakeFor(_user, _ids);
    }

    function _stakeFor(
        address _user,
        uint256[] memory _ids
    ) internal nonReentrant {
        updateReward(_user, false);

        INonfungiblePositionManager lpNFT = INonfungiblePositionManager(
            lp_token
        );

        uint256 length = _ids.length;
        for (uint256 i; i < length; i++) {
            uint256 id = _ids[i];
            (, , address token0, address token1, , , , , , , , ) = lpNFT
                .positions(id);

            require(
                (token0 == stone && token1 == weth) ||
                    (token1 == stone && token0 == weth),
                "wrong lp"
            );
            lpNFT.safeTransferFrom(_user, address(this), id);
            ownedBy[id] = _user;
            stakedLPs[_user].push(id);

            emit NFTStaked(_user, id);
        }
    }

    function unstake(uint256[] memory _ids) external nonReentrant {
        updateReward(msg.sender, false);

        INonfungiblePositionManager lpNFT = INonfungiblePositionManager(
            lp_token
        );

        uint256 length = _ids.length;
        for (uint256 i; i < length; i++) {
            uint256 id = _ids[i];
            address owner = ownedBy[id];

            require(owner == msg.sender, "not owner");
            ownedBy[id] = address(0);

            for (uint256 j; j < stakedLPs[msg.sender].length; j++) {
                uint256 oid = stakedLPs[msg.sender][j];
                if (oid == id) {
                    stakedLPs[msg.sender][j] = 0;
                    break;
                }
            }

            lpNFT.transferFrom(address(this), msg.sender, id);

            emit NFTUnstaked(msg.sender, id);
        }

        refreshStakedLP(msg.sender);
    }

    function claim() external nonReentrant {
        require(nft != address(0), "invalid nft");

        updateReward(msg.sender, true);

        uint256 length = pendingNFT[msg.sender].length;

        require(length > 0, "no claimable");

        for (uint i; i < length; i++) {
            NFTDetail memory detail = pendingNFT[msg.sender][i];

            StoneNFT(nft).mint(msg.sender, 0, detail.startTime, detail.endTime);
        }

        delete pendingNFT[msg.sender];
    }

    function refreshStakedLP(address _user) public {
        uint256 j;
        uint256 length = stakedLPs[_user].length;

        uint256[] memory ids = new uint256[](length);
        for (uint256 i; i < length; i++) {
            uint256 id = stakedLPs[_user][i];
            if (id != 0) {
                ids[j++] = id;
            }
        }

        assembly {
            mstore(ids, j)
        }

        stakedLPs[_user] = ids;
    }

    function updateReward(address _user, bool _isClaim) internal {
        uint256 current = block.timestamp;
        if (terminateTime != 0) {
            current = terminateTime;
        }

        if (stakeTime[_user] == 0 && !_isClaim) {
            stakeTime[_user] = current;
            updateTime[_user] = current;
            return;
        }

        uint256 previous = stakeTime[_user];
        uint256 acc = (current - previous) / cycle;
        uint256 remainder = (current - previous) % cycle;

        if (acc > 0) {
            stakeTime[_user] = current - remainder;

            for (uint256 i; i < acc; i++) {
                uint256 points;

                pendingNFT[_user].push(
                    NFTDetail(
                        0,
                        stakeTime[_user] - (i + 1) * cycle,
                        stakeTime[_user] - (i * cycle)
                    )
                );
            }
        }

        updateTime[_user] = current;

        if (!checkPosition(_user)) {
            stakeTime[_user] = 0;
            updateTime[_user] = 0;
        }
    }

    function earned(address _user) public view returns (uint256 amount) {
        amount = pendingNFT[_user].length;

        uint256 previous = stakeTime[_user];

        if (previous != 0) {
            uint256 current = block.timestamp;
            if (terminateTime > 0) {
                current = terminateTime;
            }
            uint256 acc = (current - previous) / cycle;
            amount += acc;
        }
    }

    function getPendingNFTLength(
        address _user
    ) public view returns (uint256 amount) {
        amount = pendingNFT[_user].length;
    }

    function checkPosition(address _user) public view returns (bool) {
        return stakedLPs[_user].length > 0;
    }

    function getIdsByOwner(
        address _owner
    ) public view returns (uint256[] memory ids) {
        INonfungiblePositionManager lpNFT = INonfungiblePositionManager(
            lp_token
        );

        uint256 count = lpNFT.balanceOf(_owner);

        ids = new uint256[](count);

        for (uint i; i < count; i++) {
            ids[i] = lpNFT.tokenOfOwnerByIndex(_owner, i);
        }
    }

    function filterNFT(
        uint256[] memory _ids
    ) public view returns (uint256[] memory ids) {
        uint256 j;
        uint256 length = _ids.length;

        ids = new uint256[](length);

        INonfungiblePositionManager lpNFT = INonfungiblePositionManager(
            lp_token
        );
        for (uint256 i; i < length; i++) {
            uint256 id = _ids[i];
            (, , address token0, address token1, , , , , , , , ) = lpNFT
                .positions(id);
            if (
                (token0 == stone && token1 == weth) ||
                (token1 == stone && token0 == weth)
            ) {
                ids[j++] = id;
            }
        }

        assembly {
            mstore(ids, j)
        }
    }

    function getStakedLP(
        address _user
    ) external view returns (uint256[] memory ids) {
        uint256 length = stakedLPs[_user].length;

        ids = new uint256[](length);
        for (uint256 i; i < length; i++) {
            ids[i] = stakedLPs[_user][i];
        }
    }

    function setNFT(address _nft) external onlyGovernance {
        require(nft == address(0), "already set");

        nft = _nft;
    }

    function terminate(address _nft) external onlyGovernance {
        terminateTime = block.timestamp;

        emit Terminated(terminateTime);
    }

    function setNewGovernance(address _governance) external onlyGovernance {
        emit TransferGovernance(governance, _governance);

        governance = _governance;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
