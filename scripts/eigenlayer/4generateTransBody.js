//node scripts/eigenlayer/4generateTransBody.js 
const axios = require("axios");
const headers = {
  "content-type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTAyMjc1MzAsImlhdCI6MTcwNjg1MjQ2NiwiZGF0YSI6eyJjb21wb25lbnQiOiJ3ZWJzZXJ2aWNlIiwidXNhZ2UiOiJlaWdlbmxheWVyX3Jlc3Rha2luZyIsImVtYWlsIjoibHVveWhhbmcwMDNAaG90bWFpbC5jb20iLCJ1aWQiOiI0NzgzNDU5NCIsImdpZCI6IjU5NTA1ODcxIn19.oLXBkHNXhcAne-NrN1G_p9sSwAF1CfXx5FFVG0rpYas"
};
const graphqlQuery = {
  "query": `{
    get_activity(id:"6f5d2b79-8d5a-4ba4-8c8f-ee76cf62e52f") {
     activity {
      wallet,
      amount,
      raw_tx,
      activity_status
    }
  }
   }`
};

stakeQuery = () => {
  const response = axios({
    url: "https://cloud.infpools.io/backend/safe_stake/query",
    method: "post",
    headers: headers,
    data: graphqlQuery
  });
  return response;
};

stakeQuery()
  .then((res) => console.log("response", res.data.data.get_activity)) // will return data object
  .catch((err) => console.log("err", err)) // err while fetching details

//"data":""