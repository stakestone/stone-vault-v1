// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@layerzerolabs/solidity-examples/contracts/token/oft/OFT.sol";

contract StoneCross is OFT {
    using BytesLib for bytes;

    uint16 public constant PT_FEED = 1;

    uint256 public tokenPrice;
    uint256 public updatedTime;

    constructor(
        address _layerZeroEndpoint
    ) OFT("Stone Liquidity Ether Token", "STONE", _layerZeroEndpoint) {}

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual override {
        uint16 packetType;
        assembly {
            packetType := mload(add(_payload, 32))
        }
        if (packetType == PT_SEND) {
            _sendAck(_srcChainId, _srcAddress, _nonce, _payload);
        } else if (packetType == PT_FEED) {
            (, bytes memory toAddressBytes, uint256 price, uint256 time) = abi
                .decode(_payload, (uint16, bytes, uint256, uint256));

            address to = toAddressBytes.toAddress(0);
            require(to == address(this), "not this contract");
            require(time > updatedTime, "stale price");

            tokenPrice = price;
            updatedTime = time;
        } else {
            revert("unknown packet type");
        }
    }
}
