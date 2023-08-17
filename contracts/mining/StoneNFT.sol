// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract StoneNFT is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    address public miningPool;

    mapping(uint256 => NFTDetail) public propertiesById;

    struct NFTDetail {
        uint256 points;
        address minter;
        uint256 startTime;
        uint256 endTime;
    }

    constructor(address _pool) ERC721("Genesis NFT of StakeStone", "G-NFT") {
        miningPool = _pool;
        _tokenIdCounter.increment();
    }

    function mint(
        address _to,
        uint256 _points,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (uint256 tokenId) {
        require(msg.sender == miningPool, "not pool");

        tokenId = _tokenIdCounter.current();
        propertiesById[tokenId] = NFTDetail(_points, _to, _startTime, _endTime);
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
    }

    function setPool(address _pool) external onlyOwner {
        miningPool = _pool;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "Invalid Token ID");
        return
            string(
                abi.encodePacked(
                    "data:application/json,",
                    abi.encodePacked(
                        '{"name":"',
                        name(),
                        '", "description":"',
                        description(_tokenId),
                        '","image": "',
                        _baseURI(),
                        "/",
                        _tokenId.toString(),
                        '.png",',
                        '"properties": ',
                        properties(_tokenId),
                        "}"
                    )
                )
            );
    }

    function description(uint256 tokenId) internal view returns (bytes memory) {
        return
            abi.encodePacked(
                "Genesis NFT of StakeStone #",
                tokenId.toString(),
                "."
            );
    }

    function properties(uint256 _tokenId) internal view returns (bytes memory) {
        NFTDetail memory detail = propertiesById[_tokenId];

        bytes memory data = abi.encodePacked(
            '{"minter":"',
            addressToString(detail.minter),
            '","points":"',
            detail.points.toString(),
            '","startTime":"',
            detail.startTime.toString(),
            '","endTime":"',
            detail.endTime.toString(),
            '"}'
        );

        return data;
    }

    function getIdsByOwner(
        address _owner
    ) public view returns (uint256[] memory ids) {
        uint256 count = balanceOf(_owner);

        ids = new uint256[](count);

        for (uint i; i < count; i++) {
            ids[i] = tokenOfOwnerByIndex(_owner, i);
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://api.stakestone.io/api/nft";
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, 1);
    }

    function addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
