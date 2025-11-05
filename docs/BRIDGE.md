# Cross-Chain Bridge Integration

This project provides comprehensive cross-chain bridge integration supporting both Wormhole and ChainBridge protocols for asset interoperability and wrapped token transfers between QIE and external chains.

## 🏗️ Architecture

### Core Components

- **`contracts/WrappedToken.sol`**: ERC20 token with role-based access control for bridge-controlled minting/burning
- **`contracts/BridgeAdapter.sol`**: Generic adapter contract exposing `lock/mint/burn/release` functions
- **`src/services/bridgeService.js`**: Enhanced service with real protocol integration and validation
- **`backend/app/routers/bridge_routes.py`**: REST API endpoints for cross-chain operations
- **`scripts/deploy-bridge.js`**: Deployment script for bridge infrastructure

### Supported Protocols

- **Wormhole**: Multi-chain message passing protocol with guardian network
- **ChainBridge**: Modular cross-chain communication protocol
- **Simulation Mode**: For testing and development without real bridge protocols

## 🚀 Quick Start

### 1. Environment Setup

Add the following to your `.env` file:

```env
# Bridge Protocol Selection
BRIDGE_PROTOCOL=wormhole  # or chainbridge

# Wormhole Configuration
WORMHOLE_CORE_ADDRESS=0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B
WORMHOLE_TOKEN_BRIDGE_ADDRESS=0x3ee18B2214AFF97000D97cf8261A47B073D7F2C8

# ChainBridge Configuration
CHAINBRIDGE_BRIDGE_ADDRESS=0x...
CHAINBRIDGE_HANDLER_ADDRESS=0x...

# Remote Chain Configuration
REMOTE_CHAIN_ID=137  # Polygon
REMOTE_WRAPPED_TOKEN_ADDRESS=0x...

# Wrapped Token Configuration
WRAPPED_TOKEN_NAME="Wrapped QIE"
WRAPPED_TOKEN_SYMBOL=WQIE
WRAPPED_TOKEN_DECIMALS=18
```

### 2. Installation

```bash
# Install dependencies
npm install

# Install bridge protocol SDKs
npm install @wormhole-foundation/sdk @chainbridge/sdk
```

### 3. Deployment

```bash
# Start local node
npm run node

# Deploy bridge contracts
npx hardhat run scripts/deploy-bridge.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy-bridge.js --network testnet
```

## 🔄 Cross-Chain Transfer Flows

### Token Wrapping (Source → Destination)

```javascript
// 1. User approves bridge adapter to spend tokens
await canonicalToken.approve(bridgeAdapter.address, amount);

// 2. Lock canonical tokens on source chain
await bridgeAdapter.lock(
  canonicalToken.address,
  amount,
  destinationChainId,
  destinationAddress
);

// 3. Off-chain relayer observes event and submits proof
// 4. Mint wrapped tokens on destination chain
await bridgeAdapter.mint(
  destinationAddress,
  amount,
  sourceChainId,
  sourceTransactionHash
);
```

### Token Unwrapping (Destination → Source)

```javascript
// 1. Burn wrapped tokens on destination chain
await bridgeAdapter.burn(
  amount,
  sourceChainId,
  sourceAddress
);

// 2. Off-chain relayer submits proof to source chain
// 3. Release canonical tokens on source chain
await bridgeAdapter.release(
  canonicalToken.address,
  sourceAddress,
  amount,
  destinationChainId,
  destinationTransactionHash
);
```

## 🌐 API Integration

### REST API Endpoints

#### Get Bridge Configuration
```http
GET /bridge/protocol
```

#### Initiate Cross-Chain Transfer
```http
POST /bridge/transfer/lock-and-mint
Content-Type: application/json

{
  "token": "0x...",
  "amount": "1000000000000000000",
  "to": "0x...",
  "srcChain": "ethereum",
  "dstChain": "polygon",
  "privateKey": "0x..."
}
```

#### Check Transfer Status
```http
GET /bridge/transfer/status/{transferId}
```

#### Validate Transfer Parameters
```http
POST /bridge/validate
Content-Type: application/json

{
  "token": "0x...",
  "amount": "1000000000000000000",
  "to": "0x...",
  "srcChain": "ethereum",
  "dstChain": "polygon"
}
```

### JavaScript SDK Usage

```javascript
const bridgeService = require('./src/services/bridgeService');

// Initialize bridge service
const bridge = new BridgeService();

// Get supported chains
const chains = bridge.getSupportedChains();
console.log('Supported chains:', chains);

// Validate transfer parameters
const validation = bridge.validateTransferParams({
  token: '0x...',
  amount: ethers.parseEther('100'),
  to: '0x...',
  srcChain: 'ethereum',
  dstChain: 'polygon'
});

if (validation.valid) {
  // Execute cross-chain transfer
  const result = await bridge.lockAndMint({
    token: '0x...',
    amount: ethers.parseEther('100'),
    to: '0x...',
    srcChain: 'ethereum',
    dstChain: 'polygon',
    privateKey: '0x...'
  });
  
  console.log('Transfer initiated:', result);
}
```

