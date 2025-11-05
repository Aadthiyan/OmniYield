# DeFi Cross-Chain Yield Aggregator Backend

A comprehensive backend system for a cross-chain yield aggregator built with QIE SDK, Hardhat, and Node.js. This project enables users to optimize their DeFi yields across multiple blockchain networks.

## 🚀 Features

- **Cross-Chain Support**: Deploy and manage strategies across Ethereum, Polygon, BSC, and other networks
- **QIE SDK Integration**: Advanced blockchain interaction and wallet management
- **Yield Aggregation**: Automatically find and optimize the best yield opportunities
- **Multi-Wallet Support**: MetaMask, private key, and other wallet integrations
- **Comprehensive Testing**: Full test suite for contracts and wallet integrations
- **Gas Optimization**: Efficient transaction handling and gas management
- **Security**: Built with OpenZeppelin security patterns and best practices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**
- **MetaMask** browser extension (for wallet integration)
- **QIE SDK API Keys** (sign up at [QIE Platform](https://qie.io))

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd defi-cross-chain-yield-aggregator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Private Key (DO NOT COMMIT THIS TO VERSION CONTROL)
   PRIVATE_KEY=your_private_key_here
   
   # QIE SDK Configuration
   QIE_API_KEY=your_qie_api_key
   QIE_SECRET_KEY=your_qie_secret_key
   QIE_NETWORK=testnet
   
   # RPC URLs
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
   POLYGON_RPC_URL=https://polygon-rpc.com
   BSC_RPC_URL=https://bsc-dataseed.binance.org
   TESTNET_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
   
   # API Keys
   ETHERSCAN_API_KEY=your_etherscan_api_key
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   BSCSCAN_API_KEY=your_bscscan_api_key
   ```

## 🏗️ Project Structure

```
defi-cross-chain-yield-aggregator/
├── contracts/                 # Smart contracts
│   ├── YieldAggregator.sol   # Main yield aggregator contract
│   └── MockERC20.sol         # Mock token for testing
├── scripts/                  # Deployment and utility scripts
│   ├── deploy.js            # Main deployment script
│   ├── deploy-testnet.js    # Testnet deployment script
│   └── verify-contracts.js  # Contract verification script
├── test/                     # Test files
│   ├── YieldAggregator.test.js
│   └── wallet-integration.test.js
├── src/                      # Source code
│   ├── config/              # Configuration files
│   ├── services/            # Service modules
│   │   ├── qieService.js    # QIE SDK integration
│   │   └── walletService.js # Wallet management
│   └── index.js             # Main application entry
├── deployments/             # Deployment artifacts
├── hardhat.config.js        # Hardhat configuration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Local Development

Start a local Hardhat node:
```bash
npm run node
```

In a new terminal, deploy contracts locally:
```bash
npm run deploy:local
```

### 2. Testnet Deployment

Deploy to Goerli testnet:
```bash
npm run deploy:testnet
```

Deploy to Polygon Mumbai:
```bash
npm run deploy:polygon
```

### 3. Run Tests

Run all tests:
```bash
npm test
```

Run specific test suites:
```bash
npx hardhat test test/YieldAggregator.test.js
npx hardhat test test/wallet-integration.test.js
```

## 🔧 Configuration

### Network Configuration

The project supports multiple networks configured in `hardhat.config.js`:

- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **BSC** (Chain ID: 56)
- **Goerli Testnet** (Chain ID: 5)
- **Mumbai Testnet** (Chain ID: 80001)

### QIE SDK Configuration

The QIE SDK is configured to work with multiple providers:

```javascript
// Example usage
const qieService = require('./src/services/qieService');

// Connect wallet
const wallet = await qieService.connectWallet('metamask');

// Deploy contract
const deployment = await qieService.deployContract(contractData, 'ethereum');
```

### Wallet Integration

Support for multiple wallet types:

```javascript
const walletService = require('./src/services/walletService');

// Connect MetaMask
await walletService.connectMetaMask();

// Connect with private key
await walletService.connectPrivateKey(privateKey, 'ethereum');

// Switch networks
await walletService.switchNetwork('polygon');
```

## 📝 Smart Contracts

### YieldAggregator Contract

The main contract provides:

- **Strategy Management**: Add, update, and manage yield strategies
- **Deposit/Withdrawal**: Users can deposit and withdraw funds
- **Cross-Chain Transfers**: Initiate and complete cross-chain transactions
- **Fee Management**: Configurable performance and management fees
- **Pause Functionality**: Emergency pause/unpause capabilities

#### Key Functions:

```solidity
// Add a new strategy
function addStrategy(address strategyAddress, string memory name, uint256 performanceFee, uint256 managementFee)

// Deposit funds
function deposit(uint256 strategyId, uint256 amount)

// Withdraw funds
function withdraw(uint256 depositIndex, uint256 amount)

// Cross-chain transfer
function initiateCrossChainTransfer(uint256 amount, address token, uint256 targetChainId, address targetContract)
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run specific test file
npx hardhat test test/YieldAggregator.test.js
```

### Test Coverage

The test suite covers:

- ✅ Contract deployment and initialization
- ✅ Strategy management (add, update, activate/deactivate)
- ✅ Deposit and withdrawal functionality
- ✅ Cross-chain transfer mechanisms
- ✅ Fee calculations and collection
- ✅ Pause/unpause functionality
- ✅ Wallet integration (MetaMask, private key)
- ✅ QIE SDK integration
- ✅ Network switching
- ✅ Message signing
- ✅ Error handling

## 🚀 Deployment

### Local Deployment

1. Start local Hardhat node:
   ```bash
   npm run node
   ```

2. Deploy contracts:
   ```bash
   npm run deploy:local
   ```

### Testnet Deployment

1. Ensure you have testnet tokens (ETH for gas)

2. Deploy to testnet:
   ```bash
   npm run deploy:testnet
   ```

3. Verify contracts:
   ```bash
   npm run verify
   ```

### Mainnet Deployment

⚠️ **WARNING**: Only deploy to mainnet after thorough testing!

1. Update environment variables for mainnet
2. Deploy contracts:
   ```bash
   npm run deploy:ethereum
   npm run deploy:polygon
   npm run deploy:bsc
   ```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use `.env` files for sensitive data
- **Contract Audits**: Consider professional audits before mainnet deployment
- **Access Control**: Implement proper access controls for admin functions
- **Upgradeability**: Consider proxy patterns for contract upgrades

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:

- **Solidity 0.8.19**: Latest stable version with gas optimizations
- **OpenZeppelin**: Battle-tested security patterns
- **Efficient Storage**: Optimized data structures and storage patterns
- **Batch Operations**: Support for batch transactions where possible

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **QIE SDK**: Visit [QIE Documentation](https://docs.qie.io) for SDK-specific help

## 🔮 Roadmap

- [ ] Additional DEX integrations
- [ ] Advanced yield optimization algorithms
- [ ] Mobile wallet support
- [ ] Governance token implementation
- [ ] Cross-chain bridge integration
- [ ] Analytics dashboard
- [ ] API rate limiting and caching
- [ ] Automated testing on multiple networks

---

**Happy Yield Farming! 🚜💰**
