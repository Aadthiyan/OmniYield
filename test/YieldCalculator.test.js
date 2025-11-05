const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldCalculator", function () {
  let yieldCalculator;
  let compoundStrategy;
  let uniswapV3Strategy;
  let stakingStrategy;
  let owner;
  let user1;
  let user2;
  let mockToken1;
  let mockToken2;
  let mockToken3;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken1 = await MockToken.deploy("Token 1", "TK1", ethers.parseEther("1000000"));
    mockToken2 = await MockToken.deploy("Token 2", "TK2", ethers.parseEther("1000000"));
    mockToken3 = await MockToken.deploy("Token 3", "TK3", ethers.parseEther("1000000"));

    // Deploy YieldCalculator
    const YieldCalculator = await ethers.getContractFactory("YieldCalculator");
    yieldCalculator = await YieldCalculator.deploy(owner.address);

    // Deploy strategy contracts
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    compoundStrategy = await CompoundStrategy.deploy(
      mockToken1.target,
      mockToken1.target, // Using same token as cToken for simplicity
      owner.address
    );

    const UniswapV3Strategy = await ethers.getContractFactory("UniswapV3Strategy");
    uniswapV3Strategy = await UniswapV3Strategy.deploy(
      mockToken1.target,
      mockToken2.target,
      owner.address
    );

    const StakingStrategy = await ethers.getContractFactory("StakingStrategy");
    stakingStrategy = await StakingStrategy.deploy(
      mockToken3.target,
      mockToken3.target, // Using same token as reward token
      ethers.parseEther("100"), // 100 tokens per second reward rate
      owner.address
    );

    // Mint tokens to users
    await mockToken1.mint(user1.address, ethers.parseEther("10000"));
    await mockToken2.mint(user1.address, ethers.parseEther("10000"));
    await mockToken3.mint(user1.address, ethers.parseEther("10000"));

    // Approve tokens
    await mockToken1.connect(user1).approve(compoundStrategy.target, ethers.parseEther("10000"));
    await mockToken1.connect(user1).approve(uniswapV3Strategy.target, ethers.parseEther("10000"));
    await mockToken2.connect(user1).approve(uniswapV3Strategy.target, ethers.parseEther("10000"));
    await mockToken3.connect(user1).approve(stakingStrategy.target, ethers.parseEther("10000"));
  });

  describe("Strategy Management", function () {
    it("Should add strategies with weights", async function () {
      // Add strategies with different weights
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000); // 30%
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 4000); // 40%
      await yieldCalculator.addStrategy(stakingStrategy.target, 3000); // 30%

      expect(await yieldCalculator.getStrategyCount()).to.equal(3);
      expect(await yieldCalculator.getStrategyWeight(compoundStrategy.target)).to.equal(3000);
      expect(await yieldCalculator.getStrategyWeight(uniswapV3Strategy.target)).to.equal(4000);
      expect(await yieldCalculator.getStrategyWeight(stakingStrategy.target)).to.equal(3000);
      expect(await yieldCalculator.isStrategyActive(compoundStrategy.target)).to.be.true;
    });

    it("Should not allow adding strategy with weight > 100%", async function () {
      await expect(
        yieldCalculator.addStrategy(compoundStrategy.target, 10001)
      ).to.be.revertedWith("Weight cannot exceed 100%");
    });

    it("Should update strategy weights", async function () {
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000);
      
      await yieldCalculator.updateStrategyWeight(compoundStrategy.target, 5000);
      expect(await yieldCalculator.getStrategyWeight(compoundStrategy.target)).to.equal(5000);
    });

    it("Should remove strategies", async function () {
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000);
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 4000);
      
      expect(await yieldCalculator.getStrategyCount()).to.equal(2);
      
      await yieldCalculator.removeStrategy(compoundStrategy.target);
      
      expect(await yieldCalculator.getStrategyCount()).to.equal(1);
      expect(await yieldCalculator.isStrategyActive(compoundStrategy.target)).to.be.false;
      expect(await yieldCalculator.isStrategyActive(uniswapV3Strategy.target)).to.be.true;
    });
  });

  describe("Yield Calculations", function () {
    beforeEach(async function () {
      // Add strategies
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000); // 30%
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 4000); // 40%
      await yieldCalculator.addStrategy(stakingStrategy.target, 3000); // 30%
    });

    it("Should calculate weighted yield correctly", async function () {
      // Make some deposits to strategies
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("1000"), ethers.parseEther("1000"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      // Calculate weighted yield
      const weightedYield = await yieldCalculator.calculateWeightedYield();
      expect(weightedYield).to.be.greaterThan(0);
    });

    it("Should calculate total value across strategies", async function () {
      // Make deposits
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("1000"), ethers.parseEther("1000"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      const totalValue = await yieldCalculator.calculateTotalValue();
      expect(totalValue).to.be.greaterThan(0);
    });

    it("Should calculate total accumulated yield", async function () {
      // Make deposits
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      // Wait a bit and calculate yield
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const totalYield = await yieldCalculator.calculateTotalAccumulatedYield();
      expect(totalYield).to.be.greaterThan(0);
    });

    it("Should get detailed yield data", async function () {
      // Make deposits
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      const yieldData = await yieldCalculator.getDetailedYieldData();
      
      expect(yieldData.timestamp).to.be.greaterThan(0);
      expect(yieldData.totalValue).to.be.greaterThan(0);
      expect(yieldData.strategyYields.length).to.equal(3);
      expect(yieldData.strategyValues.length).to.equal(3);
    });

    it("Should calculate optimal allocation", async function () {
      const totalAmount = ethers.parseEther("1000");
      const allocations = await yieldCalculator.calculateOptimalAllocation(totalAmount);
      
      expect(allocations.length).to.equal(3);
      
      // Check that allocations sum to total amount
      const sum = allocations.reduce((acc, allocation) => acc + allocation, 0n);
      expect(sum).to.equal(totalAmount);
    });
  });

  describe("Yield History", function () {
    beforeEach(async function () {
      await yieldCalculator.addStrategy(compoundStrategy.target, 5000);
      await yieldCalculator.addStrategy(stakingStrategy.target, 5000);
      
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));
    });

    it("Should update yield history", async function () {
      await yieldCalculator.updateYieldHistory();
      
      const history = await yieldCalculator.getYieldHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].totalValue).to.be.greaterThan(0);
    });

    it("Should get yield history with limit", async function () {
      // Update history multiple times
      await yieldCalculator.updateYieldHistory();
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      await yieldCalculator.updateYieldHistory();
      
      const history = await yieldCalculator.getYieldHistory(1);
      expect(history.length).to.equal(1);
      
      const allHistory = await yieldCalculator.getYieldHistory(0);
      expect(allHistory.length).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should not allow non-owner to add strategy", async function () {
      await expect(
        yieldCalculator.connect(user1).addStrategy(compoundStrategy.target, 3000)
      ).to.be.revertedWithCustomError(yieldCalculator, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to update strategy weight", async function () {
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000);
      
      await expect(
        yieldCalculator.connect(user1).updateStrategyWeight(compoundStrategy.target, 5000)
      ).to.be.revertedWithCustomError(yieldCalculator, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to remove strategy", async function () {
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000);
      
      await expect(
        yieldCalculator.connect(user1).removeStrategy(compoundStrategy.target)
      ).to.be.revertedWithCustomError(yieldCalculator, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero strategies", async function () {
      expect(await yieldCalculator.calculateWeightedYield()).to.equal(0);
      expect(await yieldCalculator.calculateTotalValue()).to.equal(0);
      expect(await yieldCalculator.calculateTotalAccumulatedYield()).to.equal(0);
    });

    it("Should handle inactive strategies", async function () {
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000);
      await yieldCalculator.removeStrategy(compoundStrategy.target);
      
      expect(await yieldCalculator.calculateWeightedYield()).to.equal(0);
    });

    it("Should handle strategy contract failures gracefully", async function () {
      // Add a valid strategy first, then make it fail
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000);
      
      // Remove the strategy to simulate failure
      await yieldCalculator.removeStrategy(compoundStrategy.target);
      
      // Should not revert but return 0 values
      const weightedYield = await yieldCalculator.calculateWeightedYield();
      expect(weightedYield).to.equal(0);
    });
  });
});
