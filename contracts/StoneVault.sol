// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {Minter} from "./token/Minter.sol";
import {Stone} from "./token/Stone.sol";
import {AssetsVault} from "./AssetsVault.sol";
import {StrategyController} from "./strategies/StrategyController.sol";

import {VaultMath} from "./libraries/VaultMath.sol";

contract StoneVault is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    uint256 internal constant MULTIPLIER = 1e18;
    uint256 internal constant ONE_HUNDRED_PERCENT = 1e6;
    uint256 internal constant MAXMIUM_FEE_RATE = ONE_HUNDRED_PERCENT / 100; // 1%

    uint256 public constant VERSION = 1;

    address public immutable minter;
    address public immutable stone;
    address public immutable proposal;
    address payable public immutable strategyController;
    address payable public immutable assetsVault;

    address public feeRecipient;

    uint256 public latestRoundID;

    uint256 public withdrawableAmountInPast;
    uint256 public withdrawingSharesInPast;
    uint256 public withdrawingSharesInRound;

    uint256 public withdrawFeeRate;

    uint256 public rebaseTime;

    mapping(uint256 => uint256) public roundPricePerShare;
    mapping(uint256 => uint256) public settlementTime;

    mapping(address => UserReceipt) public userReceipts;

    struct UserReceipt {
        uint256 withdrawRound;
        uint256 withdrawShares;
        uint256 withdrawableAmount;
    }

    event Deposit(
        address indexed account,
        uint256 amount,
        uint256 mint,
        uint256 round
    );
    event InitiateWithdraw(
        address indexed account,
        uint256 shares,
        uint256 round
    );
    event CancelWithdraw(
        address indexed account,
        uint256 amount,
        uint256 round
    );
    event Withdrawn(address indexed account, uint256 amount, uint256 round);
    event WithdrawnFromStrategy(
        address indexed account,
        uint256 amount,
        uint256 actualAmount,
        uint256 round
    );
    event RollToNextRound(
        uint256 round,
        uint256 vaultIn,
        uint256 vaultOut,
        uint256 sharePrice
    );
    event FeeCharged(address indexed account, uint256 amount);
    event SetWithdrawFeeRate(uint256 oldRate, uint256 newRate);
    event SetFeeRecipient(address oldAddr, address newAddr);

    modifier onlyProposal() {
        require(proposal == msg.sender, "not proposal");
        _;
    }

    constructor(
        address _minter,
        address _proposal,
        address payable _assetsVault,
        address[] memory _strategies,
        uint256[] memory _ratios
    ) {
        minter = _minter;
        proposal = _proposal;
        assetsVault = _assetsVault;

        feeRecipient = msg.sender;

        StrategyController controller = new StrategyController(
            _assetsVault,
            _strategies,
            _ratios
        );
        strategyController = payable(address(controller));
        stone = Minter(_minter).stone();

        roundPricePerShare[0] = MULTIPLIER;
        latestRoundID = 0;
    }

    function deposit()
        external
        payable
        nonReentrant
        returns (uint256 mintAmount)
    {
        mintAmount = _depositFor(msg.value, msg.sender);
    }

    function depositFor(
        uint256 _amount,
        address _user
    ) external payable nonReentrant returns (uint256 mintAmount) {
        mintAmount = _depositFor(_amount, _user);
    }

    function _depositFor(
        uint256 _amount,
        address _user
    ) internal returns (uint256 mintAmount) {
        require(_amount > 0, "too small");

        uint256 sharePrice;
        if (latestRoundID == 0) {
            sharePrice = MULTIPLIER;
        } else {
            sharePrice = roundPricePerShare[latestRoundID - 1] >
                currentSharePrice()
                ? roundPricePerShare[latestRoundID - 1]
                : currentSharePrice();
        }

        mintAmount = _amount.mul(sharePrice).div(MULTIPLIER);

        AssetsVault(assetsVault).deposit{value: address(this).balance}();
        Minter(minter).mint(_user, mintAmount);

        emit Deposit(_user, _amount, mintAmount, latestRoundID);
    }

    function requestWithdraw(uint256 _shares) external nonReentrant {
        require(_shares > 0, "too small");
        require(latestRoundID > 0, "should withdraw instantly");
        Stone stoneToken = Stone(stone);
        Minter stoneMinter = Minter(minter);

        require(stoneToken.balanceOf(msg.sender) >= _shares, "exceed balance");

        TransferHelper.safeTransferFrom(
            stone,
            msg.sender,
            address(this),
            _shares
        );

        withdrawingSharesInRound = withdrawingSharesInRound.add(_shares);

        UserReceipt storage receipt = userReceipts[msg.sender];

        if (receipt.withdrawRound == latestRoundID) {
            receipt.withdrawShares = receipt.withdrawShares.add(_shares);
        } else if (receipt.withdrawRound == 0) {
            receipt.withdrawShares = _shares;
            receipt.withdrawRound = latestRoundID;
        } else {
            // Withdraw previous round share first
            uint256 withdrawAmount = VaultMath.sharesToAsset(
                receipt.withdrawShares,
                roundPricePerShare[receipt.withdrawRound]
            );

            stoneMinter.burn(address(this), receipt.withdrawShares);
            withdrawingSharesInPast = withdrawingSharesInPast.sub(
                receipt.withdrawShares
            );

            receipt.withdrawShares = _shares;
            receipt.withdrawableAmount = receipt.withdrawableAmount.add(
                withdrawAmount
            );
            receipt.withdrawRound = latestRoundID;
        }

        emit InitiateWithdraw(msg.sender, _shares, latestRoundID);
    }

    function cancelWithdraw(uint256 _shares) external nonReentrant {
        require(_shares > 0, "too small");

        UserReceipt storage receipt = userReceipts[msg.sender];
        require(receipt.withdrawRound == latestRoundID, "no pending withdraw");
        require(receipt.withdrawShares >= _shares, "exceed pending withdraw");

        receipt.withdrawShares = receipt.withdrawShares.sub(_shares);

        TransferHelper.safeTransfer(stone, msg.sender, _shares);

        if (receipt.withdrawShares == 0) {
            receipt.withdrawRound = 0;
        }

        withdrawingSharesInRound = withdrawingSharesInRound.sub(_shares);

        emit CancelWithdraw(msg.sender, _shares, latestRoundID);
    }

    function instantWithdraw(
        uint256 _amount,
        uint256 _shares
    ) external nonReentrant returns (uint256 actualWithdrawn) {
        require(_amount > 0 || _shares > 0, "too small");

        AssetsVault aVault = AssetsVault(assetsVault);
        Minter stoneMinter = Minter(minter);

        (uint256 idleAmount, ) = getVaultAvailableAmount();

        if (_amount > 0) {
            require(_amount >= idleAmount, "still need wait");

            UserReceipt storage receipt = userReceipts[msg.sender];

            if (
                receipt.withdrawRound != latestRoundID &&
                receipt.withdrawRound != 0
            ) {
                // Withdraw previous round share first
                uint256 withdrawAmount = VaultMath.sharesToAsset(
                    receipt.withdrawShares,
                    roundPricePerShare[receipt.withdrawRound]
                );

                stoneMinter.burn(address(this), receipt.withdrawShares);

                withdrawingSharesInPast = withdrawingSharesInPast.sub(
                    receipt.withdrawShares
                );
                receipt.withdrawShares = 0;
                receipt.withdrawableAmount = receipt.withdrawableAmount.add(
                    withdrawAmount
                );
                receipt.withdrawRound = 0;
            }

            require(
                receipt.withdrawableAmount >= _amount,
                "exceed withdrawable"
            );

            receipt.withdrawableAmount = receipt.withdrawableAmount.sub(
                _amount
            );
            withdrawableAmountInPast = withdrawableAmountInPast.sub(_amount);
            actualWithdrawn = _amount;
            idleAmount = idleAmount.sub(_amount);

            emit Withdrawn(msg.sender, _amount, latestRoundID);
        }

        if (_shares > 0) {
            uint256 sharePrice;
            if (latestRoundID == 0) {
                sharePrice = MULTIPLIER;
            } else {
                sharePrice = roundPricePerShare[latestRoundID] <
                    currentSharePrice()
                    ? roundPricePerShare[latestRoundID]
                    : currentSharePrice();
            }

            uint256 ethAmount = VaultMath.sharesToAsset(_shares, sharePrice);

            stoneMinter.burn(msg.sender, _shares);

            if (ethAmount <= idleAmount) {
                actualWithdrawn = actualWithdrawn.add(ethAmount);

                emit Withdrawn(msg.sender, ethAmount, latestRoundID);
            } else {
                actualWithdrawn = actualWithdrawn.add(idleAmount);
                ethAmount = ethAmount.sub(idleAmount);

                StrategyController controller = StrategyController(
                    strategyController
                );
                uint256 actualAmount = controller.forceWithdraw(ethAmount);

                actualWithdrawn = actualWithdrawn.add(actualAmount);

                emit WithdrawnFromStrategy(
                    msg.sender,
                    ethAmount,
                    actualAmount,
                    latestRoundID
                );
            }
        }

        if (withdrawFeeRate > 0) {
            uint256 withFee = actualWithdrawn.mul(withdrawFeeRate).div(
                ONE_HUNDRED_PERCENT
            );
            aVault.withdraw(feeRecipient, withFee);
            aVault.withdraw(msg.sender, actualWithdrawn.sub(withFee));

            emit FeeCharged(msg.sender, withFee);
        }
    }

    function rollToNextRound() external {
        StrategyController controller = StrategyController(strategyController);
        AssetsVault aVault = AssetsVault(assetsVault);

        uint256 vaultBalance = aVault.getBalance();
        uint256 amountToWithdraw = VaultMath.sharesToAsset(
            withdrawingSharesInRound,
            currentSharePrice()
        );
        uint256 amountVaultNeed = withdrawableAmountInPast.add(
            amountToWithdraw
        );

        uint256 vaultIn;
        uint256 vaultOut;

        if (vaultBalance > amountVaultNeed) {
            vaultIn = vaultBalance.sub(amountVaultNeed);
        }

        if (vaultBalance < amountVaultNeed) {
            vaultOut = amountVaultNeed.sub(vaultBalance);
        }

        controller.rebaseStrategies(vaultIn, vaultOut);
        uint256 newSharePrice = currentSharePrice();
        roundPricePerShare[latestRoundID] = newSharePrice;
        settlementTime[latestRoundID] = block.timestamp;
        latestRoundID = latestRoundID + 1;

        withdrawingSharesInPast = withdrawingSharesInPast.add(
            withdrawingSharesInRound
        );
        withdrawableAmountInPast = withdrawableAmountInPast.add(
            VaultMath.sharesToAsset(withdrawingSharesInRound, newSharePrice)
        );
        withdrawingSharesInRound = 0;
        rebaseTime = block.timestamp;

        emit RollToNextRound(latestRoundID, vaultIn, vaultOut, newSharePrice);
    }

    function addStrategy(address _strategy) external onlyProposal {
        StrategyController controller = StrategyController(strategyController);

        controller.addStrategy(_strategy);
    }

    function updatePortfolioConfig(
        address[] memory _strategies,
        uint256[] memory _ratios
    ) external onlyProposal {
        StrategyController controller = StrategyController(strategyController);

        controller.setStrategies(_strategies, _ratios);
    }

    function currentSharePrice() public view returns (uint256 price) {
        Stone stoneToken = Stone(stone);
        uint256 totalStone = stoneToken.totalSupply();
        if (totalStone == 0 || totalStone == withdrawingSharesInPast) {
            return MULTIPLIER;
        }

        uint256 etherAmount = AssetsVault(assetsVault)
            .getBalance()
            .add(StrategyController(strategyController).getAllStrategiesValue())
            .sub(withdrawableAmountInPast);
        uint256 activeShare = totalStone.sub(withdrawingSharesInPast);

        return etherAmount.mul(MULTIPLIER).div(activeShare);
    }

    function getVaultAvailableAmount()
        public
        view
        returns (uint256 idleAmount, uint256 investedAmount)
    {
        AssetsVault vault = AssetsVault(assetsVault);

        if (vault.getBalance() > withdrawableAmountInPast) {
            idleAmount = vault.getBalance().sub(withdrawableAmountInPast);
        }

        investedAmount = StrategyController(strategyController)
            .getAllStrategyValidValue();
    }

    function setWithdrawFeeRate(uint256 _withdrawFeeRate) external onlyOwner {
        require(_withdrawFeeRate <= MAXMIUM_FEE_RATE, "exceed maximum");

        emit SetWithdrawFeeRate(withdrawFeeRate, _withdrawFeeRate);

        withdrawFeeRate = _withdrawFeeRate;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "zero address");

        emit SetFeeRecipient(feeRecipient, _feeRecipient);

        feeRecipient = _feeRecipient;
    }
}
