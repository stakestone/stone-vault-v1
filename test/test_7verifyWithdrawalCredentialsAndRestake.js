//truffle exe test/test_7verifyWithdrawalCredentialsAndRestake.js --network goerli
const axios = require("axios");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const EigenNativeRestakingStrategy = artifacts.require("EigenNativeRestakingStrategy");
const eigenNativeRestakingStrategyAddr = "0xcA31C24c4c4304bB48D761F8Adb099E1bDe21C48";
const Web3 = require('web3');

module.exports = async function (callback) {
    try {
        const eigenPodAddress = "0x4FA79bC58c927b95CEFfB53E679086A685ac187a";
        const response = await axios.get(`https://webserver.preprod.eigenops.xyz/api/v1/withdrawal-proofs/restake?eigenPodAddress=${eigenPodAddress}`);
        const responseData = response.data.verifyWithdrawalCredentialsCallParams;

        const eigenPod = web3.utils.toChecksumAddress(eigenPodAddress);
        const oracleTimestamp = responseData.oracleTimestamp;
        const stateRootProof = [
            responseData.stateRootProof.beaconStateRoot,
            responseData.stateRootProof.stateRootProof
        ];
        const validatorIndices = responseData.validatorIndices;
        const validatorFieldsProofs = responseData.validatorFieldsProofs;
        const validatorFields = responseData.validatorFields;
        console.log("eigenPod is", eigenPod);
        console.log("oracleTimestamp is", oracleTimestamp);
        console.log("stateRootProof is", stateRootProof);
        console.log("validatorIndices is", validatorIndices);
        console.log("validatorFieldsProofs is", validatorFieldsProofs);
        console.log("validatorFields is", validatorFields);

        const agenStrategy = await EigenNativeRestakingStrategy.at(eigenNativeRestakingStrategyAddr);
        await agenStrategy.verifyWithdrawalCredentials(eigenPod, oracleTimestamp, stateRootProof, validatorIndices, validatorFieldsProofs, validatorFields);
        callback();
    } catch (error) {
        console.error(error);
        callback(error);
    }
};