// Core types for the DeFi Yield Aggregator Frontend

export interface User {
  id: string;
  name: string;
  walletAddress?: string;
  email?: string;
  isActive: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'ETH' | 'BTC';
  notifications: NotificationSettings;
  riskTolerance: number; // 0-1 scale
  defaultSlippage: number; // 0-1 scale
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  yieldAlerts: boolean;
  riskAlerts: boolean;
  transactionUpdates: boolean;
}

export interface Strategy {
  id: number;
  name: string;
  type: StrategyType;
  contractAddress: string;
  network: Network;
  apy: number;
  tvl: number;
  riskScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export type StrategyType =
  | 'compound'
  | 'uniswap_v3'
  | 'aave'
  | 'curve'
  | 'staking'
  | 'lending'
  | 'farming';

export type Network =
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'optimism'
  | 'mainnet'
  | 'testnet';

export interface YieldData {
  id: number;
  strategyId: number;
  apy: number;
  tvl: number;
  network: Network;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface UserStrategy {
  id: number;
  userId: number;
  strategyId: number;
  amount: string; // BigInt as string
  weight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  strategy?: Strategy;
}

export interface OptimizationRequest {
  totalAmount: string;
  strategies: StrategyWeight[];
  riskTolerance: number;
  maxSlippage: number;
}

export interface StrategyWeight {
  strategyId: number;
  weight: number;
}

export interface OptimizationResponse {
  optimalAllocations: OptimalAllocation[];
  expectedApy: number;
  riskScore: number;
  totalAmount: string;
  createdAt: string;
}

export interface OptimalAllocation {
  strategyId: number;
  name: string;
  type: StrategyType;
  contractAddress: string;
  network: Network;
  amount: string;
  weight: number;
  expectedYield: number;
  riskScore: number;
}

export interface Transaction {
  id: number;
  userId: number;
  txHash: string;
  type: TransactionType;
  amount: string;
  tokenAddress: string;
  network: Network;
  status: TransactionStatus;
  gasUsed?: number;
  gasPrice?: number;
  blockNumber?: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export type TransactionType =
  | 'deposit'
  | 'withdraw'
  | 'rebalance'
  | 'swap'
  | 'bridge'
  | 'claim';

export type TransactionStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface UserAnalytics {
  totalDeposited: string;
  totalWithdrawn: string;
  totalYieldEarned: string;
  currentTvl: string;
  averageApy: number;
  lastUpdated?: string;
}

export interface SystemAnalytics {
  totalStrategies: number;
  totalTvl: string;
  averageApy: number;
  networkBreakdown: Record<Network, NetworkStats>;
  dailyMetrics: DailyMetric[];
}

export interface NetworkStats {
  count: number;
  tvl: string;
  averageApy: number;
}

export interface DailyMetric {
  date: string;
  averageApy: number;
  totalTvl: string;
}

export interface YieldTrend {
  date: string;
  averageApy: number;
  totalTvl: string;
}

export interface RebalanceRequest {
  userId: number;
  targetAllocations: StrategyWeight[];
}

export interface RebalanceResponse {
  rebalanceActions: RebalanceAction[];
  estimatedGasCost: number;
  estimatedSlippage: number;
}

export interface RebalanceAction {
  strategyId: number;
  action: 'deposit' | 'withdraw';
  amount: string;
  currentAmount: string;
  targetAmount: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  network: Network;
  chainId: number;
  isConnected: boolean;
  provider?: any;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  price?: number;
  balance?: string;
}

export interface PortfolioSummary {
  totalValue: string;
  totalYield: string;
  dailyChange: string;
  dailyChangePercent: number;
  strategies: PortfolioStrategy[];
  allocation: AllocationData[];
}

export interface PortfolioStrategy {
  strategyId: number;
  name: string;
  type: StrategyType;
  amount: string;
  value: string;
  apy: number;
  yield: string;
  weight: number;
  change24h: number;
}

export interface AllocationData {
  name: string;
  value: number;
  color: string;
  amount: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// QIE SDK Types
export interface QIEConfig {
  network: Network;
  rpcUrl: string;
  chainId: number;
  apiKey?: string;
  secretKey?: string;
}

export interface QIEWallet {
  address: string;
  privateKey?: string;
  mnemonic?: string;
  type: 'privateKey' | 'mnemonic' | 'hardware' | 'extension';
}

export interface QIETransaction {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  gasPrice?: string;
  nonce?: number;
}

export interface QIETransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  receipt?: any;
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalState {
  isOpen: boolean;
  type: 'connect-wallet' | 'optimize' | 'rebalance' | 'transaction' | 'settings';
  data?: any;
}

// Form Types
export interface OptimizeFormData {
  totalAmount: string;
  strategies: StrategyWeight[];
  riskTolerance: number;
  maxSlippage: number;
}

export interface RebalanceFormData {
  targetAllocations: StrategyWeight[];
}

export interface SettingsFormData {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'ETH' | 'BTC';
  riskTolerance: number;
  defaultSlippage: number;
  notifications: NotificationSettings;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface ConnectWalletRequest {
  walletAddress: string;
  signature?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface AuthToken {
  accessToken: string;
  tokenType: string;
}
