const Account = artifacts.require("Account");
const EigenStrategy = artifacts.require("EigenStrategy"); // Assuming EigenStrategy is available

contract("test_account", async ([deployer, controller, taker]) => {
    let account;
    let owner;

    before(async () => {
        const strategy = await EigenStrategy.new(controller, "MyStrategy");
        account = await Account.new(deployer, { from: deployer });
    });

    it("deploys successfully", async () => {
        assert.ok(account.address, "Account contract not deployed");
    });

    it("reverts invoke with non-zero value and non-controller target", async () => {
        const target = web3.utils.toChecksumAddress(taker);
        const value = 10;

        try {
            await account.invoke(target, value, []);
            assert.fail("Expected revert");
        } catch (error) {
            assert.include(error.message, "not permit", "Reverted with expected reason");
        }
    });

    it(" invoke with non-zero value and controller target", async () => {
        const target = await strategy.controller();
        const value = 10;

        try {
            await account.invoke(target, value, []);
            // assert.fail("Expected revert");
        } catch (error) {
            assert.include(error.message, "not permit", "Reverted with expected reason");
        }
    });

}
);