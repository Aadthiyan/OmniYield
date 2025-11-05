const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldAggregator", function () {
  let yieldAggregator;
  let owner;
  let user1;
  let user2;
  let feeCollector;
  let mockToken;

  beforeEach(async function () {
    [owner, user1, user2, feeCollector] = await ethers.getSigners();

    // Deploy YieldAggregator
    const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
    yieldAggregator = await YieldAggregator.deploy(feeCollector.address);
    await yieldAggregator.waitForDeployment();

    // Deploy a mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Mint tokens to users
    await mockToken.mint(user1.address, ethers.parseEther("1000"));
    await mockToken.mint(user2.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await yieldAggregator.owner()).to.equal(owner.address);
    });

    it("Should set the right fee collector", async function () {
      expect(await yieldAggregator.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should initialize with zero strategies", async function () {
      expect(await yieldAggregator.totalStrategies()).to.equal(0);
    });

    it("Should initialize with zero totals", async function () {
      expect(await yieldAggregator.totalDeposited()).to.equal(0);
      expect(await yieldAggregator.totalWithdrawn()).to.equal(0);
    });
  });

  describe("Strategy Management", function () {
    it("Should add a new strategy", async function () {
      await yieldAggregator.addStrategy(
        mockToken.target,
        "Test Strategy",
        1000, // 10% performance fee
        200   // 2% management fee
      );

      expect(await yieldAggregator.totalStrategies()).to.equal(1);
      
      const strategy = await yieldAggregator.getStrategy(1);
      expect(strategy.strategyAddress).to.equal(mockToken.target);
      expect(strategy.name).to.equal("Test Strategy");
      expect(strategy.isActive).to.be.true;
      expect(strategy.performanceFee).to.equal(1000);
      expect(strategy.managementFee).to.equal(200);
    });

    it("Should not allow non-owner to add strategy", async function () {
      await expect(
        yieldAggregator.connect(user1).addStrategy(
          mockToken.target,
          "Test Strategy",
          1000,
          200
        )
      ).to.be.revertedWithCustomError(yieldAggregator, "OwnableUnauthorizedAccount");
    });

    it("Should update strategy status", async function () {
      await yieldAggregator.addStrategy(
        mockToken.target,
        "Test Strategy",
        1000,
        200
      );

      await yieldAggregator.updateStrategy(1, false);
      const strategy = await yieldAggregator.getStrategy(1);
      expect(strategy.isActive).to.be.false;
    });
  });

  describe("Deposits and Withdrawals", function () {
    beforeEach(async function () {
      // Add a strategy first
      await yieldAggregator.addStrategy(
        mockToken.target,
        "Test Strategy",
        1000,
        200
      );

      // Approve tokens
      await mockToken.connect(user1).approve(yieldAggregator.target, ethers.parseEther("100"));
    });

    it("Should allow deposits", async function () {
      const depositAmount = ethers.parseEther("10");
      
      await expect(yieldAggregator.connect(user1).deposit(1, depositAmount))
        .to.emit(yieldAggregator, "Deposit")
        .withArgs(user1.address, 1, depositAmount);

      expect(await yieldAggregator.totalDeposited()).to.equal(depositAmount);
      
      const userDeposits = await yieldAggregator.getUserDepositCount(user1.address);
      expect(userDeposits).to.equal(1);
    });

    it("Should not allow deposits to inactive strategies", async function () {
      await yieldAggregator.updateStrategy(1, false);
      
      await expect(
        yieldAggregator.connect(user1).deposit(1, ethers.parseEther("10"))
      ).to.be.revertedWith("Strategy is not active");
    });

    it("Should allow withdrawals", async function () {
      const depositAmount = ethers.parseEther("10");
      await yieldAggregator.connect(user1).deposit(1, depositAmount);

      const withdrawAmount = ethers.parseEther("5");
      
      await expect(yieldAggregator.connect(user1).withdraw(0, withdrawAmount))
        .to.emit(yieldAggregator, "Withdraw")
        .withArgs(user1.address, 1, withdrawAmount);

      expect(await yieldAggregator.totalWithdrawn()).to.equal(withdrawAmount);
    });

    it("Should not allow withdrawals exceeding deposit amount", async function () {
      const depositAmount = ethers.parseEther("10");
      await yieldAggregator.connect(user1).deposit(1, depositAmount);

      await expect(
        yieldAggregator.connect(user1).withdraw(0, ethers.parseEther("15"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Cross-Chain Transfers", function () {
    beforeEach(async function () {
      await mockToken.connect(user1).approve(yieldAggregator.target, ethers.parseEther("100"));
    });

    it("Should initiate cross-chain transfer", async function () {
      const transferAmount = ethers.parseEther("10");
      const targetChainId = 137; // Polygon

      await expect(
        yieldAggregator.connect(user1).initiateCrossChainTransfer(
          transferAmount,
          mockToken.target,
          targetChainId,
          ethers.ZeroAddress
        )
      ).to.emit(yieldAggregator, "CrossChainTransferInitiated");
    });

    it("Should complete cross-chain transfer", async function () {
      const transferAmount = ethers.parseEther("10");
      const targetChainId = 137;

      await yieldAggregator.connect(user1).initiateCrossChainTransfer(
        transferAmount,
        mockToken.target,
        targetChainId,
        ethers.ZeroAddress
      );

      // Get the transfer ID (in real implementation, this would be returned)
      const transferId = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "uint256", "address", "uint256", "uint256", "uint256"],
          [user1.address, transferAmount, mockToken.target, 31337, targetChainId, await ethers.provider.getBlock("latest").then(b => b.timestamp)]
        )
      );

      await expect(
        yieldAggregator.completeCrossChainTransfer(transferId, user2.address)
      ).to.emit(yieldAggregator, "CrossChainTransferCompleted");
    });
  });

  describe("Fee Management", function () {
    it("Should update fee rates", async function () {
      await yieldAggregator.updateFeeRates(3000, 300); // 30% performance, 3% management
      
      expect(await yieldAggregator.performanceFeeRate()).to.equal(3000);
      expect(await yieldAggregator.managementFeeRate()).to.equal(300);
    });

    it("Should not allow excessive fee rates", async function () {
      await expect(
        yieldAggregator.updateFeeRates(6000, 300) // 60% performance fee
      ).to.be.revertedWith("Performance fee too high");

      await expect(
        yieldAggregator.updateFeeRates(3000, 1100) // 11% management fee
      ).to.be.revertedWith("Management fee too high");
    });

    it("Should set new fee collector", async function () {
      await yieldAggregator.setFeeCollector(user1.address);
      expect(await yieldAggregator.feeCollector()).to.equal(user1.address);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause contract", async function () {
      await yieldAggregator.pause();
      expect(await yieldAggregator.paused()).to.be.true;

      await yieldAggregator.unpause();
      expect(await yieldAggregator.paused()).to.be.false;
    });

    it("Should not allow deposits when paused", async function () {
      await yieldAggregator.addStrategy(
        mockToken.target,
        "Test Strategy",
        1000,
        200
      );

      await mockToken.connect(user1).approve(yieldAggregator.target, ethers.parseEther("100"));
      await yieldAggregator.pause();

      await expect(
        yieldAggregator.connect(user1).deposit(1, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(yieldAggregator, "EnforcedPause");
    });
  });
});
