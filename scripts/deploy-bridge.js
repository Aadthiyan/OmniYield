const { ethers } = require("hardhat");
const config = require("../src/config");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy WrappedToken
  const { name, symbol, decimals } = config.bridge.wrappedToken;
  const WrappedToken = await ethers.getContractFactory("WrappedToken");
  const wrapped = await WrappedToken.deploy(name, symbol, decimals, deployer.address);
  await wrapped.waitForDeployment();
  const wrappedAddress = await wrapped.getAddress();
  console.log("WrappedToken:", wrappedAddress);

  // Deploy BridgeAdapter
  const BridgeAdapter = await ethers.getContractFactory("BridgeAdapter");
  const adapter = await BridgeAdapter.deploy(wrappedAddress, deployer.address, 2); // 2 = Simulation mode
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log("BridgeAdapter:", adapterAddress);

  // Grant roles to adapter
  const MINTER_ROLE = ethers.id("MINTER_ROLE");
  const BURNER_ROLE = ethers.id("BURNER_ROLE");
  await (await wrapped.grantRole(MINTER_ROLE, adapterAddress)).wait();
  await (await wrapped.grantRole(BURNER_ROLE, adapterAddress)).wait();
  console.log("Roles granted to adapter");

  // Output summary
  console.log("\n=== BRIDGE DEPLOYMENT SUMMARY ===");
  console.log("Wrapped Token:", wrappedAddress);
  console.log("Bridge Adapter:", adapterAddress);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


