const { ethers } = require("hardhat");
const qieService = require("../src/services/qieService");
const config = require("../src/config");

async function deployToTestnet(networkName = "testnet") {
  console.log(`Starting deployment to ${networkName}...`);

  // Initialize QIE service for testnet
  try {
    await qieService.initializeQIE();
    console.log("QIE SDK initialized for testnet deployment");
  } catch (error) {
    console.log("QIE SDK initialization failed, proceeding with Hardhat:", error.message);
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.formatEther(await deployer.provider.getBalance(deployer.address))), "ETH");

  // Check if we have enough balance
  const balance = await deployer.provider.getBalance(deployer.address);
  if (balance < ethers.parseEther("0.01")) {
    console.warn("Warning: Low balance detected. You may need testnet ETH.");
    console.log("Get testnet ETH from:");
    console.log("- Goerli: https://goerlifaucet.com/");
    console.log("- Mumbai: https://faucet.polygon.technology/");
  }

  // Deploy YieldAggregator contract
  console.log("\nDeploying YieldAggregator contract...");
  const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
  
  const feeCollector = deployer.address;
  const yieldAggregator = await YieldAggregator.deploy(feeCollector);
  await yieldAggregator.waitForDeployment();

  const yieldAggregatorAddress = await yieldAggregator.getAddress();
  console.log("YieldAggregator deployed to:", yieldAggregatorAddress);

  // Get deployment transaction details
  const deploymentTx = yieldAggregator.deploymentTransaction();
  const receipt = await deploymentTx.wait();
  
  console.log("Deployment transaction hash:", receipt.hash);
  console.log("Gas used:", receipt.gasUsed.toString());

  // Verify contract on block explorer
  const network = await ethers.provider.getNetwork();
  console.log("\nNetwork details:");
  console.log("Name:", network.name);
  console.log("Chain ID:", network.chainId);

  // Try to verify contract automatically
  try {
    console.log("\nVerifying contract on block explorer...");
    await hre.run("verify:verify", {
      address: yieldAggregatorAddress,
      constructorArguments: [feeCollector],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.log("Contract verification failed:", error.message);
    console.log("You can verify manually using:");
    console.log(`npx hardhat verify --network ${networkName} ${yieldAggregatorAddress} "${feeCollector}"`);
  }

  // Test basic contract functionality
  console.log("\nTesting contract functionality...");
  try {
    // Test adding a strategy
    const mockStrategyAddress = deployer.address;
    const addStrategyTx = await yieldAggregator.addStrategy(
      mockStrategyAddress,
      "Test Strategy",
      1000, // 10% performance fee
      200   // 2% management fee
    );
    await addStrategyTx.wait();
    console.log("✓ Strategy added successfully");

    // Test getting strategy info
    const strategy = await yieldAggregator.getStrategy(1);
    console.log("✓ Strategy retrieved:", strategy.name);

    // Test pause/unpause functionality
    const pauseTx = await yieldAggregator.pause();
    await pauseTx.wait();
    console.log("✓ Contract paused");

    const unpauseTx = await yieldAggregator.unpause();
    await unpauseTx.wait();
    console.log("✓ Contract unpaused");

  } catch (error) {
    console.log("✗ Contract testing failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId.toString(),
    contracts: {
      YieldAggregator: {
        address: yieldAggregatorAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      }
    },
    explorer: {
      transaction: `https://${networkName === 'goerli' ? 'goerli.' : ''}etherscan.io/tx/${receipt.hash}`,
      contract: `https://${networkName === 'goerli' ? 'goerli.' : ''}etherscan.io/address/${yieldAggregatorAddress}`
    }
  };

  // Write deployment info to file
  const fs = require("fs");
  const deploymentPath = `./deployments/${networkName}-${network.chainId}.json`;
  
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  // Display summary
  console.log("\n=== TESTNET DEPLOYMENT SUMMARY ===");
  console.log("Network:", networkName);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("YieldAggregator:", yieldAggregatorAddress);
  console.log("Transaction:", receipt.hash);
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("Block Number:", receipt.blockNumber);
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update your .env file with the deployed contract address");
  console.log("2. Test the contract with testnet tokens");
  console.log("3. Verify the contract on the block explorer");
  console.log("4. Deploy to mainnet when ready");

  console.log("\nTestnet deployment completed successfully!");
}

// Handle different testnet deployments
async function main() {
  const networkName = process.argv[2] || "testnet";
  
  try {
    await deployToTestnet(networkName);
  } catch (error) {
    console.error("Testnet deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
