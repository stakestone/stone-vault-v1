//node scripts/eigenlayer/12unstakeNode.js
const axios = require("axios");

const headers = {
  "content-type": "application/json",
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTAyMjc1MzAsImlhdCI6MTcwNjg1MjQ2NiwiZGF0YSI6eyJjb21wb25lbnQiOiJ3ZWJzZXJ2aWNlIiwidXNhZ2UiOiJlaWdlbmxheWVyX3Jlc3Rha2luZyIsImVtYWlsIjoibHVveWhhbmcwMDNAaG90bWFpbC5jb20iLCJ1aWQiOiI0NzgzNDU5NCIsImdpZCI6IjU5NTA1ODcxIn19.oLXBkHNXhcAne-NrN1G_p9sSwAF1CfXx5FFVG0rpYas"
};
const message = { validators: ["0x904f16827fc8c1592a6a1cd7b497d9873fd4bdfd579e4c805efbbb3a8776447213c6c9161d312eba94676572aadb2543"] };
const body = {
  wallet: "0x0dad1afea01f04fddc58d93c8fce4ee9540a30b0",
  amount: "32",
  data: {
    message: JSON.stringify(message),
    signature: "0x80257ee30fb98ba2b37f491bf21884007203cab504ec492a608db47804e8a62b665e24240de53021071493356540bf79bd723a1bc7a82e15eb8b8c7a1d4bd5be1b"
  }
};

console.log("body is : ", body);

const unstakeInfo = async () => {
  try {
    const response = await axios.post(
      "https://cloud.infpools.io/backend/safe_stake/ethereum/unstake",
      body,
      { headers }
    );
    return response;
  } catch (err) {
    throw err;
  }
};

unstakeInfo()
  .then((res) => console.log("response", res.data))
  .catch((err) => console.log("err", err));
