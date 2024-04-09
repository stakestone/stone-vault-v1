//node scripts/eigenlayer/10current_epoch.js 
const axios = require("axios");

const headers = {
  "content-type": "application/json",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTAyMjc1MzAsImlhdCI6MTcwNjg1MjQ2NiwiZGF0YSI6eyJjb21wb25lbnQiOiJ3ZWJzZXJ2aWNlIiwidXNhZ2UiOiJlaWdlbmxheWVyX3Jlc3Rha2luZyIsImVtYWlsIjoibHVveWhhbmcwMDNAaG90bWFpbC5jb20iLCJ1aWQiOiI0NzgzNDU5NCIsImdpZCI6IjU5NTA1ODcxIn19.oLXBkHNXhcAne-NrN1G_p9sSwAF1CfXx5FFVG0rpYas",
};

const unstakeInfo = async () => {
  try {
    const response = await axios.get(
      "https://cloud.infpools.io/backend/safe_stake/current_epoch",
      { headers }
    );
    return response;
  } catch (err) {
    throw err;
  }
};

unstakeInfo()
  .then((res) => console.log("response", res.data)) // will return data object
  .catch((err) => console.log("err", err)); // err while fetching details
