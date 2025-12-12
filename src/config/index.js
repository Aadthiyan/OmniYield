require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  apiVersion: process.env.API_VERSION || 'v1',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Blockchain Networks
  networks: {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL,
      chainId: 1,
      name: 'Ethereum Mainnet',
      symbol: 'ETH'
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL,
      chainId: 137,
      name: 'Polygon',
      symbol: 'MATIC'
    },
    bsc: {
      rpcUrl: process.env.BSC_RPC_URL,
      chainId: 56,
      name: 'Binance Smart Chain',
      symbol: 'BNB'
    },
    testnet: {
      rpcUrl: process.env.TESTNET_RPC_URL,
      chainId: 5,
      name: 'Goerli Testnet',
      symbol: 'ETH'
    },
    mumbai: {
      rpcUrl: process.env.MUMBAI_RPC_URL,
      chainId: 80001,
      name: 'Mumbai Testnet',
      symbol: 'MATIC'
    }
    ,
    qie: {
      rpcUrl: process.env.QIE_RPC_URL,
      chainId: process.env.QIE_CHAIN_ID ? Number(process.env.QIE_CHAIN_ID) : undefined,
      name: 'QIE',
      symbol: 'QIE'
    }
  },

  // QIE SDK Configuration
  qie: {
    apiKey: process.env.QIE_API_KEY,
    secretKey: process.env.QIE_SECRET_KEY,
    network: process.env.QIE_NETWORK || 'testnet'
  },

  // Gas Configuration
  gas: {
    limit: process.env.GAS_LIMIT || 500000,
    price: process.env.GAS_PRICE || '20000000000'
  },

  // Contract Addresses
  contracts: {
    bridge: process.env.BRIDGE_CONTRACT_ADDRESS,
    yieldAggregator: process.env.YIELD_AGGREGATOR_ADDRESS
  },

  // Bridge Configuration
  bridge: {
    protocol: process.env.BRIDGE_PROTOCOL || 'wormhole',
    wormhole: {
      core: process.env.WORMHOLE_CORE_ADDRESS,
      tokenBridge: process.env.WORMHOLE_TOKEN_BRIDGE_ADDRESS
    },
    chainbridge: {
      bridge: process.env.CHAINBRIDGE_BRIDGE_ADDRESS,
      erc20Handler: process.env.CHAINBRIDGE_HANDLER_ADDRESS
    },
    remote: {
      chainId: process.env.REMOTE_CHAIN_ID,
      wrappedToken: process.env.REMOTE_WRAPPED_TOKEN_ADDRESS
    },
    wrappedToken: {
      name: process.env.WRAPPED_TOKEN_NAME || 'Wrapped QIE',
      symbol: process.env.WRAPPED_TOKEN_SYMBOL || 'WQIE',
      decimals: Number(process.env.WRAPPED_TOKEN_DECIMALS || 18)
    }
  },

  // API Keys
  apiKeys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
    polygonscan: process.env.POLYGONSCAN_API_KEY,
    bscscan: process.env.BSCSCAN_API_KEY,
    infura: process.env.INFURA_KEY
  }
};

module.exports = config;
