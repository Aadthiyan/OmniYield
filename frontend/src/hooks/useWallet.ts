import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { qieWalletService } from '@/services/qieWalletService';
import { WalletInfo, QIEWallet, QIETransaction, QIETransactionResult } from '@/types';

export const useWallet = () => {
  const wallet = useStore((state) => state.wallet);
  const isWalletConnected = useStore((state) => state.isWalletConnected);
  const setWallet = useStore((state) => state.setWallet);
  const setWalletConnected = useStore((state) => state.setWalletConnected);
  const setError = useStore((state) => state.setError);
  const addNotification = useStore((state) => state.addNotification);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);


  // Connect wallet (simplified for development)
  const connectWallet = useCallback(async (type: 'privateKey' | 'mnemonic' | 'hardware' = 'privateKey') => {
    try {
      setIsConnecting(true);
      setError(null);

      // For development: Use mock wallet data
      const mockWalletInfo: WalletInfo = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        balance: '1000000000000000000', // 1 ETH
        network: 'ethereum',
        chainId: 1,
        isConnected: true
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setWallet(mockWalletInfo);
      setWalletConnected(true);
      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Successfully connected to wallet ${mockWalletInfo.address.slice(0, 6)}...${mockWalletInfo.address.slice(-4)}`,
        read: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
        read: false
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [setWallet, setWalletConnected, setError, addNotification]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setIsDisconnecting(true);
      setError(null);

      await qieWalletService.disconnectWallet();
      setWallet(null);
      setWalletConnected(false);
      addNotification({
        type: 'info',
        title: 'Wallet Disconnected',
        message: 'Wallet has been disconnected successfully',
        read: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Disconnection Failed',
        message: errorMessage,
        read: false
      });
    } finally {
      setIsDisconnecting(false);
    }
  }, [setWallet, setWalletConnected, setError, addNotification]);

  // Refresh wallet info
  const refreshWallet = useCallback(async () => {
    if (!isWalletConnected) return;

    try {
      const walletInfo = await qieWalletService.getWalletInfo();
      if (walletInfo) {
        setWallet(walletInfo);
      }
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
    }
  }, [isWalletConnected, setWallet]);

  // Send transaction
  const sendTransaction = useCallback(async (transaction: QIETransaction): Promise<QIETransactionResult> => {
    if (!isWalletConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setError(null);
      const result = await qieWalletService.sendTransaction(transaction);

      addNotification({
        type: 'success',
        title: 'Transaction Sent',
        message: `Transaction ${result.hash.slice(0, 10)}... has been sent`,
        read: false
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: errorMessage,
        read: false
      });
      throw error;
    }
  }, [isWalletConnected, setError, addNotification]);

  // Estimate gas
  const estimateGas = useCallback(async (transaction: QIETransaction): Promise<number> => {
    if (!isWalletConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await qieWalletService.estimateGas(transaction);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }, [isWalletConnected]);

  // Get gas price
  const getGasPrice = useCallback(async (): Promise<string> => {
    try {
      return await qieWalletService.getGasPrice();
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (network: string) => {
    try {
      setError(null);
      await qieWalletService.switchNetwork(network as any);
      addNotification({
        type: 'success',
        title: 'Network Switched',
        message: `Switched to ${network} network`,
        read: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Network Switch Failed',
        message: errorMessage,
        read: false
      });
      throw error;
    }
  }, [setError, addNotification]);

  // Add token to wallet
  const addToken = useCallback(async (tokenAddress: string, symbol: string, decimals: number, image?: string) => {
    try {
      setError(null);
      await qieWalletService.addToken(tokenAddress, symbol, decimals, image);
      addNotification({
        type: 'success',
        title: 'Token Added',
        message: `${symbol} has been added to your wallet`,
        read: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add token';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Add Token Failed',
        message: errorMessage,
        read: false
      });
      throw error;
    }
  }, [setError, addNotification]);

  // Get transaction status
  const getTransactionStatus = useCallback(async (txHash: string) => {
    try {
      const receipt = await qieWalletService.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }, []);

  // Auto-refresh wallet info periodically
  useEffect(() => {
    if (!isWalletConnected) return;

    const interval = setInterval(refreshWallet, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isWalletConnected, refreshWallet]);

  return {
    wallet,
    isWalletConnected,
    isConnecting,
    isDisconnecting,
    connectWallet,
    disconnectWallet,
    refreshWallet,
    sendTransaction,
    estimateGas,
    getGasPrice,
    switchNetwork,
    addToken,
    getTransactionStatus
  };
};
