# Environment Setup Guide

This guide will walk you through setting up the DeFi Cross-Chain Yield Aggregator development environment.

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **yarn**
   - npm comes with Node.js
   - For yarn: `npm install -g yarn`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

4. **MetaMask** (for wallet integration)
   - Install from [metamask.io](https://metamask.io/)
   - Create a wallet or import existing one

### Required Accounts & API Keys

1. **QIE SDK Account**
   - Sign up at [QIE Platform](https://qie.io)
   - Get API Key and Secret Key

2. **Infura Account** (for RPC endpoints)
   - Sign up at [infura.io](https://infura.io)
   - Create a new project
   - Get Project ID

3. **Block Explorer API Keys** (optional, for verification)
   - [Etherscan](https://etherscan.io/apis) - for Ethereum
   - [Polygonscan](https://polygonscan.com/apis) - for Polygon
   - [BSCScan](https://bscscan.com/apis) - for BSC

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd defi-cross-chain-yield-aggregator
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Hardhat and development tools
- QIE SDK packages
- OpenZeppelin contracts
- Testing frameworks
- Other required dependencies

### 3. Environment Configuration

Copy the example environment file:
```bash
cp env.example .env
```

Edit the `.env` file with your actual values:

```env
# Environment Configuration
NODE_ENV=development

# Private Key (DO NOT COMMIT THIS TO VERSION CONTROL)
PRIVATE_KEY=your_private_key_here

# RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
TESTNET_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
INFURA_KEY=your_infura_project_key

# QIE SDK Configuration
QIE_API_KEY=your_qie_api_key
QIE_SECRET_KEY=your_qie_secret_key
QIE_NETWORK=testnet

# Server Configuration
PORT=3000
API_VERSION=v1

# Gas Configuration
GAS_LIMIT=500000
GAS_PRICE=20000000000
```

### 4. Get Testnet Tokens

For testing, you'll need testnet tokens:

#### Goerli Testnet (Ethereum)
- Get ETH from [Goerli Faucet](https://goerlifaucet.com/)
- Or use [Alchemy Faucet](https://goerlifaucet.com/)

#### Mumbai Testnet (Polygon)
- Get MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
- Or use [Mumbai Faucet](https://mumbaifaucet.com/)

#### BSC Testnet
- Get BNB from [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)

## Development Workflow

### 1. Start Local Development

Start a local Hardhat node:
```bash
npm run node
```

This will:
- Start a local blockchain network
- Provide 20 test accounts with 10,000 ETH each
- Enable contract deployment and testing

### 2. Deploy Contracts Locally

In a new terminal:
```bash
npm run deploy:local
```

This will:
- Compile smart contracts
- Deploy YieldAggregator contract
- Save deployment information

### 3. Run Tests

```bash
npm test
```

This will run:
- Contract unit tests
- Wallet integration tests
- QIE SDK integration tests

### 4. Deploy to Testnet

```bash
npm run deploy:testnet
```

This will:
- Deploy to Goerli testnet
- Verify contracts on Etherscan
- Save deployment artifacts

## Configuration Details

### Network Configuration

The project supports multiple networks:

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Ethereum | 1 | Infura/Alchemy | Etherscan |
| Polygon | 137 | Polygon RPC | Polygonscan |
| BSC | 56 | BSC RPC | BSCScan |
| Goerli | 5 | Infura/Alchemy | Goerli Etherscan |
| Mumbai | 80001 | Polygon RPC | Mumbai Polygonscan |

### QIE SDK Configuration

The QIE SDK provides:
- Multi-chain wallet management
- Cross-chain transaction handling
- Advanced contract deployment
- Gas optimization

### Wallet Integration

Supported wallet types:
- **MetaMask**: Browser extension wallet
- **Private Key**: Direct private key usage
- **Hardware Wallets**: Ledger, Trezor (via MetaMask)

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **"Insufficient funds" errors**
   - Check your account balance
   - Get testnet tokens from faucets
   - Ensure private key is correct

3. **"Network not supported" errors**
   - Check RPC URLs in `.env`
   - Verify network configuration in `hardhat.config.js`
   - Ensure API keys are valid

4. **"Contract verification failed"**
   - Check API keys for block explorers
   - Ensure contract source code is accessible
   - Verify constructor arguments

### Getting Help

1. **Check logs**: Look at console output for detailed error messages
2. **Verify configuration**: Ensure all environment variables are set correctly
3. **Test network connectivity**: Verify RPC endpoints are accessible
4. **Check documentation**: Review QIE SDK and Hardhat documentation

## Security Best Practices

1. **Never commit private keys**: Use `.env` files and `.gitignore`
2. **Use testnet first**: Always test on testnets before mainnet
3. **Verify contracts**: Use block explorer verification
4. **Monitor gas usage**: Optimize for gas efficiency
5. **Regular updates**: Keep dependencies updated

## Next Steps

After setup:
1. Run the test suite to verify everything works
2. Deploy to testnet and test with real tokens
3. Review smart contract code and security
4. Plan your yield aggregation strategies
5. Deploy to mainnet when ready

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [QIE SDK Documentation](https://docs.qie.io)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Ethereum Development Tools](https://ethereum.org/en/developers/docs/development-networks/)
