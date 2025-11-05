const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Strategy Contracts", function () {
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

  describe("CompoundStrategy", function () {
    it("Should deposit tokens successfully", async function () {
      const amount = ethers.parseEther("1000");
      
      const tx = await compoundStrategy.connect(user1).deposit(amount);
      
      await expect(tx)
        .to.emit(compoundStrategy, "Deposit")
        .withArgs(user1.address, amount, amount);

      expect(await compoundStrategy.totalDeposited()).to.equal(amount);
    });

    it("Should withdraw tokens successfully", async function () {
      const depositAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("500");
      
      await compoundStrategy.connect(user1).deposit(depositAmount);
      await compoundStrategy.connect(user1).withdraw(withdrawAmount);

      expect(await compoundStrategy.totalDeposited()).to.equal(depositAmount - withdrawAmount);
      expect(await compoundStrategy.totalWithdrawn()).to.equal(withdrawAmount);
    });

    it("Should calculate yield rate", async function () {
      // Make a deposit first to have some balance
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      expect(await compoundStrategy.getCurrentYieldRate()).to.be.greaterThan(0);
    });

    it("Should calculate accumulated yield", async function () {
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      
      // Wait for some time to accumulate yield
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const yield = await compoundStrategy.calculateAccumulatedYield();
      expect(yield).to.be.greaterThan(0);
    });

    it("Should get total value including yield", async function () {
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      
      const totalValue = await compoundStrategy.getTotalValue();
      expect(totalValue).to.be.greaterThan(ethers.parseEther("1000"));
    });

    it("Should not allow withdrawal exceeding deposit", async function () {
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      
      await expect(
        compoundStrategy.connect(user1).withdraw(ethers.parseEther("1500"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("UniswapV3Strategy", function () {
    it("Should deposit tokens successfully", async function () {
      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("1000");
      
      const tx = await uniswapV3Strategy.connect(user1).deposit(amount0, amount1);
      
      await expect(tx)
        .to.emit(uniswapV3Strategy, "Deposit")
        .withArgs(user1.address, amount0, amount1);

      expect(await uniswapV3Strategy.totalDeposited0()).to.equal(amount0);
      expect(await uniswapV3Strategy.totalDeposited1()).to.equal(amount1);
    });

    it("Should withdraw tokens successfully", async function () {
      const deposit0 = ethers.parseEther("1000");
      const deposit1 = ethers.parseEther("1000");
      const withdraw0 = ethers.parseEther("500");
      const withdraw1 = ethers.parseEther("300");
      
      await uniswapV3Strategy.connect(user1).deposit(deposit0, deposit1);
      await uniswapV3Strategy.connect(user1).withdraw(withdraw0, withdraw1);

      expect(await uniswapV3Strategy.totalDeposited0()).to.equal(deposit0 - withdraw0);
      expect(await uniswapV3Strategy.totalDeposited1()).to.equal(deposit1 - withdraw1);
    });

    it("Should calculate fee rate", async function () {
      // Make a deposit first to have some balance
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("1000"), ethers.parseEther("1000"));
      expect(await uniswapV3Strategy.getCurrentFeeRate()).to.be.greaterThan(0);
    });

    it("Should calculate accumulated fees", async function () {
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("1000"), ethers.parseEther("1000"));
      
      // Wait for some time to accumulate fees
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const fees = await uniswapV3Strategy.calculateAccumulatedFees();
      expect(fees).to.be.greaterThan(0);
    });

    it("Should not allow withdrawal exceeding deposit", async function () {
      await uniswapV3Strategy.connect(user1).deposit(ethers.parseEther("1000"), ethers.parseEther("1000"));
      
      await expect(
        uniswapV3Strategy.connect(user1).withdraw(ethers.parseEther("1500"), ethers.parseEther("1000"))
      ).to.be.revertedWith("Insufficient token0 balance");
    });
  });

  describe("StakingStrategy", function () {
    it("Should stake tokens successfully", async function () {
      const amount = ethers.parseEther("1000");
      
      const tx = await stakingStrategy.connect(user1).stake(amount);
      
      await expect(tx)
        .to.emit(stakingStrategy, "Staked")
        .withArgs(user1.address, amount, await ethers.provider.getBlock("latest").then(b => b.timestamp));

      expect(await stakingStrategy.userStaked(user1.address)).to.equal(amount);
      expect(await stakingStrategy.totalStaked()).to.equal(amount);
    });

    it("Should unstake tokens successfully", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const unstakeAmount = ethers.parseEther("500");
      
      await stakingStrategy.connect(user1).stake(stakeAmount);
      await stakingStrategy.connect(user1).unstake(unstakeAmount);

      expect(await stakingStrategy.userStaked(user1.address)).to.equal(stakeAmount - unstakeAmount);
      expect(await stakingStrategy.totalStaked()).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should calculate pending rewards", async function () {
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));
      
      // Wait for some time to accumulate rewards
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const pendingRewards = await stakingStrategy.getPendingRewards(user1.address);
      expect(pendingRewards).to.be.greaterThan(0);
    });

    it("Should claim rewards successfully", async function () {
      // Add reward tokens to the staking contract first
      await mockToken3.mint(stakingStrategy.target, ethers.parseEther("1000000"));
      
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));
      
      // Wait for some time to accumulate rewards
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const pendingRewards = await stakingStrategy.getPendingRewards(user1.address);
      
      const tx = await stakingStrategy.connect(user1).claimRewards();
      
      await expect(tx)
        .to.emit(stakingStrategy, "RewardClaimed");

      expect(await stakingStrategy.getPendingRewards(user1.address)).to.equal(0);
    });

    it("Should calculate current reward rate", async function () {
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));
      
      const rewardRate = await stakingStrategy.getCurrentRewardRate();
      expect(rewardRate).to.be.greaterThan(0);
    });

    it("Should not allow unstaking more than staked", async function () {
      await stakingStrategy.connect(user1).stake(ethers.parseEther("1000"));
      
      await expect(
        stakingStrategy.connect(user1).unstake(ethers.parseEther("1500"))
      ).to.be.revertedWith("Insufficient staked amount");
    });

    it("Should update reward rate (owner only)", async function () {
      const newRate = ethers.parseEther("200");
      
      const tx = await stakingStrategy.updateRewardRate(newRate);
      
      await expect(tx)
        .to.emit(stakingStrategy, "RewardRateUpdated")
        .withArgs(newRate, await ethers.provider.getBlock("latest").then(b => b.timestamp));

      expect(await stakingStrategy.rewardRate()).to.equal(newRate);
    });

    it("Should not allow non-owner to update reward rate", async function () {
      await expect(
        stakingStrategy.connect(user1).updateRewardRate(ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(stakingStrategy, "OwnableUnauthorizedAccount");
    });
  });

  describe("Strategy Integration", function () {
    it("Should work with multiple users", async function () {
      // Set up second user
      await mockToken1.mint(user2.address, ethers.parseEther("10000"));
      await mockToken1.connect(user2).approve(compoundStrategy.target, ethers.parseEther("10000"));

      // User 1 deposits
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      
      // User 2 deposits
      await compoundStrategy.connect(user2).deposit(ethers.parseEther("2000"));

      expect(await compoundStrategy.totalDeposited()).to.equal(ethers.parseEther("3000"));
    });

    it("Should handle multiple deposits from same user", async function () {
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("500"));

      expect(await compoundStrategy.totalDeposited()).to.equal(ethers.parseEther("1500"));
    });

    it("Should calculate yield correctly over time", async function () {
      await compoundStrategy.connect(user1).deposit(ethers.parseEther("1000"));
      
      // Get initial value
      const initialValue = await compoundStrategy.getTotalValue();
      
      // Wait for time to pass
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");
      
      // Get new value
      const newValue = await compoundStrategy.getTotalValue();
      
      expect(newValue).to.be.greaterThan(initialValue);
    });
  });
});
