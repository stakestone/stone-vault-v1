// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@layerzerolabs/solidity-examples/contracts/token/oft/extension/BasedOFT.sol";

import {Minter} from "./Minter.sol";

contract Stone is BasedOFT {
    address public minter;

    uint16 public constant PT_FEED = 1;

    event FeedToChain(
        uint16 indexed dstChainId,
        address indexed from,
        bytes toAddress,
        uint price
    );

    constructor(
        address _minter,
        address _layerZeroEndpoint
    ) BasedOFT("Stone Liquidity Ether Token", "STONE", _layerZeroEndpoint) {
        minter = _minter;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "NM");
        _;
    }

    function mint(address _to, uint256 _amount) external onlyMinter {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyMinter {
        _burn(_from, _amount);
    }

    function updatePrice(
        uint16 _dstChainId,
        bytes memory _toAddress
    ) public payable returns (uint256 price) {
        price = tokenPrice();

        bytes memory lzPayload = abi.encode(
            PT_FEED,
            _toAddress,
            price,
            block.timestamp
        );

        _lzSend(
            _dstChainId,
            lzPayload,
            payable(msg.sender),
            address(0),
            bytes(""),
            msg.value
        );

        emit FeedToChain(_dstChainId, msg.sender, _toAddress, price);
    }

    function tokenPrice() public returns (uint256 price) {
        price = Minter(minter).getTokenPrice();
    }
}
