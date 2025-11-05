# Deployment Guide

This guide covers deploying the DeFi Cross-Chain Yield Aggregator to various networks.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Environment variables configured in `.env`
2. ✅ Testnet tokens for gas fees
3. ✅ API keys for block explorers (for verification)
4. ✅ Private key with sufficient funds
5. ✅ Contracts tested locally

## Local Deployment

### 1. Start Local Hardhat Node

```bash
npm run node
```

This starts a local blockchain with:
- 20 test accounts
- 10,000 ETH per account
- Chain ID: 31337

### 2. Deploy Contracts

In a new terminal:
```bash
npm run deploy:local
```

**Expected Output:**
```
Starting deployment process...
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000000000000000000000
Deploying YieldAggregator contract...
YieldAggregator deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: hardhat
Chain ID: 31337
Deployment completed successfully!
```

### 3. Verify Deployment

Check the `deployments/` folder for deployment artifacts:
```bash
ls deployments/
# Should show: hardhat-31337.json
```

## Testnet Deployment

### Goerli Testnet

1. **Get Testnet ETH**
   - Visit [Goerli Faucet](https://goerlifaucet.com/)
   - Connect your wallet and request ETH

2. **Deploy to Goerli**
   ```bash
   npm run deploy:testnet
   ```

3. **Verify Contracts**
   ```bash
   npx hardhat verify --network testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

### Polygon Mumbai

1. **Get Testnet MATIC**
   - Visit [Polygon Faucet](https://faucet.polygon.technology/)
   - Connect wallet and request MATIC

2. **Deploy to Mumbai**
   ```bash
   npx hardhat run scripts/deploy.js --network polygonMumbai
   ```

3. **Verify Contracts**
   ```bash
   npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

## Mainnet Deployment

⚠️ **WARNING**: Only deploy to mainnet after thorough testing and audits!

### Ethereum Mainnet

1. **Update Environment**
   ```env
   NODE_ENV=production
   QIE_NETWORK=mainnet
   ```

2. **Deploy Contracts**
   ```bash
   npm run deploy:ethereum
   ```

3. **Verify on Etherscan**
   ```bash
   npx hardhat verify --network ethereum <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

### Polygon Mainnet

1. **Deploy to Polygon**
   ```bash
   npm run deploy:polygon
   ```

2. **Verify on Polygonscan**
   ```bash
   npx hardhat verify --network polygon <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

### BSC Mainnet

1. **Deploy to BSC**
   ```bash
   npm run deploy:bsc
   ```

2. **Verify on BSCScan**
   ```bash
   npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

## Deployment Scripts

### Main Deployment Script (`scripts/deploy.js`)

```javascript
// Key features:
- Deploys YieldAggregator contract
- Integrates with QIE SDK
- Saves deployment artifacts
- Displays deployment summary
- Adds initial strategies
```

### Testnet Deployment Script (`scripts/deploy-testnet.js`)

```javascript
// Key features:
- Enhanced testnet deployment
- Automatic contract verification
- Gas usage reporting
- Network connectivity checks
- Comprehensive testing
```

### Verification Script (`scripts/verify-contracts.js`)

```javascript
// Key features:
- Automatic contract verification
- Reads deployment artifacts
- Handles verification errors
- Provides manual verification commands
```

## Deployment Artifacts

Each deployment creates a JSON file in `deployments/`:

```json
{
  "network": "testnet",
  "chainId": "5",
  "contracts": {
    "YieldAggregator": {
      "address": "0x...",
      "deployer": "0x...",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "transactionHash": "0x...",
      "gasUsed": "1234567",
      "blockNumber": 12345678
    }
  },
  "explorer": {
    "transaction": "https://goerli.etherscan.io/tx/0x...",
    "contract": "https://goerli.etherscan.io/address/0x..."
  }
}
```

## Gas Optimization

### Contract Optimizations

- **Solidity 0.8.19**: Latest version with gas optimizations
- **OpenZeppelin**: Battle-tested, gas-efficient contracts
- **Optimizer**: Enabled with 200 runs
- **Storage**: Optimized data structures

### Deployment Optimizations

- **Gas Price**: Set appropriate gas prices for each network
- **Gas Limit**: Configured based on contract complexity
- **Batch Operations**: Group related transactions

## Network-Specific Considerations

### Ethereum
- **Gas Costs**: High, optimize for gas efficiency
- **Confirmation Time**: 12-15 seconds
- **Verification**: Etherscan API required

### Polygon
- **Gas Costs**: Very low, fast transactions
- **Confirmation Time**: 2-3 seconds
- **Verification**: Polygonscan API required

### BSC
- **Gas Costs**: Low, moderate speed
- **Confirmation Time**: 3-5 seconds
- **Verification**: BSCScan API required

## Post-Deployment

### 1. Verify Contracts

```bash
# Automatic verification
npm run verify

# Manual verification
npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 2. Test Contract Functions

```bash
# Run integration tests
npx hardhat test test/YieldAggregator.test.js --network <NETWORK>

# Test specific functions
npx hardhat console --network <NETWORK>
```

### 3. Monitor Deployment

- Check transaction on block explorer
- Verify contract source code
- Test contract functions
- Monitor gas usage

### 4. Update Configuration

Update your application configuration with deployed addresses:

```javascript
const config = {
  contracts: {
    yieldAggregator: "0x...", // Deployed address
    network: "ethereum",      // Network name
    chainId: 1               // Chain ID
  }
};
```

## Troubleshooting

### Common Deployment Issues

1. **"Insufficient funds"**
   - Check account balance
   - Get testnet tokens from faucets
   - Verify private key

2. **"Gas limit exceeded"**
   - Increase gas limit in config
   - Optimize contract code
   - Check for infinite loops

3. **"Contract verification failed"**
   - Check API keys
   - Verify constructor arguments
   - Ensure source code is accessible

4. **"Network not supported"**
   - Check RPC URLs
   - Verify network configuration
   - Test network connectivity

### Debug Commands

```bash
# Check network connectivity
npx hardhat console --network <NETWORK>

# Get account balance
await ethers.provider.getBalance("<ADDRESS>")

# Get network info
await ethers.provider.getNetwork()

# Check gas price
await ethers.provider.getGasPrice()
```

## Security Checklist

Before mainnet deployment:

- [ ] Code reviewed and audited
- [ ] All tests passing
- [ ] Testnet deployment successful
- [ ] Contract verification complete
- [ ] Gas optimization verified
- [ ] Access controls tested
- [ ] Emergency procedures documented
- [ ] Monitoring systems in place

## Rollback Procedures

If deployment issues occur:

1. **Stop deployment process**
2. **Analyze error logs**
3. **Fix issues in code**
4. **Test locally**
5. **Redeploy to testnet**
6. **Verify functionality**
7. **Deploy to mainnet**

## Monitoring

After deployment:

- Monitor contract events
- Track gas usage
- Watch for failed transactions
- Monitor user interactions
- Check for security issues

---

**Remember**: Always test thoroughly on testnets before mainnet deployment!
