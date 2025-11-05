import { useState, useEffect, useCallback } from 'react';
import { useStore, useStoreActions } from '@/store';
import { qieWalletService } from '@/services/qieWalletService';
import { WalletInfo, QIEWallet, QIETransaction, QIETransactionResult } from '@/types';

export const useWallet = () => {
  const { wallet, isWalletConnected } = useStore();
  const { setWallet, setWalletConnected, setError, addNotification } = useStoreActions();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Connect wallet
  const connectWallet = useCallback(async (type: 'privateKey' | 'mnemonic' | 'hardware' = 'privateKey') => {
    try {
      setIsConnecting(true);
      setError(null);

      const qieWallet = await qieWalletService.connectWallet(type);
      const walletInfo = await qieWalletService.getWalletInfo();

      if (walletInfo) {
        setWallet(walletInfo);
        setWalletConnected(true);
        addNotification({
          type: 'success',
          title: 'Wallet Connected',
          message: `Successfully connected to wallet ${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`
        });
      } else {
        throw new Error('Failed to get wallet information');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage
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
        message: 'Wallet has been disconnected successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Disconnection Failed',
        message: errorMessage
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
        message: `Transaction ${result.hash.slice(0, 10)}... has been sent`
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: errorMessage
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
        message: `Switched to ${network} network`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Network Switch Failed',
        message: errorMessage
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
        message: `${symbol} has been added to your wallet`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add token';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Add Token Failed',
        message: errorMessage
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
