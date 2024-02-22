const axios = require("axios");
const headers = {
  "content-type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTAyMjc1MzAsImlhdCI6MTcwNjg1MjQ2NiwiZGF0YSI6eyJjb21wb25lbnQiOiJ3ZWJzZXJ2aWNlIiwidXNhZ2UiOiJlaWdlbmxheWVyX3Jlc3Rha2luZyIsImVtYWlsIjoibHVveWhhbmcwMDNAaG90bWFpbC5jb20iLCJ1aWQiOiI0NzgzNDU5NCIsImdpZCI6IjU5NTA1ODcxIn19.oLXBkHNXhcAne-NrN1G_p9sSwAF1CfXx5FFVG0rpYas"
};
const accountAddress = '0x613670cC9D11e8cB6ea297bE7Cac08187400C936';
const urlLink = "https://cloud.infpools.io/backend/safe_stake/query";
// const graphqlQuery = {
//   "query": '{"query":"{\n get_asset(keywords:[\"0x613670cC9D11e8cB6ea297bE7Cac08187400C936\"], page:1, page_size:10, protocols:[\"ethereum\"], sort_field:\"protocol\", reverse:false) {\n        asset {\n        id\n        name\n        protocol\n        wallet\n        validator\n        claimable_reward\n        active_stake\n        total_stake\n        received_reward\n        total_reward\n        last_action_time\n        pending_stake\n        unstaking\n        unstaking_in_progress\n        unstaking_withdrawable\n        }\n    count\n    }\n}"}'
// };

nodeQuery = () => {
  const response = axios({
    url: urlLink,
    method: "post",
    headers: headers,
    data: { "query": "{\n get_asset(keywords:[\"0x613670cC9D11e8cB6ea297bE7Cac08187400C936\"], page:1, page_size:10, protocols:[\"ethereum\"], sort_field:\"protocol\", reverse:false) {\n        asset {\n        id\n        name\n        protocol\n        wallet\n        validator\n        claimable_reward\n        active_stake\n        total_stake\n        received_reward\n        total_reward\n        last_action_time\n        pending_stake\n        unstaking\n        unstaking_in_progress\n        unstaking_withdrawable\n        }\n    count\n    }\n}" }

  });
  return response;
};

nodeQuery()
  .then((res) => console.log("response", res.data.data.get_asset)) // will return data object
  .catch((err) => console.log("err", err)) // err while fetching details

