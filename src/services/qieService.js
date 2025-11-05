const { ethers } = require('ethers');
const config = require('../config');

class QIEService {
  constructor() {
    this.qie = null;
    this.providers = {};
    this.initializeQIE();
  }

  initializeQIE() {
    try {
      // Initialize providers for different networks using ethers
      this.providers.ethereum = new ethers.JsonRpcProvider(config.networks.ethereum.rpcUrl);
      this.providers.polygon = new ethers.JsonRpcProvider(config.networks.polygon.rpcUrl);
      this.providers.bsc = new ethers.JsonRpcProvider(config.networks.bsc.rpcUrl);
      this.providers.testnet = new ethers.JsonRpcProvider(config.networks.testnet.rpcUrl);
      this.providers.mumbai = new ethers.JsonRpcProvider(config.networks.mumbai.rpcUrl);

      this.qie = {
        initialized: true,
        network: config.qie.network
      };

      console.log('QIE SDK initialized successfully (using ethers)');
    } catch (error) {
      console.error('Failed to initialize QIE SDK:', error);
      throw error;
    }
  }

  /**
   * Get QIE instance
   */
  getQIE() {
    if (!this.qie) {
      throw new Error('QIE SDK not initialized');
    }
    return this.qie;
  }

  /**
   * Get provider for specific network
   */
  getProvider(network) {
    if (!this.providers[network]) {
      throw new Error(`Provider for network ${network} not found`);
    }
    return this.providers[network];
  }

  /**
   * Connect wallet using QIE SDK
   */
  async connectWallet(walletType = 'metamask') {
    try {
      // Simulate QIE wallet connection
      const wallet = {
        address: '0x742d35Cc6634C0532925a3b8D3Ac6e4b7a4c6e8b',
        type: walletType,
        provider: this.providers.ethereum,
        connected: true
      };
      return wallet;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address, network = 'ethereum') {
    try {
      const provider = this.getProvider(network);
      const balance = await provider.getBalance(address);
      return balance;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw error;
    }
  }

  /**
   * Send transaction using QIE SDK
   */
  async sendTransaction(transaction, network = 'ethereum') {
    try {
      const provider = this.getProvider(network);
      const tx = await provider.sendTransaction(transaction);
      return tx;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Deploy contract using QIE SDK
   */
  async deployContract(contractData, network = 'ethereum') {
    try {
      const qie = this.getQIE();
      const provider = this.getProvider(network);
      
      const deployment = await qie.contract.deploy({
        provider,
        contractData,
        gasLimit: config.gas.limit,
        gasPrice: config.gas.price
      });

      return deployment;
    } catch (error) {
      console.error('Failed to deploy contract:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash, network = 'ethereum') {
    try {
      const provider = this.getProvider(network);
      const status = await provider.getTransactionStatus(txHash);
      return status;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo(network) {
    return config.networks[network] || null;
  }

  /**
   * Get all supported networks
   */
  getSupportedNetworks() {
    return Object.keys(config.networks);
  }
}

module.exports = new QIEService();
