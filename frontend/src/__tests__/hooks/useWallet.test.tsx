import { renderHook, act } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';

// Mock the store
const mockSetWallet = jest.fn();
const mockSetWalletConnected = jest.fn();
const mockSetError = jest.fn();
const mockAddNotification = jest.fn();

jest.mock('@/store', () => ({
  useStore: () => ({
    wallet: null,
    isWalletConnected: false
  }),
  useStoreActions: () => ({
    setWallet: mockSetWallet,
    setWalletConnected: mockSetWalletConnected,
    setError: mockSetError,
    addNotification: mockAddNotification
  })
}));

// Mock the QIE wallet service
const mockConnectWallet = jest.fn();
const mockDisconnectWallet = jest.fn();
const mockGetWalletInfo = jest.fn();
const mockSendTransaction = jest.fn();
const mockEstimateGas = jest.fn();
const mockGetGasPrice = jest.fn();
const mockSwitchNetwork = jest.fn();
const mockAddToken = jest.fn();
const mockGetTransactionStatus = jest.fn();

jest.mock('@/services/qieWalletService', () => ({
  qieWalletService: {
    connectWallet: mockConnectWallet,
    disconnectWallet: mockDisconnectWallet,
    getWalletInfo: mockGetWalletInfo,
    sendTransaction: mockSendTransaction,
    estimateGas: mockEstimateGas,
    getGasPrice: mockGetGasPrice,
    switchNetwork: mockSwitchNetwork,
    addToken: mockAddToken,
    getTransactionReceipt: mockGetTransactionStatus
  }
}));

describe('useWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.wallet).toBeNull();
    expect(result.current.isWalletConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isDisconnecting).toBe(false);
  });

  it('should connect wallet successfully', async () => {
    const mockWallet = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      balance: '1000000000000000000000',
      network: 'ethereum',
      chainId: 1,
      isConnected: true
    };

    mockConnectWallet.mockResolvedValue({ address: mockWallet.address });
    mockGetWalletInfo.mockResolvedValue(mockWallet);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connectWallet('privateKey');
    });

    expect(mockConnectWallet).toHaveBeenCalledWith('privateKey');
    expect(mockGetWalletInfo).toHaveBeenCalled();
    expect(mockSetWallet).toHaveBeenCalledWith(mockWallet);
    expect(mockSetWalletConnected).toHaveBeenCalledWith(true);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Wallet Connected'
      })
    );
  });

  it('should handle wallet connection error', async () => {
    const error = new Error('Connection failed');
    mockConnectWallet.mockRejectedValue(error);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      try {
        await result.current.connectWallet('privateKey');
      } catch (e) {
        // Expected to throw
      }
    });

    expect(mockSetError).toHaveBeenCalledWith('Connection failed');
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Connection Failed'
      })
    );
  });

  it('should disconnect wallet successfully', async () => {
    mockDisconnectWallet.mockResolvedValue(undefined);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.disconnectWallet();
    });

    expect(mockDisconnectWallet).toHaveBeenCalled();
    expect(mockSetWallet).toHaveBeenCalledWith(null);
    expect(mockSetWalletConnected).toHaveBeenCalledWith(false);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Wallet Disconnected'
      })
    );
  });

  it('should send transaction successfully', async () => {
    const mockTransaction = {
      to: '0xrecipient',
      value: '1000000000000000000',
      data: '0x'
    };

    const mockResult = {
      hash: '0xtxhash',
      status: 'pending'
    };

    mockSendTransaction.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      const txResult = await result.current.sendTransaction(mockTransaction);
      expect(txResult).toEqual(mockResult);
    });

    expect(mockSendTransaction).toHaveBeenCalledWith(mockTransaction);
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Transaction Sent'
      })
    );
  });

  it('should estimate gas successfully', async () => {
    const mockTransaction = {
      to: '0xrecipient',
      value: '1000000000000000000'
    };

    mockEstimateGas.mockResolvedValue(21000);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      const gasEstimate = await result.current.estimateGas(mockTransaction);
      expect(gasEstimate).toBe(21000);
    });

    expect(mockEstimateGas).toHaveBeenCalledWith(mockTransaction);
  });

  it('should get gas price successfully', async () => {
    mockGetGasPrice.mockResolvedValue('20.5');

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      const gasPrice = await result.current.getGasPrice();
      expect(gasPrice).toBe('20.5');
    });

    expect(mockGetGasPrice).toHaveBeenCalled();
  });
});
