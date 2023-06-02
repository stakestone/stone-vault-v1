// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

library VaultMath {
    uint256 internal constant DECIMALS = 18;
    uint256 internal constant MULTIPLIER = 1e18;
    uint256 internal constant PERCENTAGE = 1e6;
    uint256 internal constant DAYS_IN_YEAR = 365;
    uint256 internal constant SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

    function assetToShares(
        uint256 _assetAmount,
        uint256 _assetPerShare
    ) internal pure returns (uint256) {
        require(_assetPerShare > 1, "Vault Lib: invalid assetPerShare");
        return (_assetAmount * (10 ** DECIMALS)) / _assetPerShare;
    }

    function sharesToAsset(
        uint256 _shares,
        uint256 _assetPerShare
    ) internal pure returns (uint256) {
        require(_assetPerShare > 1, "Vault Lib: invalid assetPerShare");
        return (_shares * _assetPerShare) / (10 ** DECIMALS);
    }
}
