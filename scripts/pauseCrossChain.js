// truffle compile
// truffle exec scripts/pauseCrossChain.js --network goerli
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');
const Stone = artifacts.require("Stone");

module.exports = async function (callback) {
    try {

        const stone = await Stone.at("0x18df04C3B4704aCa415246daD2441464593d38f4");
        // 10181
        const enable = false;
        await stone.setEnableFor(
            10181,
            enable,
            "0xCF8Db0995d34A4F9e77c1519E0FED96a91b46890",
            {
                value: BigNumber(1e17).toString(10)    //layzero gas fee
            }
        );
        console.log("switch to : ", enable);

        callback();
    } catch (e) {
        callback(e);
    }
}