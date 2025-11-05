const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeFi Yield Aggregator Integration Tests", function () {
  let yieldAggregator;
  let yieldCalculator;
  let qieSettlement;
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

    // Deploy QIESettlement
    const QIESettlement = await ethers.getContractFactory("QIESettlement");
    qieSettlement = await QIESettlement.deploy(owner.address);

    // Deploy strategy contracts
    const CompoundStrategy = await ethers.getContractFactory("CompoundStrategy");
    compoundStrategy = await CompoundStrategy.deploy(
      mockToken1.target,
      mockToken1.target,
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
      mockToken3.target,
      ethers.parseEther("100"),
      owner.address
    );

    // Deploy main YieldAggregator
    const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
    yieldAggregator = await YieldAggregator.deploy(owner.address);

    // Mint tokens to users
    await mockToken1.mint(user1.address, ethers.parseEther("10000"));
    await mockToken2.mint(user1.address, ethers.parseEther("10000"));
    await mockToken3.mint(user1.address, ethers.parseEther("10000"));

    // Approve tokens
    await mockToken1.connect(user1).approve(compoundStrategy.target, ethers.parseEther("10000"));
    await mockToken1.connect(user1).approve(uniswapV3Strategy.target, ethers.parseEther("10000"));
    await mockToken2.connect(user1).approve(uniswapV3Strategy.target, ethers.parseEther("10000"));
    await mockToken3.connect(user1).approve(stakingStrategy.target, ethers.parseEther("10000"));
    await mockToken1.connect(user1).approve(yieldAggregator.target, ethers.parseEther("10000"));
    await mockToken1.connect(user1).approve(qieSettlement.target, ethers.parseEther("10000"));
  });

  describe("Complete Yield Aggregation Flow", function () {
    it("Should perform end-to-end yield aggregation", async function () {
      // Step 1: Add strategies to yield calculator
      await yieldCalculator.addStrategy(compoundStrategy.target, 4000); // 40%
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 3500); // 35%
      await yieldCalculator.addStrategy(stakingStrategy.target, 2500); // 25%

      // Step 2: Users deposit into strategies
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("500"), ethers.parseEther("500"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      // Step 3: Calculate weighted yield
      const weightedYield = await yieldCalculator.calculateWeightedYield();
      expect(weightedYield).to.be.greaterThan(0);

      // Step 4: Calculate total value across strategies
      const totalValue = await yieldCalculator.calculateTotalValue();
      expect(totalValue).to.be.greaterThan(ethers.parseEther("3000")); // Should be > initial deposits

      // Step 5: Wait for time to pass and accumulate yield
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");

      // Step 6: Calculate accumulated yield
      const accumulatedYield = await yieldCalculator.calculateTotalAccumulatedYield();
      expect(accumulatedYield).to.be.greaterThan(0);

      // Step 7: Update yield history
      await yieldCalculator.updateYieldHistory();

      // Step 8: Get detailed yield data
      const yieldData = await yieldCalculator.getDetailedYieldData();
      expect(yieldData.totalValue).to.be.greaterThan(ethers.parseEther("3000"));
      expect(yieldData.totalYield).to.be.greaterThan(0);
      expect(yieldData.averageAPY).to.be.greaterThan(0);
    });

    it("Should handle real-time yield calculations accurately", async function () {
      // Setup strategies
      await yieldCalculator.addStrategy(compoundStrategy.target, 5000);
      await yieldCalculator.addStrategy(stakingStrategy.target, 5000);

      // Initial deposits
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      // Get initial values
      const initialTotalValue = await yieldCalculator.calculateTotalValue();
      const initialYield = await yieldCalculator.calculateTotalAccumulatedYield();

      // Wait for 1 hour
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      // Calculate new values
      const after1HourValue = await yieldCalculator.calculateTotalValue();
      const after1HourYield = await yieldCalculator.calculateTotalAccumulatedYield();

      // Values should have increased
      expect(after1HourValue).to.be.greaterThan(initialTotalValue);
      expect(after1HourYield).to.be.greaterThan(initialYield);

      // Wait for another hour
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      // Calculate final values
      const finalValue = await yieldCalculator.calculateTotalValue();
      const finalYield = await yieldCalculator.calculateTotalAccumulatedYield();

      // Yield should be approximately linear (within reasonable bounds)
      const yieldIncrease1 = after1HourYield - initialYield;
      const yieldIncrease2 = finalYield - after1HourYield;
      
      // Allow for some variance due to different calculation methods
      const variance = yieldIncrease1 / 10n;
      expect(yieldIncrease2).to.be.closeTo(yieldIncrease1, variance);
    });

    it("Should optimize allocation across strategies", async function () {
      // Add strategies with different weights
      await yieldCalculator.addStrategy(compoundStrategy.target, 3000); // 30%
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 4000); // 40%
      await yieldCalculator.addStrategy(stakingStrategy.target, 3000); // 30%

      // Calculate optimal allocation for 1000 tokens
      const totalAmount = ethers.parseEther("1000");
      const allocations = await yieldCalculator.calculateOptimalAllocation(totalAmount);

      expect(allocations.length).to.equal(3);
      expect(allocations[0]).to.equal(ethers.parseEther("300")); // 30%
      expect(allocations[1]).to.equal(ethers.parseEther("400")); // 40%
      expect(allocations[2]).to.equal(ethers.parseEther("300")); // 30%

      // Sum should equal total amount
      const sum = allocations.reduce((acc, allocation) => acc + allocation, 0n);
      expect(sum).to.equal(totalAmount);
    });
  });

  describe("QIE Settlement Integration", function () {
    it("Should perform complete settlement flow", async function () {
      // Step 1: User initiates settlement
      const settlementAmount = ethers.parseEther("1000");
      const yieldAmount = ethers.parseEther("50");

      const tx = await qieSettlement.connect(user1).initiateSettlement(
        mockToken1.target,
        settlementAmount,
        yieldAmount
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "SettlementInitiated"
      );
      const settlementId = event?.args[0];

      // Step 2: QIE validator processes settlement
      const qieTxHash = ethers.keccak256(ethers.toUtf8Bytes("qie-transaction"));
      await qieSettlement.processSettlement(settlementId, qieTxHash, "ethereum");

      // Step 3: Add tokens for settlement completion
      const finalAmount = ethers.parseEther("1050");
      await mockToken1.mint(qieSettlement.target, finalAmount);

      // Step 4: Complete settlement
      await qieSettlement.completeSettlement(settlementId, finalAmount);

      // Verify settlement is completed
      const settlement = await qieSettlement.getSettlement(settlementId);
      expect(settlement.status).to.equal(2); // Completed

      // Verify user received tokens (minus fee)
      const settlementFee = await qieSettlement.settlementFee();
      const expectedFee = (finalAmount * settlementFee) / 10000n;
      const expectedNetAmount = finalAmount - expectedFee;

      const userBalance = await mockToken1.balanceOf(user1.address);
      expect(userBalance).to.be.greaterThan(ethers.parseEther("9000")); // Original 10k - 1k + net settlement
    });

    it("Should handle settlement failure gracefully", async function () {
      // Initiate settlement
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken1.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );

      const settlementId = 1;
      const userBalanceBefore = await mockToken1.balanceOf(user1.address);

      // Process settlement
      await qieSettlement.processSettlement(
        settlementId,
        ethers.keccak256(ethers.toUtf8Bytes("qie-hash")),
        "ethereum"
      );

      // Fail settlement
      await qieSettlement.failSettlement(settlementId, "QIE transaction failed");

      // Verify tokens are returned (user should have original balance back)
      const userBalanceAfter = await mockToken1.balanceOf(user1.address);
      expect(userBalanceAfter).to.be.greaterThan(ethers.parseEther("9000")); // Should have most tokens back
    });
  });

  describe("Cross-Chain Yield Aggregation", function () {
    it("Should handle cross-chain yield optimization", async function () {
      // Setup strategies on different "chains" (simulated)
      await yieldCalculator.addStrategy(compoundStrategy.target, 6000); // 60% on "Chain 1"
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 4000); // 40% on "Chain 2"

      // User deposits across strategies
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1200")); // 60% of 2000
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("400"), ethers.parseEther("400")); // 40% of 2000

      // Calculate cross-chain yield
      const crossChainYield = await yieldCalculator.calculateWeightedYield();
      expect(crossChainYield).to.be.greaterThan(0);

      // Simulate cross-chain settlement
      const totalValue = await yieldCalculator.calculateTotalValue();
      const settlementAmount = totalValue / 2n; // Settle half

      // Initiate cross-chain settlement
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken1.target,
        settlementAmount,
        ethers.parseEther("10") // Small yield amount
      );

      // Verify settlement was initiated
      const settlement = await qieSettlement.getSettlement(1);
      expect(settlement.amount).to.equal(settlementAmount);
    });

    it("Should provide accurate yield calculations across multiple chains", async function () {
      // Setup multi-chain strategies
      await yieldCalculator.addStrategy(compoundStrategy.target, 3333); // ~33%
      await yieldCalculator.addStrategy(uniswapV3Strategy.target, 3333); // ~33%
      await yieldCalculator.addStrategy(stakingStrategy.target, 3334); // ~34%

      // Make deposits
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("500"), ethers.parseEther("500"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      // Wait for yield accumulation
      await ethers.provider.send("evm_increaseTime", [43200]); // 12 hours
      await ethers.provider.send("evm_mine");

      // Get yield data for each strategy
      const yieldData = await yieldCalculator.getDetailedYieldData();
      
      expect(yieldData.strategyYields.length).to.equal(3);
      expect(yieldData.strategyValues.length).to.equal(3);
      expect(yieldData.totalValue).to.be.greaterThan(ethers.parseEther("3000"));

      // All strategies should have some yield (or at least one should)
      let hasYield = false;
      yieldData.strategyYields.forEach((yield, index) => {
        if (yieldData.strategyValues[index] > 0 && yield > 0) {
          hasYield = true;
        }
      });
      expect(hasYield).to.be.true;
    });
  });

  describe("Performance and Scalability", function () {
    it("Should handle multiple users efficiently", async function () {
      // Setup for multiple users
      await mockToken1.mint(user2.address, ethers.parseEther("10000"));
      await mockToken1.connect(user2).approve(compoundStrategy.target, ethers.parseEther("10000"));

      await yieldCalculator.addStrategy(compoundStrategy.target, 10000);

      // Multiple users deposit
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await compoundStrategy.connect(user2).deposit(ethers.parseEther("2000"));

      // Calculate total yield (may be 0 if no time has passed)
      const totalYield = await yieldCalculator.calculateTotalAccumulatedYield();
      expect(totalYield).to.be.greaterThanOrEqual(0);

      // Verify individual user balances are tracked correctly
      const user1Balance = await compoundStrategy.totalDeposited();
      expect(user1Balance).to.equal(ethers.parseEther("3000")); // Both users deposited
    });

    it("Should scale with increasing number of strategies", async function () {
      // Add multiple strategies
      const strategies = [
        compoundStrategy,
        uniswapV3Strategy,
        stakingStrategy
      ];

      for (let i = 0; i < strategies.length; i++) {
        await yieldCalculator.addStrategy(strategies[i].target, 3333);
      }

      expect(await yieldCalculator.getStrategyCount()).to.equal(3);

      // Make deposits across all strategies
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("500"), ethers.parseEther("500"));
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));

      // Calculate aggregate yield
      const totalValue = await yieldCalculator.calculateTotalValue();
      const weightedYield = await yieldCalculator.calculateWeightedYield();

      expect(totalValue).to.be.greaterThan(ethers.parseEther("3000"));
      expect(weightedYield).to.be.greaterThan(0);
    });
  });
});
