//truffle exec scripts/event.js --network test

// const stETHAddr = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
// const stETHUniPool = "0x8f8eaaF88448ba31BdffF6aD8c42830c032C6392";
// const stETHCurvePool = "0xdc24316b9ae028f1497c275eb9192a3ea0f67022";
// const stETHSlippage = 995000;
// const stETHFee = 10000;

// const rETHAddr = "0xae78736Cd615f374D3085123A210448E74Fc6393";
// const rETHUniPool = "0xa4e0faA58465A2D369aa21B3e42d43374c6F9613";
// const rETHCurvePool = "0x0f3159811670c117c372428d4e69ac32325e4d0f";
// const rETHSlippage = 995000;
// const rETHFee = 500;

// const frxETHAddr = "0x5E8422345238F34275888049021821E8E08CAa1f";
// const frxETHUniPool = "0x8a15b2Dc9c4f295DCEbB0E7887DD25980088fDCB";
// const frxETHCurvePool = "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577";
// const frxETHSlippage = 995000;
// const frxETHFee = 500;
//logs里应该有个address字段，去匹配下那几个dex的pool，如果匹配到了说明就是在dex交易的

module.exports = async function (callback) {
    try {
        let logs = (await web3.eth.getTransactionReceipt("0xf739d26f2711433b96278fd284112eee5516d16fa1ef70800529c6ca493b06d0")).logs;
        // for (var i = 0; i < logs.length; i++) {
        //     console.log(logs[i]);
        // }
        console.log(logs);
        callback();


    } catch (e) {
        callback(e);
    }
}

