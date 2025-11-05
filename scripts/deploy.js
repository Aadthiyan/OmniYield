const { ethers } = require("hardhat");
const qieService = require("../src/services/qieService");
const config = require("../src/config");

async function main() {
  console.log("Starting deployment process...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy YieldAggregator contract
  console.log("\nDeploying YieldAggregator contract...");
  const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
  
  // Set fee collector address (can be deployer for now)
  const feeCollector = deployer.address;
  
  const yieldAggregator = await YieldAggregator.deploy(feeCollector);
  await yieldAggregator.waitForDeployment();

  const yieldAggregatorAddress = await yieldAggregator.getAddress();
  console.log("YieldAggregator deployed to:", yieldAggregatorAddress);

  // Verify contract if on a supported network
  const network = await ethers.provider.getNetwork();
  console.log("Deployed on network:", network.name, "Chain ID:", network.chainId);

  // Deploy using QIE SDK for additional features
  try {
    console.log("\nDeploying with QIE SDK integration...");
    
    const contractData = {
      name: "YieldAggregator",
      sourceCode: require("fs").readFileSync("./contracts/YieldAggregator.sol", "utf8"),
      constructorArgs: [feeCollector],
      network: network.name.toLowerCase()
    };

    const qieDeployment = await qieService.deployContract(contractData, network.name.toLowerCase());
    console.log("QIE deployment result:", qieDeployment);
  } catch (error) {
    console.log("QIE deployment failed (this is expected in development):", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contracts: {
      YieldAggregator: {
        address: yieldAggregatorAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        transactionHash: yieldAggregator.deploymentTransaction().hash
      }
    },
    gasUsed: {
      YieldAggregator: (await yieldAggregator.deploymentTransaction().wait()).gasUsed.toString()
    }
  };

  // Write deployment info to file
  const fs = require("fs");
  const deploymentPath = `./deployments/${network.name}-${network.chainId}.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  // Display summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("YieldAggregator:", yieldAggregatorAddress);
  console.log("Fee Collector:", feeCollector);
  
  // Add some initial strategies for testing
  console.log("\nAdding initial strategies...");
  try {
    // Add a mock strategy (you would replace this with actual strategy contracts)
    const mockStrategyAddress = deployer.address; // Replace with actual strategy address
    
    const tx = await yieldAggregator.addStrategy(
      mockStrategyAddress,
      "Mock Strategy",
      1000, // 10% performance fee
      200   // 2% management fee
    );
    await tx.wait();
    console.log("Mock strategy added successfully");
  } catch (error) {
    console.log("Failed to add mock strategy:", error.message);
  }

  console.log("\nDeployment completed successfully!");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
