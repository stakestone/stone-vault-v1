
const StoneFreezer = artifacts.require("StoneFreezer");
module.exports = async function (callback) {
    try {
        const stoneFreezer = await StoneFreezer.at(
            "0x64ee45Be2E1609b9829E82ADC9d92Bf00dF73d9d"
        );
        console.log("stoneFreezer: ", stoneFreezer.address);
        await stoneFreezer.acceptOwnership({ from: "0x72632D09C2d7Cd5009F3a8541F47803Ec4bAF535" });
        callback();
    } catch (e) {
        callback(e);
    }
}