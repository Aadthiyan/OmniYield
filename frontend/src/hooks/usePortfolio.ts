import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { apiService } from '@/services/apiService';
import { PortfolioSummary, UserStrategy, OptimizationRequest, OptimizationResponse, RebalanceRequest, RebalanceResponse } from '@/types';

export const usePortfolio = () => {
  const userStrategies = useStore((state) => state.userStrategies);
  const portfolioSummary = useStore((state) => state.portfolioSummary);
  const loading = useStore((state) => state.loading);
  const setUserStrategies = useStore((state) => state.setUserStrategies);
  const setPortfolioSummary = useStore((state) => state.setPortfolioSummary);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);
  const addNotification = useStore((state) => state.addNotification);
  const [optimizing, setOptimizing] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);

  // Fetch user strategies
  const fetchUserStrategies = useCallback(async (userId: number) => {
    try {
      setLoading('portfolio', true);
      setError(null);

      // In a real app, this would fetch from the API
      // For now, we'll use mock data
      const mockStrategies: UserStrategy[] = [
        {
          id: 1,
          userId,
          strategyId: 1,
          amount: '1000000000000000000000', // 1000 ETH
          weight: 0.4,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          userId,
          strategyId: 2,
          amount: '1500000000000000000000', // 1500 ETH
          weight: 0.6,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      setUserStrategies(mockStrategies);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user strategies';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to Load Portfolio',
        message: errorMessage,
        read: false
      });
    } finally {
      setLoading('portfolio', false);
    }
  }, [setUserStrategies, setLoading, setError, addNotification]);

  // Fetch portfolio summary
  const fetchPortfolioSummary = useCallback(async (userId: number) => {
    try {
      setLoading('portfolio', true);
      setError(null);

      // Add defensive check for apiService
      if (!apiService || typeof apiService.getUserAnalytics !== 'function') {
        console.warn('API service not properly initialized. Using mock data.');
        const summary: PortfolioSummary = {
          totalValue: '0',
          totalYield: '0',
          dailyChange: '0',
          dailyChangePercent: 0,
          strategies: [],
          allocation: []
        };
        setPortfolioSummary(summary);
        return;
      }

      const analytics = await apiService.getUserAnalytics(userId);

      // Create portfolio summary from analytics
      const summary: PortfolioSummary = {
        totalValue: analytics.currentTvl,
        totalYield: analytics.totalYieldEarned,
        dailyChange: '0', // This would be calculated from historical data
        dailyChangePercent: 0,
        strategies: [], // This would be populated with actual strategy data
        allocation: [] // This would be calculated from user strategies
      };

      setPortfolioSummary(summary);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolio summary';
      console.error('Portfolio fetch error:', errorMessage);
      setError(errorMessage);

      // Set a default summary instead of crashing
      const defaultSummary: PortfolioSummary = {
        totalValue: '0',
        totalYield: '0',
        dailyChange: '0',
        dailyChangePercent: 0,
        strategies: [],
        allocation: []
      };
      setPortfolioSummary(defaultSummary);

      addNotification({
        type: 'error',
        title: 'Failed to Load Portfolio Summary',
        message: errorMessage,
        read: false
      });
    } finally {
      setLoading('portfolio', false);
    }
  }, [setPortfolioSummary, setLoading, setError, addNotification]);

  // Optimize portfolio
  const optimizePortfolio = useCallback(async (request: OptimizationRequest): Promise<OptimizationResponse | null> => {
    try {
      setOptimizing(true);
      setError(null);

      const response = await apiService.optimizeYield(request);

      addNotification({
        type: 'success',
        title: 'Portfolio Optimized',
        message: `Expected APY: ${(response.expectedApy * 100).toFixed(2)}%`,
        read: false
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize portfolio';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Optimization Failed',
        message: errorMessage,
        read: false
      });
      return null;
    } finally {
      setOptimizing(false);
    }
  }, [setError, addNotification]);

  // Rebalance portfolio
  const rebalancePortfolio = useCallback(async (request: RebalanceRequest): Promise<RebalanceResponse | null> => {
    try {
      setRebalancing(true);
      setError(null);

      const response = await apiService.rebalancePortfolio(request);

      addNotification({
        type: 'success',
        title: 'Portfolio Rebalanced',
        message: `Rebalancing completed with ${response.rebalanceActions.length} actions`,
        read: false
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rebalance portfolio';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Rebalancing Failed',
        message: errorMessage,
        read: false
      });
      return null;
    } finally {
      setRebalancing(false);
    }
  }, [setError, addNotification]);

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = useCallback(() => {
    if (userStrategies.length === 0) {
      return {
        totalValue: '0',
        totalWeight: 0,
        averageApy: 0,
        averageRisk: 0,
        diversification: 0
      };
    }

    const totalValue = userStrategies.reduce((sum, strategy) => sum + BigInt(strategy.amount), BigInt(0));
    const totalWeight = userStrategies.reduce((sum, strategy) => sum + strategy.weight, 0);

    // Mock calculations - in real app, these would come from strategy data
    const averageApy = 0.05; // 5%
    const averageRisk = 0.3; // 30%
    const diversification = Math.min(userStrategies.length / 5, 1); // Max 5 strategies for full diversification

    return {
      totalValue: totalValue.toString(),
      totalWeight,
      averageApy,
      averageRisk,
      diversification
    };
  }, [userStrategies]);

  // Get allocation data for charts
  const getAllocationData = useCallback(() => {
    if (userStrategies.length === 0) return [];

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];

    return userStrategies.map((strategy, index) => ({
      name: `Strategy ${strategy.strategyId}`,
      value: strategy.weight * 100,
      color: colors[index % colors.length],
      amount: strategy.amount
    }));
  }, [userStrategies]);

  // Get performance data for charts
  const getPerformanceData = useCallback(() => {
    // Mock performance data - in real app, this would come from historical data
    const days = 30;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        value: 1000 + Math.random() * 100 - 50, // Mock value fluctuation
        yield: Math.random() * 10 // Mock yield data
      });
    }

    return data;
  }, []);

  // Refresh portfolio data
  const refreshPortfolio = useCallback(async (userId: number) => {
    try {
      setError(null);
      await Promise.all([
        fetchUserStrategies(userId),
        fetchPortfolioSummary(userId)
      ]);

      addNotification({
        type: 'success',
        title: 'Portfolio Refreshed',
        message: 'Portfolio data has been updated',
        read: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh portfolio';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage,
        read: false
      });
    }
  }, [fetchUserStrategies, fetchPortfolioSummary, setError, addNotification]);

  return {
    userStrategies,
    portfolioSummary,
    loading: loading.portfolio,
    optimizing,
    rebalancing,
    fetchUserStrategies,
    fetchPortfolioSummary,
    optimizePortfolio,
    rebalancePortfolio,
    calculatePortfolioMetrics,
    getAllocationData,
    getPerformanceData,
    refreshPortfolio
  };
};
