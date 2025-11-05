const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QIESettlement", function () {
  let qieSettlement;
  let mockToken;
  let owner;
  let user1;
  let user2;
  let qieValidator;

  beforeEach(async function () {
    [owner, user1, user2, qieValidator] = await ethers.getSigners();

    // Deploy mock token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));

    // Deploy QIESettlement
    const QIESettlement = await ethers.getContractFactory("QIESettlement");
    qieSettlement = await QIESettlement.deploy(owner.address);

    // Set QIE validator
    await qieSettlement.setQIEValidator(qieValidator.address);

    // Mint tokens to user
    await mockToken.mint(user1.address, ethers.parseEther("10000"));
    await mockToken.mint(user2.address, ethers.parseEther("10000"));

    // Approve tokens
    await mockToken.connect(user1).approve(qieSettlement.target, ethers.parseEther("10000"));
    await mockToken.connect(user2).approve(qieSettlement.target, ethers.parseEther("10000"));
  });

  describe("Settlement Initiation", function () {
    it("Should initiate settlement successfully", async function () {
      const amount = ethers.parseEther("1000");
      const yieldAmount = ethers.parseEther("50");

      const tx = await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        amount,
        yieldAmount
      );

      await expect(tx)
        .to.emit(qieSettlement, "SettlementInitiated")
        .withArgs(1, user1.address, mockToken.target, amount, yieldAmount);

      const settlement = await qieSettlement.getSettlement(1);
      expect(settlement.user).to.equal(user1.address);
      expect(settlement.token).to.equal(mockToken.target);
      expect(settlement.amount).to.equal(amount);
      expect(settlement.yieldAmount).to.equal(yieldAmount);
      expect(settlement.status).to.equal(0); // Pending
    });

    it("Should not allow settlement with zero amount", async function () {
      await expect(
        qieSettlement.connect(user1).initiateSettlement(
          mockToken.target,
          0,
          0
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow settlement exceeding maximum amount", async function () {
      const maxAmount = await qieSettlement.maxSettlementAmount();
      
      await expect(
        qieSettlement.connect(user1).initiateSettlement(
          mockToken.target,
          maxAmount + 1n,
          0
        )
      ).to.be.revertedWith("Amount exceeds maximum");
    });

    it("Should not allow settlement with invalid token", async function () {
      await expect(
        qieSettlement.connect(user1).initiateSettlement(
          ethers.ZeroAddress,
          ethers.parseEther("1000"),
          0
        )
      ).to.be.revertedWith("Invalid token address");
    });
  });

  describe("Settlement Processing", function () {
    let settlementId;

    beforeEach(async function () {
      const tx = await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment?.name === "SettlementInitiated"
      );
      settlementId = event?.args[0];
    });

    it("Should process settlement with QIE validator", async function () {
      const qieTxHash = ethers.keccak256(ethers.toUtf8Bytes("qie-transaction-hash"));
      const qieNetwork = "ethereum";

      const tx = await qieSettlement.connect(qieValidator).processSettlement(
        settlementId,
        qieTxHash,
        qieNetwork
      );

      await expect(tx)
        .to.emit(qieSettlement, "SettlementProcessed")
        .withArgs(settlementId, qieTxHash, qieNetwork);

      const settlement = await qieSettlement.getSettlement(settlementId);
      expect(settlement.status).to.equal(1); // Processing
      expect(settlement.qieTransactionHash).to.equal(qieTxHash);
      expect(settlement.qieNetwork).to.equal(qieNetwork);
    });

    it("Should not allow non-validator to process settlement", async function () {
      await expect(
        qieSettlement.connect(user1).processSettlement(
          settlementId,
          ethers.keccak256(ethers.toUtf8Bytes("hash")),
          "ethereum"
        )
      ).to.be.revertedWith("Only QIE validator");
    });

    it("Should not allow processing with unsupported network", async function () {
      await expect(
        qieSettlement.connect(qieValidator).processSettlement(
          settlementId,
          ethers.keccak256(ethers.toUtf8Bytes("hash")),
          "unsupported-network"
        )
      ).to.be.revertedWith("Unsupported network");
    });
  });

  describe("Settlement Completion", function () {
    let settlementId;

    beforeEach(async function () {
      // Initiate and process settlement
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      settlementId = 1;
      
      await qieSettlement.connect(qieValidator).processSettlement(
        settlementId,
        ethers.keccak256(ethers.toUtf8Bytes("qie-hash")),
        "ethereum"
      );
    });

    it("Should complete settlement successfully", async function () {
      const finalAmount = ethers.parseEther("1050"); // Including yield
      const userBalanceBefore = await mockToken.balanceOf(user1.address);

      // Add tokens to settlement contract to cover the final amount
      await mockToken.mint(qieSettlement.target, finalAmount);

      const tx = await qieSettlement.connect(qieValidator).completeSettlement(
        settlementId,
        finalAmount
      );

      const settlement = await qieSettlement.getSettlement(settlementId);
      expect(settlement.status).to.equal(2); // Completed

      // Check fee calculation
      const settlementFee = await qieSettlement.settlementFee();
      const expectedFee = (finalAmount * settlementFee) / 10000n;
      const expectedNetAmount = finalAmount - expectedFee;

      await expect(tx)
        .to.emit(qieSettlement, "SettlementCompleted")
        .withArgs(settlementId, expectedNetAmount, expectedFee);

      // Check user received tokens
      const userBalanceAfter = await mockToken.balanceOf(user1.address);
      expect(userBalanceAfter).to.equal(userBalanceBefore + expectedNetAmount);
    });

    it("Should not allow non-validator to complete settlement", async function () {
      await expect(
        qieSettlement.connect(user1).completeSettlement(
          settlementId,
          ethers.parseEther("1050")
        )
      ).to.be.revertedWith("Only QIE validator");
    });
  });

  describe("Settlement Failure", function () {
    let settlementId;

    beforeEach(async function () {
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      settlementId = 1;
      
      await qieSettlement.connect(qieValidator).processSettlement(
        settlementId,
        ethers.keccak256(ethers.toUtf8Bytes("qie-hash")),
        "ethereum"
      );
    });

    it("Should fail settlement and return tokens", async function () {
      const userBalanceBefore = await mockToken.balanceOf(user1.address);
      const reason = "QIE transaction failed";

      const tx = await qieSettlement.connect(qieValidator).failSettlement(
        settlementId,
        reason
      );

      await expect(tx)
        .to.emit(qieSettlement, "SettlementFailed")
        .withArgs(settlementId, reason);

      const settlement = await qieSettlement.getSettlement(settlementId);
      expect(settlement.status).to.equal(3); // Failed

      // Check user received tokens back
      const userBalanceAfter = await mockToken.balanceOf(user1.address);
      expect(userBalanceAfter).to.equal(userBalanceBefore + ethers.parseEther("1000"));
    });
  });

  describe("Settlement Cancellation", function () {
    it("Should allow user to cancel pending settlement", async function () {
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      const settlementId = 1;
      const userBalanceBefore = await mockToken.balanceOf(user1.address);

      const tx = await qieSettlement.connect(user1).cancelSettlement(settlementId);

      await expect(tx)
        .to.emit(qieSettlement, "SettlementFailed")
        .withArgs(settlementId, "Cancelled by user");

      const settlement = await qieSettlement.getSettlement(settlementId);
      expect(settlement.status).to.equal(4); // Cancelled

      // Check user received tokens back
      const userBalanceAfter = await mockToken.balanceOf(user1.address);
      expect(userBalanceAfter).to.equal(userBalanceBefore + ethers.parseEther("1000"));
    });

    it("Should not allow non-owner to cancel settlement", async function () {
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      await expect(
        qieSettlement.connect(user2).cancelSettlement(1)
      ).to.be.revertedWith("Not settlement owner");
    });

    it("Should not allow canceling processed settlement", async function () {
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      await qieSettlement.connect(qieValidator).processSettlement(
        1,
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        "ethereum"
      );

      await expect(
        qieSettlement.connect(user1).cancelSettlement(1)
      ).to.be.revertedWith("Cannot cancel");
    });
  });

  describe("Settlement Queries", function () {
    beforeEach(async function () {
      // Create multiple settlements
      await qieSettlement.connect(user1).initiateSettlement(
        mockToken.target,
        ethers.parseEther("1000"),
        ethers.parseEther("50")
      );
      
      await qieSettlement.connect(user2).initiateSettlement(
        mockToken.target,
        ethers.parseEther("2000"),
        ethers.parseEther("100")
      );
    });

    it("Should get user settlements", async function () {
      const user1Settlements = await qieSettlement.getUserSettlements(user1.address);
      const user2Settlements = await qieSettlement.getUserSettlements(user2.address);

      expect(user1Settlements.length).to.equal(1);
      expect(user2Settlements.length).to.equal(1);
      expect(user1Settlements[0]).to.equal(1);
      expect(user2Settlements[0]).to.equal(2);
    });

    it("Should get settlement by QIE transaction hash", async function () {
      const qieTxHash = ethers.keccak256(ethers.toUtf8Bytes("test-hash"));
      
      await qieSettlement.connect(qieValidator).processSettlement(
        1,
        qieTxHash,
        "ethereum"
      );

      const settlementId = await qieSettlement.getSettlementByQieTx(qieTxHash);
      expect(settlementId).to.equal(1);
    });

    it("Should calculate settlement fee", async function () {
      const amount = ethers.parseEther("1000");
      const fee = await qieSettlement.calculateSettlementFee(amount);
      
      const settlementFee = await qieSettlement.settlementFee();
      const expectedFee = (amount * settlementFee) / 10000n;
      expect(fee).to.equal(expectedFee);
    });

    it("Should check eligibility for instant settlement", async function () {
      const eligible = await qieSettlement.isEligibleForInstantSettlement(
        mockToken.target,
        ethers.parseEther("1000")
      );
      expect(eligible).to.be.true;

      const maxAmount = await qieSettlement.maxSettlementAmount();
      const notEligible = await qieSettlement.isEligibleForInstantSettlement(
        mockToken.target,
        maxAmount + 1n
      );
      expect(notEligible).to.be.false;
    });

    it("Should get settlement statistics", async function () {
      const stats = await qieSettlement.getSettlementStats();
      expect(stats[0]).to.equal(2); // totalSettlements
      expect(stats[1]).to.equal(0); // totalSettledAmount (no completed settlements yet)
      expect(stats[2]).to.equal(0); // totalSettledYield
      expect(stats[3]).to.equal(2); // activeSettlements
    });
  });

  describe("Administrative Functions", function () {
    it("Should update QIE validator", async function () {
      await qieSettlement.setQIEValidator(user2.address);
      expect(await qieSettlement.qieValidator()).to.equal(user2.address);
    });

    it("Should add/remove supported networks", async function () {
      await qieSettlement.setNetworkSupport("avalanche", true);
      expect(await qieSettlement.supportedNetworks("avalanche")).to.be.true;

      await qieSettlement.setNetworkSupport("ethereum", false);
      expect(await qieSettlement.supportedNetworks("ethereum")).to.be.false;
    });

    it("Should update settlement fee", async function () {
      await qieSettlement.updateSettlementFee(100); // 1%
      expect(await qieSettlement.settlementFee()).to.equal(100);
    });

    it("Should not allow fee > 10%", async function () {
      await expect(
        qieSettlement.updateSettlementFee(1001) // 10.01%
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should update maximum settlement amount", async function () {
      await qieSettlement.updateMaxSettlementAmount(ethers.parseEther("2000000"));
      expect(await qieSettlement.maxSettlementAmount()).to.equal(ethers.parseEther("2000000"));
    });
  });

  describe("Access Control", function () {
    it("Should not allow non-owner to call admin functions", async function () {
      await expect(
        qieSettlement.connect(user1).setQIEValidator(user2.address)
      ).to.be.revertedWithCustomError(qieSettlement, "OwnableUnauthorizedAccount");

      await expect(
        qieSettlement.connect(user1).setNetworkSupport("test", true)
      ).to.be.revertedWithCustomError(qieSettlement, "OwnableUnauthorizedAccount");

      await expect(
        qieSettlement.connect(user1).updateSettlementFee(100)
      ).to.be.revertedWithCustomError(qieSettlement, "OwnableUnauthorizedAccount");
    });
  });
});
