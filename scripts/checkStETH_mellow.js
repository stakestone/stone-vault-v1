const BigNumber = require('bignumber.js');
const MellowDepositWstETHStrategy = artifacts.require("MellowDepositWstETHStrategy");
const IERC20 = artifacts.require("IERC20");

module.exports = async function (callback) {
    try {
        const stETHAddr = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
        let stETH = await IERC20.at(stETHAddr);
        let mellowDepositWstETHStrategy = await MellowDepositWstETHStrategy.at("0xe9b7ccFc7d05028bD8214bd04F9B4fa7C734d574");

        // Fetch directly held stETH balance
        const stETHBalance = BigNumber(await stETH.balanceOf(stETHAddr));
        console.log(`stETH balance: ${web3.utils.fromWei(stETHBalance, 'ether')} stETH`);

        // Fetch stETH in Lido's withdrawal queue
        const pendingAssets = await mellowDepositWstETHStrategy.checkPendingAssets();
        console.log('Total claimable stETH:', web3.utils.fromWei(pendingAssets.totalClaimable.toString(), 'ether'));
        console.log('Total pending stETH:', web3.utils.fromWei(pendingAssets.totalPending.toString(), 'ether'));

        callback();
    } catch (error) {
        console.error('Error:', error);
        callback(error);
    }
};
