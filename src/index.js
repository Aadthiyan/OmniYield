const express = require('express');
const cors = require('cors');
const winston = require('winston');
const config = require('./config');
const walletService = require('./services/walletService');
const qieService = require('./services/qieService');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'defi-yield-aggregator' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    environment: config.nodeEnv
  });
});

// API Routes
app.get(`/api/${config.apiVersion}/networks`, (req, res) => {
  try {
    const networks = qieService.getSupportedNetworks().map(network => ({
      name: network,
      info: qieService.getNetworkInfo(network)
    }));
    
    res.json({
      success: true,
      data: networks
    });
  } catch (error) {
    logger.error('Failed to get networks', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get networks'
    });
  }
});

// Wallet endpoints
app.post(`/api/${config.apiVersion}/wallet/connect`, async (req, res) => {
  try {
    const { walletType = 'metamask' } = req.body;
    const wallet = await walletService.connectQIEWallet(walletType);
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        type: wallet.type,
        connected: wallet.connected
      }
    });
  } catch (error) {
    logger.error('Failed to connect wallet', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get(`/api/${config.apiVersion}/wallet/balance/:address`, async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'ethereum' } = req.query;
    
    const balance = await walletService.getBalance(address, network);
    
    res.json({
      success: true,
      data: {
        address,
        network,
        balance
      }
    });
  } catch (error) {
    logger.error('Failed to get balance', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post(`/api/${config.apiVersion}/wallet/sign`, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const signature = await walletService.signMessage(message);
    
    res.json({
      success: true,
      data: {
        message,
        signature
      }
    });
  } catch (error) {
    logger.error('Failed to sign message', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Transaction endpoints
app.post(`/api/${config.apiVersion}/transaction/send`, async (req, res) => {
  try {
    const { transaction, network = 'ethereum' } = req.body;
    
    if (!transaction) {
      return res.status(400).json({
        success: false,
        error: 'Transaction data is required'
      });
    }
    
    const tx = await walletService.sendTransaction(transaction, network);
    
    res.json({
      success: true,
      data: {
        transactionHash: tx.hash,
        network,
        status: 'pending'
      }
    });
  } catch (error) {
    logger.error('Failed to send transaction', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.get(`/api/${config.apiVersion}/transaction/:txHash/status`, async (req, res) => {
  try {
    const { txHash } = req.params;
    const { network = 'ethereum' } = req.query;
    
    const status = await qieService.getTransactionStatus(txHash, network);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        network,
        status
      }
    });
  } catch (error) {
    logger.error('Failed to get transaction status', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Contract endpoints
app.post(`/api/${config.apiVersion}/contract/deploy`, async (req, res) => {
  try {
    const { contractData, network = 'ethereum' } = req.body;
    
    if (!contractData) {
      return res.status(400).json({
        success: false,
        error: 'Contract data is required'
      });
    }
    
    const deployment = await qieService.deployContract(contractData, network);
    
    res.json({
      success: true,
      data: {
        deployment,
        network
      }
    });
  } catch (error) {
    logger.error('Failed to deploy contract', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`DeFi Yield Aggregator API server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`API Version: ${config.apiVersion}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  
  // Initialize QIE service
  try {
    qieService.initializeQIE();
    logger.info('QIE SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize QIE SDK', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
