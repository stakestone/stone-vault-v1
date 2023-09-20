// truffle compile
// truffle exec scripts/depositAndWithdraw.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"
const Stone = artifacts.require("Stone");
const taker1 = "0x725B030882405f909fe2D6ab378543c39FF2C5c7";

module.exports = async function (callback) {
    try {
        const vault = "0xD682C2b9814FB096c843984Da9810916CB2206e0";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x9964C9a0F5c0Fd5E86Cf2d86765E0ae1eeCa680D";
        const stone = await Stone.at(st);
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: deployer
        });
        // await stoneVault.deposit({
        //     value: BigNumber(20e18),
        //     from: deployer
        // });
        for (i = 0; i < 21; i++) {
            await stoneVault.requestWithdraw(BigNumber(1e16), {
                from: deployer
            });
        }
        let userStone = BigNumber(await stone.balanceOf(deployer));
        console.log("userStone is : ", userStone.toString(10));
        // await stoneVault.requestWithdraw(BigNumber(10e18), {
        //     from: deployer
        // });
        console.log("user withdraw!");
        const result = await stoneVault.rollToNextRound();
        console.log("settlement finished!");
        console.log("rollToNext transaction : ", result);

        // await stoneVault.instantWithdraw(0, BigNumber(2e18), {
        //     from: deployer
        // });
        // console.log("instantWithdraw finished!");

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
        let assetsVaultAddress = "0x7f60E63e40e5065E5A48a77010169dE269fc8aB7";
        // assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        // console.log("assetsVault ether amount:", assetsVaultBalance.toString());
        ////send interest to vault
        // let interest = BigNumber(5e18);
        // await web3.eth.sendTransaction({
        //     from: deployer,
        //     to: assetsVaultAddress,
        //     value: interest.toString(10)
        // })
        assetsVaultBalance = await web3.eth.getBalance(assetsVaultAddress);
        console.log("assetsVault ether amount1:", assetsVaultBalance.toString());

        callback();
    } catch (e) {
        callback(e);
    }

}