// truffle compile
// truffle exec scripts/depositAndWithdraw.js --network test
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const StoneVault = artifacts.require("StoneVault");
const deployer = "0xc772FAf13E8fC346e7b1678F5f2084F884c56F92"
const Stone = artifacts.require("Stone");
const taker1 = "0xa9B3cBcF3668e819bd35ba308dECb640DF143394";

module.exports = async function (callback) {
    try {
        // const assetsVaultAddress = "";
        const vault = "0x19d2b3c75d249fb38dfab17c7aa2326351b64d4b";
        const stoneVault = await StoneVault.at(vault);
        const st = "0x1Aff5cd754f271b80b7598d4aA77a4F16363c515";
        const stone = await Stone.at(st);
        await stone.approve(stoneVault.address, BigNumber(100000).times(1e18), {
            from: taker1
        });
        await stoneVault.deposit({
            value: BigNumber(3e17),
            from: taker1
        });
        // let userStone = BigNumber(await stone.balanceOf(deployer));
        // console.log("userStone is : ", userStone.toString(10));

        // for (i = 0; i < 21; i++) {
        //     await stoneVault.requestWithdraw(BigNumber(1e13), {
        //         from: deployer
        //     });
        // }
        // userStone = BigNumber(await stone.balanceOf(deployer));
        // console.log("userStone1 is : ", userStone.toString(10));
        // await stoneVault.requestWithdraw(BigNumber(1e14), {
        //     from: deployer
        // });
        // console.log("user withdraw!");
        // const result = await stoneVault.rollToNextRound();
        // console.log("settlement finished!");
        // console.log("rollToNext transaction : ", result);

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