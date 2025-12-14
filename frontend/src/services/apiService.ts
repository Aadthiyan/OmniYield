import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Strategy,
  YieldData,
  OptimizationRequest,
  OptimizationResponse,
  UserAnalytics,
  SystemAnalytics,
  YieldTrend,
  RebalanceRequest,
  RebalanceResponse,
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  SignupRequest,
  ConnectWalletRequest,
  AuthResponse,
  AuthToken
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Strategies
  async getStrategies(network?: string, activeOnly: boolean = true): Promise<Strategy[]> {
    const params = new URLSearchParams();
    if (network) params.append('network', network);
    if (activeOnly) params.append('active_only', 'true');

    const response = await this.api.get(`/api/v1/yield/strategies?${params}`);
    // Transform snake_case to camelCase
    return response.data.map((strategy: any) => ({
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      contractAddress: strategy.contract_address,
      network: strategy.network,
      apy: strategy.apy,
      tvl: strategy.tvl,
      riskScore: strategy.risk_score,
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      metadata: strategy.meta_data
    }));
  }

  async getStrategy(strategyId: number): Promise<Strategy> {
    const response = await this.api.get(`/api/v1/yield/strategies/${strategyId}`);
    // Transform snake_case to camelCase
    const strategy = response.data;
    return {
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      contractAddress: strategy.contract_address,
      network: strategy.network,
      apy: strategy.apy,
      tvl: strategy.tvl,
      riskScore: strategy.risk_score,
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      metadata: strategy.meta_data
    };
  }

  async createStrategy(strategyData: any): Promise<Strategy> {
    const response = await this.api.post('/api/v1/yield/strategies', strategyData);
    // Transform snake_case to camelCase
    const strategy = response.data;
    return {
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      contractAddress: strategy.contract_address,
      network: strategy.network,
      apy: strategy.apy,
      tvl: strategy.tvl,
      riskScore: strategy.risk_score,
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      metadata: strategy.meta_data
    };
  }

  async updateStrategy(strategyId: number, strategyData: any): Promise<Strategy> {
    const response = await this.api.put(`/api/v1/yield/strategies/${strategyId}`, strategyData);
    // Transform snake_case to camelCase
    const strategy = response.data;
    return {
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      contractAddress: strategy.contract_address,
      network: strategy.network,
      apy: strategy.apy,
      tvl: strategy.tvl,
      riskScore: strategy.risk_score,
      isActive: strategy.is_active,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      metadata: strategy.meta_data
    };
  }

  // Yield data
  async getYieldData(strategyId?: number, network?: string, days: number = 7): Promise<YieldData[]> {
    const params = new URLSearchParams();
    if (strategyId) params.append('strategy_id', strategyId.toString());
    if (network) params.append('network', network);
    params.append('days', days.toString());

    const response = await this.api.get(`/api/v1/yield/yield-data?${params}`);
    return response.data;
  }

  async getTopYields(limit: number = 10, network?: string): Promise<Strategy[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (network) params.append('network', network);

    const response = await this.api.get(`/api/v1/yield/top-yields?${params}`);
    return response.data;
  }

  // Optimization
  async optimizeYield(request: OptimizationRequest): Promise<OptimizationResponse> {
    const response = await this.api.post('/api/v1/yield/optimize', request);
    return response.data;
  }

  async rebalancePortfolio(request: RebalanceRequest): Promise<RebalanceResponse> {
    const response = await this.api.post('/api/v1/yield/rebalance', request);
    return response.data;
  }

  // Analytics
  async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    const response = await this.api.get(`/api/v1/yield/analytics/user/${userId}`);
    return response.data;
  }

  async getSystemAnalytics(days: number = 7): Promise<SystemAnalytics> {
    const response = await this.api.get(`/api/v1/yield/analytics/system?days=${days}`);
    return response.data;
  }

  async getYieldTrends(days: number = 30): Promise<YieldTrend[]> {
    const response = await this.api.get(`/api/v1/yield/trends?days=${days}`);
    return response.data;
  }

  // Data refresh
  async refreshYieldData(): Promise<{ message: string }> {
    const response = await this.api.post('/api/v1/yield/refresh-data');
    return response.data;
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post('/api/auth/login', credentials);
    // Store token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.api.post('/api/auth/signup', data);
    // Store token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async connectWallet(walletRequest: ConnectWalletRequest): Promise<AuthToken> {
    const response = await this.api.post('/api/auth/connect-wallet', walletRequest);
    // Store token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('walletAddress', walletRequest.walletAddress);
    }
    return response.data;
  }

  // Logout (clear local storage and token)
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('walletAddress');
    // Reset authorization header
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Get current user from localStorage
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get current wallet address from localStorage
  getCurrentWallet(): string | null {
    return localStorage.getItem('walletAddress');
  }

  // Bridge operations
  async getBridgeProtocol(): Promise<{ protocol: string; supportedChains: Record<string, any> }> {
    const response = await this.api.get('/api/v1/bridge/protocol');
    return response.data;
  }

  async initiateLockAndMint(request: any): Promise<any> {
    const response = await this.api.post('/api/v1/bridge/transfer/lock-and-mint', request);
    return response.data;
  }

  async initiateBurnAndRelease(request: any): Promise<any> {
    const response = await this.api.post('/api/v1/bridge/transfer/burn-and-release', request);
    return response.data;
  }

  async getTransferStatus(transferId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/bridge/transfer/status/${transferId}`);
    return response.data;
  }

  async validateTransferParameters(request: any): Promise<{ valid: boolean; errors: string[] }> {
    const response = await this.api.post('/api/v1/bridge/validate', request);
    return response.data;
  }

  // Utility methods
  private handleError(error: any): never {
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data?.message || error.response.data?.error || 'Server error');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Generic GET method
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic POST method
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.post(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic PUT method
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Generic DELETE method
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
