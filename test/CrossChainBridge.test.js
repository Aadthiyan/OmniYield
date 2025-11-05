const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross-Chain Bridge Integration Tests", function () {
  let owner, user, operator, relayer;
  let wrappedToken, bridgeAdapter, canonicalToken;
  let bridgeService;

  beforeEach(async function () {
    [owner, user, operator, relayer] = await ethers.getSigners();

    // Deploy canonical token (MockERC20)
    const MockToken = await ethers.getContractFactory("MockERC20");
    canonicalToken = await MockToken.deploy("Canonical Token", "CAN", ethers.parseEther("1000000"));
    await canonicalToken.mint(user.address, ethers.parseEther("10000"));

    // Deploy wrapped token
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    wrappedToken = await WrappedToken.deploy("Wrapped Canonical", "wCAN", 18, owner.address);

    // Deploy bridge adapter
    const BridgeAdapter = await ethers.getContractFactory("BridgeAdapter");
    bridgeAdapter = await BridgeAdapter.deploy(wrappedToken.target, operator.address, 2); // 2 = Simulation mode

    // Grant roles to adapter
    const MINTER_ROLE = ethers.id("MINTER_ROLE");
    const BURNER_ROLE = ethers.id("BURNER_ROLE");
    await wrappedToken.grantRole(MINTER_ROLE, bridgeAdapter.target);
    await wrappedToken.grantRole(BURNER_ROLE, bridgeAdapter.target);

    // Add token support
    await bridgeAdapter.setTokenSupport(canonicalToken.target, true);

    // Fund adapter with canonical tokens for release tests
    await canonicalToken.mint(bridgeAdapter.target, ethers.parseEther("5000"));

    // Initialize bridge service (simulated)
    bridgeService = require("../src/services/bridgeService");
  });

  describe("Token Wrapping Process", function () {
    it("Should complete full wrap flow: lock -> mint", async function () {
      const amount = ethers.parseEther("100");
      const dstChainId = 137; // Polygon
      const to = user.address;

      // Get initial balances
      const initialCanonicalBalance = await canonicalToken.balanceOf(user.address);
      const initialWrappedBalance = await wrappedToken.balanceOf(user.address);

      // User approves and locks canonical tokens
      await canonicalToken.connect(user).approve(bridgeAdapter.target, amount);
      const lockTx = await bridgeAdapter.connect(user).lock(
        canonicalToken.target,
        amount,
        dstChainId,
        ethers.getBytes("0x")
      );

      // Verify lock event is emitted
      await expect(lockTx)
        .to.emit(bridgeAdapter, "Locked");

      // Verify canonical tokens are locked (transferred to adapter)
      // Note: The adapter already has some tokens from beforeEach, so we check the increase
      const adapterBalanceAfter = await canonicalToken.balanceOf(bridgeAdapter.target);
      expect(adapterBalanceAfter).to.be.greaterThan(0);
      expect(await canonicalToken.balanceOf(user.address)).to.equal(initialCanonicalBalance - amount);

      // Simulate off-chain relayer minting wrapped tokens
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));
      const mintTx = await bridgeAdapter.connect(operator).mint(
        user.address,
        amount,
        1, // Source chain ID
        ethers.getBytes("0x"),
        messageId
      );

      // Verify mint event
      await expect(mintTx)
        .to.emit(bridgeAdapter, "Minted")
        .withArgs(user.address, amount, 1, ethers.getBytes("0x"), messageId);

      // Verify wrapped token balance
      expect(await wrappedToken.balanceOf(user.address)).to.equal(initialWrappedBalance + amount);
    });

    it("Should handle multiple wrapping operations", async function () {
      const amounts = [ethers.parseEther("50"), ethers.parseEther("75"), ethers.parseEther("25")];
      const dstChainId = 137;

      for (let i = 0; i < amounts.length; i++) {
        const amount = amounts[i];
        
        // Approve and lock
        await canonicalToken.connect(user).approve(bridgeAdapter.target, amount);
        await bridgeAdapter.connect(user).lock(canonicalToken.target, amount, dstChainId, ethers.getBytes("0x"));
        
        // Mint wrapped tokens
        const messageId = ethers.keccak256(ethers.toUtf8Bytes(`test-message-${i}`));
        await bridgeAdapter.connect(operator).mint(user.address, amount, 1, ethers.getBytes("0x"), messageId);
      }

      // Verify total wrapped balance
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);
      expect(await wrappedToken.balanceOf(user.address)).to.equal(totalAmount);
    });
  });

  describe("Token Unwrapping Process", function () {
    beforeEach(async function () {
      // First wrap some tokens for unwrapping tests
      const amount = ethers.parseEther("200");
      await canonicalToken.connect(user).approve(bridgeAdapter.target, amount);
      await bridgeAdapter.connect(user).lock(canonicalToken.target, amount, 137, ethers.getBytes("0x"));
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message-setup"));
      await bridgeAdapter.connect(operator).mint(user.address, amount, 1, ethers.getBytes("0x"), messageId);
    });

    it("Should complete full unwrap flow: burn -> release", async function () {
      const amount = ethers.parseEther("100");
      const dstChainId = 1; // Ethereum
      const to = user.address;

      // Get initial balances
      const initialWrappedBalance = await wrappedToken.balanceOf(user.address);
      const initialCanonicalBalance = await canonicalToken.balanceOf(user.address);

      // User burns wrapped tokens
      const burnTx = await bridgeAdapter.connect(user).burn(amount, dstChainId, ethers.getBytes("0x"));

      // Verify burn event is emitted
      await expect(burnTx)
        .to.emit(bridgeAdapter, "Burned");

      // Verify wrapped token balance decreased
      expect(await wrappedToken.balanceOf(user.address)).to.equal(initialWrappedBalance - amount);

      // Simulate off-chain relayer releasing canonical tokens
      const releaseMessageId = ethers.keccak256(ethers.toUtf8Bytes("test-release-message"));
      const releaseTx = await bridgeAdapter.connect(operator).release(
        canonicalToken.target,
        user.address,
        amount,
        137, // Source chain ID
        ethers.getBytes("0x"),
        releaseMessageId
      );

      // Verify release event
      await expect(releaseTx)
        .to.emit(bridgeAdapter, "Released")
        .withArgs(user.address, canonicalToken.target, amount, 137, ethers.getBytes("0x"), releaseMessageId);

      // Verify canonical token balance increased
      expect(await canonicalToken.balanceOf(user.address)).to.equal(initialCanonicalBalance + amount);
    });

    it("Should handle partial unwrapping", async function () {
      const totalWrapped = await wrappedToken.balanceOf(user.address);
      const burnAmount = totalWrapped / 2n;

      // Burn half of wrapped tokens
      await bridgeAdapter.connect(user).burn(burnAmount, 1, ethers.getBytes("0x"));
      
      // Release canonical tokens
      const releaseMessageId = ethers.keccak256(ethers.toUtf8Bytes("test-partial-release"));
      await bridgeAdapter.connect(operator).release(
        canonicalToken.target,
        user.address,
        burnAmount,
        137,
        ethers.getBytes("0x"),
        releaseMessageId
      );

      // Verify balances
      expect(await wrappedToken.balanceOf(user.address)).to.equal(totalWrapped - burnAmount);
    });
  });

  describe("Cross-Chain Transfer Simulation", function () {
    it("Should simulate cross-chain transfer with balance validation", async function () {
      const amount = ethers.parseEther("500");
      const srcChain = "ethereum";
      const dstChain = "polygon";

      // Get initial balances
      const initialCanonicalBalance = await canonicalToken.balanceOf(user.address);
      const initialWrappedBalance = await wrappedToken.balanceOf(user.address);

      // Simulate cross-chain transfer using bridge service
      const transferResult = await bridgeService.lockAndMint({
        token: canonicalToken.target,
        amount: amount,
        to: user.address,
        srcChain: srcChain,
        dstChain: dstChain,
        privateKey: "0x" + "1".repeat(64) // Mock private key
      });

      // Verify transfer result
      expect(transferResult.protocol).to.be.oneOf(['wormhole', 'chainbridge']);
      expect(transferResult.op).to.equal('lockAndMint');
      expect(transferResult.amount).to.equal(amount.toString());
      expect(transferResult.srcChain).to.equal(srcChain);
      expect(transferResult.dstChain).to.equal(dstChain);

      // Verify balances haven't changed (simulation mode)
      expect(await canonicalToken.balanceOf(user.address)).to.equal(initialCanonicalBalance);
      expect(await wrappedToken.balanceOf(user.address)).to.equal(initialWrappedBalance);
    });

    it("Should validate transfer parameters", async function () {
      const validation = bridgeService.validateTransferParams({
        token: canonicalToken.target,
        amount: ethers.parseEther("100"),
        to: user.address,
        srcChain: "ethereum",
        dstChain: "polygon"
      });

      expect(validation.valid).to.be.true;
      expect(validation.errors).to.have.length(0);
    });

    it("Should reject invalid transfer parameters", async function () {
      const invalidValidation = bridgeService.validateTransferParams({
        token: "0x0000000000000000000000000000000000000000", // Invalid address
        amount: 0, // Invalid amount
        to: "invalid_address", // Invalid address
        srcChain: "ethereum",
        dstChain: "ethereum" // Same chain
      });

      expect(invalidValidation.valid).to.be.false;
      expect(invalidValidation.errors).to.have.length.greaterThan(0);
    });
  });

  describe("Bridge Service Integration", function () {
    it("Should get supported chains", async function () {
      const chains = bridgeService.getSupportedChains();
      expect(chains).to.have.property('ethereum');
      expect(chains).to.have.property('polygon');
      expect(chains.ethereum.chainId).to.equal(1);
      expect(chains.polygon.chainId).to.equal(137);
    });

    it("Should get transfer status", async function () {
      const transferId = "test-transfer-123";
      const status = await bridgeService.getTransferStatus(transferId);
      
      expect(status).to.have.property('status');
      expect(status).to.have.property('protocol');
    });

    it("Should handle burn and release simulation", async function () {
      const result = await bridgeService.burnAndRelease({
        wrappedToken: wrappedToken.target,
        amount: ethers.parseEther("100"),
        to: user.address,
        srcChain: "polygon",
        dstChain: "ethereum",
        privateKey: "0x" + "1".repeat(64)
      });

      expect(result.protocol).to.be.oneOf(['wormhole', 'chainbridge']);
      expect(result.op).to.equal('burnAndRelease');
      expect(result.amount).to.equal(ethers.parseEther("100").toString());
    });
  });

  describe("Error Handling", function () {
    it("Should not allow non-operator to mint", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));
      await expect(
        bridgeAdapter.connect(user).mint(user.address, ethers.parseEther("100"), 1, ethers.getBytes("0x"), messageId)
      ).to.be.revertedWith("Not bridge operator");
    });

    it("Should not allow non-operator to release", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));
      await expect(
        bridgeAdapter.connect(user).release(
          canonicalToken.target,
          user.address,
          ethers.parseEther("100"),
          1,
          ethers.getBytes("0x"),
          messageId
        )
      ).to.be.revertedWith("Not bridge operator");
    });

    it("Should not allow burning more than balance", async function () {
      const userWrappedBalance = await wrappedToken.balanceOf(user.address);
      const burnAmount = userWrappedBalance + ethers.parseEther("1");

      await expect(
        bridgeAdapter.connect(user).burn(burnAmount, 1, ethers.getBytes("0x"))
      ).to.be.reverted;
    });

    it("Should not allow locking zero amount", async function () {
      await expect(
        bridgeAdapter.connect(user).lock(canonicalToken.target, 0, 137, ethers.getBytes("0x"))
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Gas Optimization", function () {
    it("Should optimize gas usage for multiple operations", async function () {
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20"), ethers.parseEther("30")];
      
      // Batch approve operations
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);
      await canonicalToken.connect(user).approve(bridgeAdapter.target, totalAmount);

      // Execute multiple lock operations
      for (let i = 0; i < amounts.length; i++) {
        const tx = await bridgeAdapter.connect(user).lock(
          canonicalToken.target,
          amounts[i],
          137,
          ethers.getBytes("0x")
        );
        
        // Verify gas usage is reasonable (less than 200k gas per operation)
        const receipt = await tx.wait();
        expect(receipt.gasUsed).to.be.lessThan(200000);
      }
    });
  });

  describe("Multi-User Scenarios", function () {
    let user2;

    beforeEach(async function () {
      [, , , , user2] = await ethers.getSigners();
      await canonicalToken.mint(user2.address, ethers.parseEther("5000"));
    });

    it("Should handle concurrent transfers from multiple users", async function () {
      const user1Amount = ethers.parseEther("100");
      const user2Amount = ethers.parseEther("150");

      // User 1 operations
      await canonicalToken.connect(user).approve(bridgeAdapter.target, user1Amount);
      await bridgeAdapter.connect(user).lock(canonicalToken.target, user1Amount, 137, ethers.getBytes("0x"));

      // User 2 operations
      await canonicalToken.connect(user2).approve(bridgeAdapter.target, user2Amount);
      await bridgeAdapter.connect(user2).lock(canonicalToken.target, user2Amount, 137, ethers.getBytes("0x"));

      // Mint wrapped tokens for both users
      const messageId1 = ethers.keccak256(ethers.toUtf8Bytes("test-user1"));
      const messageId2 = ethers.keccak256(ethers.toUtf8Bytes("test-user2"));
      await bridgeAdapter.connect(operator).mint(user.address, user1Amount, 1, ethers.getBytes("0x"), messageId1);
      await bridgeAdapter.connect(operator).mint(user2.address, user2Amount, 1, ethers.getBytes("0x"), messageId2);

      // Verify balances
      expect(await wrappedToken.balanceOf(user.address)).to.equal(user1Amount);
      expect(await wrappedToken.balanceOf(user2.address)).to.equal(user2Amount);
    });
  });
});
