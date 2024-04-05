const StoneCarnival = artifacts.require("BTCL2StakeStoneCarnival");
const MockToken = artifacts.require("MockToken");
const BigNumber = require('bignumber.js');

contract("test BTC carnival", async ([deployer, user1, user2, user3]) => {

    let bTCL2StakeStoneCarnival, BTCAddr, minAllowed;

    beforeEach(async () => {
        minAllowed = new BigNumber(25e14);

        // 部署MockToken合约
        const TOKENS = {
            "name": "BTCToken",
            "symbol": "BTC",
            "supply": "1000000000000000000000000000000",
        }
        const mockToken = await MockToken.new(TOKENS.name, TOKENS.symbol);

        // 向不同账户分发测试代币
        await mockToken.mint(deployer, TOKENS.supply / 4);
        await mockToken.mint(user1, TOKENS.supply / 4);
        await mockToken.mint(user2, TOKENS.supply / 4);
        await mockToken.mint(user3, TOKENS.supply / 4);

        BTCAddr = mockToken.address;
    });

    it("test1_deposit BTC", async () => {
        // 部署BTCL2StakeStoneCarnival合约
        bTCL2StakeStoneCarnival = await StoneCarnival.new(BTCAddr, minAllowed);

        // 为用户授权代币转移
        await BTCAddr.approve(bTCL2StakeStoneCarnival.address, BigNumber(100000).times(1e18), { from: user1 });

        // 用户进行存款操作
        await bTCL2StakeStoneCarnival.deposit(minAllowed, { from: user1 });

        // 获取用户存款数量
        let user1_deposited_amount = await bTCL2StakeStoneCarnival.btcDeposited(user1);
        console.log("user1_deposited_amount is : ", user1_deposited_amount.toString(10));
    });
});
