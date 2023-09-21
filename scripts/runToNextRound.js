// truffle compile
// truffle exec scripts/runToNextRound.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");

module.exports = async function (callback) {
    try {
        const vault = "0xF97C478f34E1dBA7E399b973f4b720bA5885290b";
        const stoneVault = await StoneVault.at(vault);
        const result = await stoneVault.rollToNextRound();
        console.log("settlement finished!");
        console.log("rollToNext transaction : ", result);
        // let price0 = BigNumber(await stoneVault.roundPricePerShare(0));
        // console.log("0 round price is : ", price0.toString(10));
        // let settlementTime0 = BigNumber(await stoneVault.settlementTime(0));
        // console.log("settlementTime0 is : ", settlementTime0.toString(10));
        // let latestRoundID = BigNumber(await stoneVault.latestRoundID());
        // let latestPrice = BigNumber(await stoneVault.roundPricePerShare(latestRoundID.minus(BigNumber(1))));
        // console.log("latest round price is : ", latestPrice.toString(10));
        // let latestSettlementTime = BigNumber(await stoneVault.settlementTime(latestRoundID.minus(BigNumber(1))));
        // console.log("latestSettlementTime is : ", latestSettlementTime.toString(10));

        // let apy = latestPrice.minus(price0).div(latestSettlementTime.minus(settlementTime0)).times(BigNumber(31536000));
        // console.log("apy is : ", apy.toString(10));
        // let userReceipts = await stoneVault.userReceipts("0x725B030882405f909fe2D6ab378543c39FF2C5c7");
        // console.log("userRecipts withdrawRound is : ", BigNumber(userReceipts.withdrawRound).toString(10));
        // console.log("userRecipts withdrawShares is : ", BigNumber(userReceipts.withdrawShares).toString(10));
        // console.log("userRecipts withdrawableAmount is : ", BigNumber(userReceipts.withdrawableAmount).toString(10));
        //check asset vault balance
        // let assetsVaultAddress = "0xD682C2b9814FB096c843984Da9810916CB2206e0";
        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount:", assetsVaultBalance.toString());
        ////send interest to vault
        // let interest = BigNumber(5e18);
        // await web3.eth.sendTransaction({
        //     from: deployer,
        //     to: assetsVaultAddress,
        //     value: interest.toString(10)
        // })
        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount1:", assetsVaultBalance.toString());
        callback();
    } catch (e) {
        callback(e);
    }

}