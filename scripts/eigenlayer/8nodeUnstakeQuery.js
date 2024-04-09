//node scripts/eigenlayer/8nodeUnstakeQuery.js
const axios = require("axios");

const headers = {
  "content-type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTAyMjc1MzAsImlhdCI6MTcwNjg1MjQ2NiwiZGF0YSI6eyJjb21wb25lbnQiOiJ3ZWJzZXJ2aWNlIiwidXNhZ2UiOiJlaWdlbmxheWVyX3Jlc3Rha2luZyIsImVtYWlsIjoibHVveWhhbmcwMDNAaG90bWFpbC5jb20iLCJ1aWQiOiI0NzgzNDU5NCIsImdpZCI6IjU5NTA1ODcxIn19.oLXBkHNXhcAne-NrN1G_p9sSwAF1CfXx5FFVG0rpYas"
};
const graphqlQuery = {
  "query": `{get_ethereum_validators(wallet:"0x0dad1afea01f04fddc58d93c8fce4ee9540a30b0", statuses:["active_ongoing"]) {
     ethereum_validator {
     activity_id
     validator
     wallet
     status
     balance
     effective_balance
     withdrawal_credentials
     slashed
     activation_eligibility_epoch
     activation_epoch
     exit_epoch
     withdrawable_epoch
     asset_id
     name
     stake_time
  }
  count
  }
}`
};

const unstakeInfo = async () => {
  try {
    const response = await axios.post(
      "https://cloud.infpools.io/backend/safe_stake/query",
      graphqlQuery,
      { headers }
    );
    return response.data;
  } catch (err) {
    throw err;
  }
};

unstakeInfo()
  .then((res) => console.log("response", res.data.get_ethereum_validators.ethereum_validator)) // will return data object
  .catch((err) => console.log("err", err)) // err while fetching details

