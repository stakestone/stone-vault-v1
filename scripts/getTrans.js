//nodejs执行

const createClient = require('@layerzerolabs/scan-client');

async function getTxStatus() {
    const { messages } = await createClient.getMessagesBySrcTxHash(
        10121,
        '0x42fcdcd2f8e20c5c8b40f94ceb640f91bb6018f9204a123645be65354319cbe2',
    );

    console.log(messages);

    // createClient.waitForMessageReceived(10121, '0xe7fd622cc8d53555faef05faaebb3cd623ed146aa4339b902960a1db7834a259')
    //     .then((message) => {
    //         console.log(message);

    //     }).finally(() => {
    //         // updateBalances();
    //     });
}

getTxStatus();