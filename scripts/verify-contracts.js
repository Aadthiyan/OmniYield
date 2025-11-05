const { ethers } = require("hardhat");
const fs = require("fs");

async function verifyContracts(networkName = "testnet") {
  console.log(`Verifying contracts on ${networkName}...`);

  // Read deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentPath = `./deployments/${networkName}-${network.chainId}.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found: ${deploymentPath}`);
    console.log("Please run deployment first.");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Found deployment info for:", deploymentInfo.network);

  // Verify YieldAggregator contract
  const yieldAggregatorAddress = deploymentInfo.contracts.YieldAggregator.address;
  const deployer = deploymentInfo.contracts.YieldAggregator.deployer;

  try {
    console.log("\nVerifying YieldAggregator contract...");
    console.log("Address:", yieldAggregatorAddress);
    console.log("Constructor args:", [deployer]);

    await hre.run("verify:verify", {
      address: yieldAggregatorAddress,
      constructorArguments: [deployer],
    });

    console.log("✓ YieldAggregator contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ Contract already verified");
    } else {
      console.error("✗ Verification failed:", error.message);
      console.log("\nManual verification command:");
      console.log(`npx hardhat verify --network ${networkName} ${yieldAggregatorAddress} "${deployer}"`);
    }
  }

  console.log("\nContract verification completed!");
}

async function main() {
  const networkName = process.argv[2] || "testnet";
  
  try {
    await verifyContracts(networkName);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
