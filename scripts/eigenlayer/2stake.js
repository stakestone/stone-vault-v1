const axios = require("axios");

// const endpoint = "https://cloud.infpools.io/backend/safe_stake/ethereum/stake";
const headers = {
  "content-type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTAyMjc1MzAsImlhdCI6MTcwNjg1MjQ2NiwiZGF0YSI6eyJjb21wb25lbnQiOiJ3ZWJzZXJ2aWNlIiwidXNhZ2UiOiJlaWdlbmxheWVyX3Jlc3Rha2luZyIsImVtYWlsIjoibHVveWhhbmcwMDNAaG90bWFpbC5jb20iLCJ1aWQiOiI0NzgzNDU5NCIsImdpZCI6IjU5NTA1ODcxIn19.oLXBkHNXhcAne-NrN1G_p9sSwAF1CfXx5FFVG0rpYas"
};
const graphqlQuery = {
  operationName: "stakeETH",
  wallet: "0xAC5CC232D28257b30d79d3b26760499BD33bC978",
  payment_method: "credits",
  amount: "64",
  withdrawal_credentials: "0x98aBfc7119bfB048F8974Fa52656d9D73F497A33"
};
stakeETH = () => {
  const response = axios({
    url: "https://cloud.infpools.io/backend/safe_stake/ethereum/stake",
    method: "post",
    data: graphqlQuery,
    headers: headers
  });
  return response;
};

stakeETH()
  .then((res) => console.log("response", res.data)) // will return data object
  .catch((err) => console.log("err", err)) // err while fetching details


