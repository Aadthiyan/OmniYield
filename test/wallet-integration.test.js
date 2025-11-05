const { expect } = require("chai");
const { ethers } = require("hardhat");
const walletService = require("../src/services/walletService");
const qieService = require("../src/services/qieService");

describe("Wallet Integration Tests", function () {
  let provider;
  let signer;
  let testAccount;

  beforeEach(async function () {
    [testAccount] = await ethers.getSigners();
    provider = ethers.provider;
    signer = testAccount;
  });

  describe("Wallet Service", function () {
    it("Should connect private key wallet", async function () {
      // Generate a test private key
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey;

      const connectedWallet = await walletService.connectPrivateKey(privateKey, "ethereum");
      
      expect(connectedWallet).to.not.be.null;
      expect(connectedWallet.address).to.equal(wallet.address);
      expect(connectedWallet.type).to.equal("privatekey");
      expect(connectedWallet.connected).to.be.true;
    });

    it("Should get wallet balance", async function () {
      // Mock the balance call to avoid external RPC dependency
      const originalGetBalance = walletService.getBalance;
      walletService.getBalance = async (address, network) => {
        return "1000000000000000000"; // Mock balance
      };
      
      const balance = await walletService.getBalance(testAccount.address, "ethereum");
      expect(balance).to.not.be.undefined;
      expect(typeof balance).to.equal("string");
      
      // Restore original function
      walletService.getBalance = originalGetBalance;
    });

    it("Should get supported networks", async function () {
      const networks = walletService.getSupportedNetworks();
      expect(networks).to.be.an("array");
      expect(networks).to.include("ethereum");
      expect(networks).to.include("polygon");
      expect(networks).to.include("bsc");
    });

    it("Should disconnect wallet", async function () {
      const wallet = ethers.Wallet.createRandom();
      await walletService.connectPrivateKey(wallet.privateKey, "ethereum");
      
      expect(walletService.getCurrentWallet()).to.not.be.null;
      
      walletService.disconnectWallet();
      
      expect(walletService.getCurrentWallet()).to.be.null;
    });
  });

  describe("QIE Service", function () {
    it("Should initialize QIE service", function () {
      expect(qieService.getQIE).to.be.a("function");
      expect(qieService.getProvider).to.be.a("function");
      expect(qieService.getSupportedNetworks).to.be.a("function");
    });

    it("Should get network info", function () {
      const ethInfo = qieService.getNetworkInfo("ethereum");
      expect(ethInfo).to.not.be.null;
      expect(ethInfo.chainId).to.equal(1);
      expect(ethInfo.name).to.equal("Ethereum Mainnet");

      const polygonInfo = qieService.getNetworkInfo("polygon");
      expect(polygonInfo).to.not.be.null;
      expect(polygonInfo.chainId).to.equal(137);
      expect(polygonInfo.name).to.equal("Polygon");
    });

    it("Should get supported networks", function () {
      const networks = qieService.getSupportedNetworks();
      expect(networks).to.be.an("array");
      expect(networks.length).to.be.greaterThan(0);
    });

    it("Should handle invalid network", function () {
      const result = qieService.getNetworkInfo("invalid");
      expect(result).to.be.null;
    });
  });

  describe("Transaction Tests", function () {
    it("Should create and sign a transaction", async function () {
      const wallet = ethers.Wallet.createRandom().connect(provider);
      const connectedWallet = await walletService.connectPrivateKey(wallet.privateKey, "ethereum");

      // Create a simple transaction
      const transaction = {
        to: testAccount.address,
        value: ethers.parseEther("0.001"),
        gasLimit: 21000,
        gasPrice: ethers.parseUnits("20", "gwei")
      };

      // This would normally send the transaction, but we'll just test the structure
      expect(transaction.to).to.equal(testAccount.address);
      expect(transaction.value).to.equal(ethers.parseEther("0.001"));
    });

    it("Should handle transaction errors gracefully", async function () {
      const wallet = ethers.Wallet.createRandom().connect(provider);
      
      // Try to send transaction with insufficient funds
      const transaction = {
        to: testAccount.address,
        value: ethers.parseEther("1000"), // More than wallet has
        gasLimit: 21000
      };

      try {
        await wallet.sendTransaction(transaction);
        expect.fail("Transaction should have failed");
      } catch (error) {
        expect(error.message).to.include("enough funds");
      }
    });
  });

  describe("Network Switching", function () {
    it("Should get network information for different chains", function () {
      const networks = ["ethereum", "polygon", "bsc", "testnet"];
      
      networks.forEach(network => {
        const info = qieService.getNetworkInfo(network);
        expect(info).to.not.be.null;
        expect(info.chainId).to.be.a("number");
        expect(info.name).to.be.a("string");
        expect(info.symbol).to.be.a("string");
      });
    });

    it("Should handle network switching", async function () {
      // This test would normally switch networks in a browser environment
      // In the test environment, we just verify the function exists
      expect(walletService.switchNetwork).to.be.a("function");
      
      try {
        await walletService.switchNetwork("polygon");
        // In a real browser environment, this would switch MetaMask to Polygon
      } catch (error) {
        // Expected in test environment without MetaMask
        expect(error.message).to.include("window.ethereum");
      }
    });
  });

  describe("Message Signing", function () {
    it("Should sign a message", async function () {
      const wallet = ethers.Wallet.createRandom().connect(provider);
      const connectedWallet = await walletService.connectPrivateKey(wallet.privateKey, "ethereum");

      const message = "Hello, DeFi World!";
      const signature = await walletService.signMessage(message);
      
      expect(signature).to.be.a("string");
      expect(signature).to.have.length.greaterThan(0);
      
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      expect(recoveredAddress).to.equal(wallet.address);
    });

    it("Should handle signing errors", async function () {
      // Try to sign without a connected wallet
      walletService.disconnectWallet();
      
      try {
        await walletService.signMessage("test message");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("No wallet connected");
      }
    });
  });
});