## 🧪 Testing

### Run Bridge Tests

```bash
# Run all bridge tests
npx hardhat test test/Bridge.test.js

# Run cross-chain integration tests
npx hardhat test test/CrossChainBridge.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test test/Bridge.test.js
```

### Test Coverage

The test suite covers:

- ✅ **Token Wrapping**: Lock canonical → Mint wrapped
- ✅ **Token Unwrapping**: Burn wrapped → Release canonical
- ✅ **Balance Validation**: Verify token balances before/after transfers
- ✅ **Multi-User Scenarios**: Concurrent transfers from multiple users
- ✅ **Error Handling**: Invalid parameters, insufficient balances, unauthorized access
- ✅ **Gas Optimization**: Efficient gas usage for multiple operations
- ✅ **Cross-Chain Simulation**: End-to-end transfer simulation
- ✅ **Parameter Validation**: Input validation and error messages

## 🔧 Configuration

### Network Support

| Protocol | Ethereum | Polygon | BSC | Avalanche | Fantom |
|----------|----------|---------|-----|-----------|--------|
| Wormhole | ✅ | ✅ | ✅ | ✅ | ✅ |
| ChainBridge | ✅ | ✅ | ✅ | ❌ | ❌ |

### Gas Optimization

- **Batch Operations**: Support for multiple transfers in single transaction
- **Efficient Storage**: Optimized data structures for minimal gas usage
- **Role-Based Access**: Efficient access control patterns
- **Event Optimization**: Minimal event data for gas efficiency

## 🛡️ Security Features

### Access Control
- **Role-Based Permissions**: MINTER_ROLE and BURNER_ROLE for controlled operations
- **Operator Validation**: Only authorized operators can mint/release tokens
- **Owner Controls**: Contract owner can update operators and configurations

### Validation
- **Parameter Validation**: Comprehensive input validation
- **Balance Checks**: Verify sufficient balances before operations
- **Address Validation**: Ethereum address format validation
- **Amount Validation**: Positive amount and overflow protection

### Error Handling
- **Custom Errors**: Gas-efficient custom error messages
- **Revert Conditions**: Clear revert conditions for failed operations
- **Event Logging**: Comprehensive event logging for monitoring

## 📊 Monitoring and Analytics

### Events

```solidity
event Locked(address indexed user, address indexed token, uint256 amount, uint256 dstChainId, bytes to);
event Minted(address indexed to, uint256 amount, uint256 srcChainId, bytes srcTx);
event Burned(address indexed from, uint256 amount, uint256 dstChainId, bytes to);
event Released(address indexed to, address indexed token, uint256 amount, uint256 srcChainId, bytes srcTx);
```

### Health Checks

```http
GET /bridge/health
```

Response:
```json
{
  "status": "healthy",
  "protocol": "wormhole",
  "supportedChains": 5,
  "message": "Bridge service is operational"
}
```

## 🚀 Production Deployment

### Prerequisites

1. **Real Bridge Protocol Integration**: Replace simulation mode with actual SDK calls
2. **Guardian/Validator Setup**: Configure Wormhole guardians or ChainBridge validators
3. **Monitoring**: Set up comprehensive monitoring and alerting
4. **Security Audit**: Professional security audit before mainnet deployment

### Deployment Steps

1. **Configure Environment**: Set up production environment variables
2. **Deploy Contracts**: Deploy to target networks
3. **Verify Contracts**: Verify contracts on block explorers
4. **Initialize Roles**: Set up operator roles and permissions
5. **Test Integration**: Comprehensive testing on testnets
6. **Monitor**: Set up monitoring and alerting systems

## 🔮 Future Enhancements

- **Additional Protocols**: Support for LayerZero, Hyperlane, and other bridge protocols
- **Automated Relaying**: Automated relayer infrastructure
- **Cross-Chain Governance**: Governance token for bridge operations
- **Advanced Analytics**: Detailed analytics and reporting dashboard
- **Mobile Support**: Mobile wallet integration
- **Gas Optimization**: Further gas optimization techniques

## 🆘 Troubleshooting

### Common Issues

1. **"Bridge service not available"**: Ensure bridge service is properly initialized
2. **"Invalid transfer parameters"**: Check address formats and amount values
3. **"Insufficient balance"**: Verify token balances before transfers
4. **"Unauthorized access"**: Check operator roles and permissions

### Support

- **Documentation**: Check this guide and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Community**: Join our Discord for community support

---

**Happy Cross-Chain Bridging! 🌉🚀**


