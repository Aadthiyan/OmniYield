const { ethers } = require('ethers');
const qieService = require('./qieService');
const config = require('../config');

class WalletService {
  constructor() {
    this.wallets = new Map();
    this.currentWallet = null;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectMetaMask() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Browser environment
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const wallet = {
          address,
          provider,
          signer,
          type: 'metamask',
          connected: true
        };

        this.wallets.set('metamask', wallet);
        this.currentWallet = wallet;

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        console.log('MetaMask connected:', address);
        return wallet;
      } else {
        throw new Error('MetaMask not detected');
      }
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      throw error;
    }
  }

  /**
   * Connect wallet using private key
   */
  async connectPrivateKey(privateKey, network = 'ethereum') {
    try {
      const provider = qieService.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);
      
      const walletData = {
        address: wallet.address,
        provider: wallet.provider,
        signer: wallet,
        type: 'privatekey',
        network,
        connected: true
      };

      this.wallets.set(`privatekey_${network}`, walletData);
      this.currentWallet = walletData;

      console.log('Private key wallet connected:', wallet.address);
      return walletData;
    } catch (error) {
      console.error('Failed to connect private key wallet:', error);
      throw error;
    }
  }

  /**
   * Connect wallet using QIE SDK
   */
  async connectQIEWallet(walletType = 'metamask') {
    try {
      const wallet = await qieService.connectWallet(walletType);
      
      const walletData = {
        address: wallet.address,
        provider: wallet.provider,
        signer: wallet.signer,
        type: walletType,
        qieWallet: wallet,
        connected: true
      };

      this.wallets.set(walletType, walletData);
      this.currentWallet = walletData;

      console.log('QIE wallet connected:', wallet.address);
      return walletData;
    } catch (error) {
      console.error('Failed to connect QIE wallet:', error);
      throw error;
    }
  }

  /**
   * Get current wallet
   */
  getCurrentWallet() {
    return this.currentWallet;
  }

  /**
   * Get wallet by type
   */
  getWallet(type) {
    return this.wallets.get(type);
  }

  /**
   * Get all connected wallets
   */
  getAllWallets() {
    return Array.from(this.wallets.values());
  }

  /**
   * Get wallet balance
   */
  async getBalance(address, network = 'ethereum') {
    try {
      const balance = await qieService.getWalletBalance(address, network);
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction, network = 'ethereum') {
    try {
      const wallet = this.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const tx = await qieService.sendTransaction(transaction, network);
      return tx;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Sign message
   */
  async signMessage(message) {
    try {
      const wallet = this.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const signature = await wallet.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(type) {
    if (type) {
      this.wallets.delete(type);
      if (this.currentWallet && this.currentWallet.type === type) {
        this.currentWallet = null;
      }
    } else {
      this.wallets.clear();
      this.currentWallet = null;
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(network) {
    try {
      const networkInfo = qieService.getNetworkInfo(network);
      if (!networkInfo) {
        throw new Error(`Unsupported network: ${network}`);
      }

      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkInfo.chainId.toString(16)}` }],
        });
      }

      console.log(`Switched to ${network} network`);
      return networkInfo;
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks() {
    return qieService.getSupportedNetworks();
  }
}

module.exports = new WalletService();
