const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge Integration", function () {
  let owner, user, operator;
  let wrapped, adapter, token;

  beforeEach(async function () {
    [owner, user, operator] = await ethers.getSigners();

    // Deploy a canonical token (MockERC20)
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("Canonical", "CAN", ethers.parseEther("1000000"));
    await token.mint(user.address, ethers.parseEther("10000"));

    // Deploy wrapped token
    const WrappedToken = await ethers.getContractFactory("WrappedToken");
    wrapped = await WrappedToken.deploy("Wrapped Canonical", "wCAN", 18, owner.address);

    // Deploy adapter
    const BridgeAdapter = await ethers.getContractFactory("BridgeAdapter");
    adapter = await BridgeAdapter.deploy(wrapped.target, operator.address, 2); // 2 = Simulation mode

    // Grant roles to adapter
    const MINTER_ROLE = ethers.id("MINTER_ROLE");
    const BURNER_ROLE = ethers.id("BURNER_ROLE");
    await wrapped.grantRole(MINTER_ROLE, adapter.target);
    await wrapped.grantRole(BURNER_ROLE, adapter.target);

    // Add token support
    await adapter.setTokenSupport(token.target, true);

    // Fund adapter with canonical for release tests
    await token.mint(adapter.target, ethers.parseEther("5000"));
  });

  it("wrap flow: lock canonical -> mint wrapped", async function () {
    // user approves and locks canonical
    await token.connect(user).approve(adapter.target, ethers.parseEther("100"));
    await expect(adapter.connect(user).lock(token.target, ethers.parseEther("100"), 137, ethers.getBytes("0x")))
      .to.emit(adapter, "Locked");

    // operator mints wrapped on dest chain
    const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));
    await expect(adapter.connect(operator).mint(user.address, ethers.parseEther("100"), 1, ethers.getBytes("0x"), messageId))
      .to.emit(adapter, "Minted");

    expect(await wrapped.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("unwrap flow: burn wrapped -> release canonical", async function () {
    // Mint wrapped to user first
    const messageId1 = ethers.keccak256(ethers.toUtf8Bytes("test-message-1"));
    await adapter.connect(operator).mint(user.address, ethers.parseEther("50"), 1, ethers.getBytes("0x"), messageId1);
    expect(await wrapped.balanceOf(user.address)).to.equal(ethers.parseEther("50"));

    // User burns wrapped
    await wrapped.connect(user).approve(adapter.target, ethers.parseEther("50"));
    await expect(adapter.connect(user).burn(ethers.parseEther("50"), 1, ethers.getBytes("0x")))
      .to.emit(adapter, "Burned");

    // Operator releases canonical
    const messageId2 = ethers.keccak256(ethers.toUtf8Bytes("test-message-2"));
    await expect(adapter.connect(operator).release(token.target, user.address, ethers.parseEther("50"), 137, ethers.getBytes("0x"), messageId2))
      .to.emit(adapter, "Released");

    expect(await token.balanceOf(user.address)).to.be.greaterThan(0);
  });
});


