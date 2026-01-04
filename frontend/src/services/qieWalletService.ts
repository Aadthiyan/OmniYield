import { ethers } from 'ethers';
import { QIEConfig, QIEWallet, QIETransaction, QIETransactionResult, WalletInfo, Network } from '@/types';

// Extend Window interface to include QIE wallet
declare global {
  interface Window {
    qie?: any;
    ethereum?: any;
  }
}

// QIE SDK with Browser Extension Support
class QIESDK {
  private config: QIEConfig;
  private wallet: QIEWallet | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private isExtensionWallet: boolean = false;

  constructor(config: QIEConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      // Try to use QIE extension provider first
      if (typeof window !== 'undefined' && window.qie) {
        console.log('🔌 QIE Extension detected!');
        this.provider = new ethers.BrowserProvider(window.qie);
        this.isExtensionWallet = true;
      }
      // Fallback to Ethereum provider if QIE uses standard ethereum object
      else if (typeof window !== 'undefined' && window.ethereum) {
        console.log('🔌 Ethereum-compatible provider detected, checking if it\'s QIE...');
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.isExtensionWallet = true;
      }
      // Fallback to RPC provider
      else {
        console.log('📡 No extension detected, using RPC provider');
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        this.isExtensionWallet = false;
      }
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      // Fallback to RPC
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      this.isExtensionWallet = false;
    }
  }

  async connectWallet(type: 'privateKey' | 'mnemonic' | 'hardware' = 'privateKey'): Promise<QIEWallet> {
    try {
      // If extension is available, use it
      if (this.isExtensionWallet && this.provider) {
        console.log('🔗 Connecting to QIE Extension Wallet...');

        const browserProvider = this.provider as ethers.BrowserProvider;

        // Request account access
        const accounts = await browserProvider.send('eth_requestAccounts', []);

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found in QIE wallet');
        }

        const address = accounts[0];
        this.signer = await browserProvider.getSigner();

        this.wallet = {
          address: address,
          type: 'extension'
        };

        console.log('✅ Connected to QIE Extension:', address);
        return this.wallet;
      }

      // Fallback to mock wallet generation (for testing without extension)
      console.log('⚠️ QIE Extension not detected, generating mock wallet');

      if (type === 'privateKey') {
        const wallet = ethers.Wallet.createRandom();
        this.wallet = {
          address: wallet.address,
          privateKey: wallet.privateKey,
          type: 'privateKey'
        };
      } else if (type === 'mnemonic') {
        const wallet = ethers.Wallet.createRandom();
        this.wallet = {
          address: wallet.address,
          mnemonic: wallet.mnemonic?.phrase,
          type: 'mnemonic'
        };
      } else {
        throw new Error('Hardware wallet integration not implemented');
      }

      return this.wallet;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.wallet = null;
    this.signer = null;
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.wallet || !this.provider) {
      console.error('❌ Wallet or provider not initialized');
      return null;
    }

    try {
      console.log('🔍 Fetching wallet info for:', this.wallet.address);
      console.log('🌐 Using provider type:', this.isExtensionWallet ? 'Extension' : 'RPC');

      const balance = await this.provider.getBalance(this.wallet.address);
      console.log('✅ Balance retrieved:', ethers.formatEther(balance), 'QIE');

      // Get network info
      const network = await this.provider.getNetwork();

      return {
        address: this.wallet.address,
        balance: balance.toString(),
        network: this.config.network,
        chainId: Number(network.chainId),
        isConnected: true,
        provider: this.provider
      };
    } catch (error) {
      console.error('❌ Failed to get wallet info:', error);
      console.error('Provider type:', this.isExtensionWallet ? 'Extension' : 'RPC');
      console.error('Wallet Address:', this.wallet.address);

      // Return wallet info with zero balance instead of null to allow connection
      return {
        address: this.wallet.address,
        balance: '0',
        network: this.config.network,
        chainId: this.config.chainId,
        isConnected: true,
        provider: this.provider
      };
    }
  }

  async sendTransaction(transaction: QIETransaction): Promise<QIETransactionResult> {
    if (!this.wallet || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      let tx;

      // Use extension signer if available
      if (this.isExtensionWallet && this.signer) {
        console.log('📤 Sending transaction via QIE Extension...');
        tx = await this.signer.sendTransaction({
          to: transaction.to,
          value: transaction.value ? ethers.parseEther(transaction.value) : 0,
          data: transaction.data,
          gasLimit: transaction.gasLimit,
          gasPrice: transaction.gasPrice ? ethers.parseUnits(transaction.gasPrice, 'gwei') : undefined,
          nonce: transaction.nonce
        });
      } else {
        // Use private key wallet
        const wallet = new ethers.Wallet(this.wallet.privateKey!, this.provider);
        tx = await wallet.sendTransaction({
          to: transaction.to,
          value: transaction.value ? ethers.parseEther(transaction.value) : 0,
          data: transaction.data,
          gasLimit: transaction.gasLimit,
          gasPrice: transaction.gasPrice ? ethers.parseUnits(transaction.gasPrice, 'gwei') : undefined,
          nonce: transaction.nonce
        });
      }

      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        status: receipt ? 'confirmed' : 'pending',
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : undefined,
        receipt
      };
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async estimateGas(transaction: QIETransaction): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const gasEstimate = await this.provider.estimateGas({
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value) : 0,
        data: transaction.data
      });

      return Number(gasEstimate);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }

  async getTransaction(txHash: string): Promise<any> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  async switchNetwork(network: Network): Promise<void> {
    if (this.isExtensionWallet && window.qie) {
      try {
        // Try to switch network in the extension
        await window.qie.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${this.config.chainId.toString(16)}` }],
        });
      } catch (error) {
        console.error('Failed to switch network in extension:', error);
      }
    }
    console.log(`Switching to network: ${network}`);
  }

  async addToken(tokenAddress: string, symbol: string, decimals: number, image?: string): Promise<void> {
    if (this.isExtensionWallet && window.qie) {
      try {
        await window.qie.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: symbol,
              decimals: decimals,
              image: image,
            },
          },
        });
      } catch (error) {
        console.error('Failed to add token to extension:', error);
      }
    }
    console.log(`Adding token: ${symbol} (${tokenAddress})`);
  }

  isUsingExtension(): boolean {
    return this.isExtensionWallet;
  }
}

// QIE Wallet Service
export class QIEWalletService {
  private sdk: QIESDK | null = null;
  private currentWallet: QIEWallet | null = null;

  constructor() {
    this.initializeSDK();
  }

  private initializeSDK() {
    const config: QIEConfig = {
      network: (process.env.NEXT_PUBLIC_QIE_NETWORK as Network) || 'mainnet',
      rpcUrl: process.env.NEXT_PUBLIC_QIE_RPC_URL || 'https://rpc-main1.qiblockchain.online/',
      chainId: parseInt(process.env.NEXT_PUBLIC_QIE_CHAIN_ID || '5656'),
      apiKey: process.env.NEXT_PUBLIC_QIE_API_KEY,
      secretKey: process.env.NEXT_PUBLIC_QIE_SECRET_KEY
    };

    // Log network configuration for debugging
    console.log('🔗 QIE Wallet Service Initialized:');
    console.log(`   Network: ${config.network}`);
    console.log(`   RPC URL: ${config.rpcUrl}`);
    console.log(`   Chain ID: ${config.chainId}`);
    console.log(`   Using ${config.chainId === 5656 ? 'QIE MAINNET ✅' : config.chainId === 31337 ? 'LOCAL DEVELOPMENT' : 'CUSTOM NETWORK'}`);

    this.sdk = new QIESDK(config);
  }

  private getRpcUrl(network: Network): string {
    // If custom RPC URL is provided, use it
    if (process.env.NEXT_PUBLIC_QIE_RPC_URL) {
      return process.env.NEXT_PUBLIC_QIE_RPC_URL;
    }

    const rpcUrls = {
      ethereum: 'https://mainnet.infura.io/v3/your_key',
      polygon: 'https://polygon-rpc.com',
      bsc: 'https://bsc-dataseed.binance.org',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      optimism: 'https://mainnet.optimism.io',
      testnet: 'https://rpc-main1.qiblockchain.online/', // QIE uses mainnet for development (near-zero fees)
      mainnet: 'https://rpc-main1.qiblockchain.online/'
    };

    return rpcUrls[network] || rpcUrls.mainnet;
  }

  async connectWallet(type: 'privateKey' | 'mnemonic' | 'hardware' = 'privateKey'): Promise<QIEWallet> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      this.currentWallet = await this.sdk.connectWallet(type);
      return this.currentWallet;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      await this.sdk.disconnectWallet();
      this.currentWallet = null;
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.sdk) {
      return null;
    }

    try {
      return await this.sdk.getWalletInfo();
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }

  async sendTransaction(transaction: QIETransaction): Promise<QIETransactionResult> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      return await this.sdk.sendTransaction(transaction);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async estimateGas(transaction: QIETransaction): Promise<number> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      return await this.sdk.estimateGas(transaction);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<string> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      return await this.sdk.getGasPrice();
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      return await this.sdk.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }

  async getTransaction(txHash: string): Promise<any> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      return await this.sdk.getTransaction(txHash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  async switchNetwork(network: Network): Promise<void> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      await this.sdk.switchNetwork(network);
      // Reinitialize SDK with new network
      this.initializeSDK();
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }

  async addToken(tokenAddress: string, symbol: string, decimals: number, image?: string): Promise<void> {
    if (!this.sdk) {
      throw new Error('QIE SDK not initialized');
    }

    try {
      await this.sdk.addToken(tokenAddress, symbol, decimals, image);
    } catch (error) {
      console.error('Failed to add token:', error);
      throw error;
    }
  }

  getCurrentWallet(): QIEWallet | null {
    return this.currentWallet;
  }

  isConnected(): boolean {
    return this.currentWallet !== null;
  }

  isUsingExtension(): boolean {
    return this.sdk?.isUsingExtension() || false;
  }
}

// Export singleton instance
export const qieWalletService = new QIEWalletService();
