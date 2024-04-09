
// eslint-disable-next-line no-undef
const BigNumber = require('bignumber.js');

module.exports = async function (callback) {
    try {
        fetch('https://api.binance.com/api/v3/avgPrice?symbol=BTCUSDT')
            .then(r => r.json()
                .then(j => console.log(parseFloat(j.price).toFixed(2))));
        callback();
    } catch (e) {
        callback(e);
    }
}
function sleep(s) {
    return new Promise((resolve) => {
        setTimeout(resolve, s * 1000);
    });
}