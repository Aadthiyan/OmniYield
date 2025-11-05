import { useState, useEffect, useCallback } from 'react';
import { useStore, useStoreActions } from '@/store';
import { apiService } from '@/services/apiService';
import { Strategy, Network } from '@/types';

export const useStrategies = () => {
  const { strategies, loading } = useStore();
  const { setStrategies, setLoading, setError, addNotification } = useStoreActions();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch strategies
  const fetchStrategies = useCallback(async (network?: Network, activeOnly: boolean = true) => {
    try {
      setLoading('strategies', true);
      setError(null);

      const data = await apiService.getStrategies(network, activeOnly);
      setStrategies(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch strategies';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to Load Strategies',
        message: errorMessage
      });
    } finally {
      setLoading('strategies', false);
    }
  }, [setStrategies, setLoading, setError, addNotification]);

  // Fetch single strategy
  const fetchStrategy = useCallback(async (strategyId: number): Promise<Strategy | null> => {
    try {
      setError(null);
      const strategy = await apiService.getStrategy(strategyId);
      return strategy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch strategy';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to Load Strategy',
        message: errorMessage
      });
      return null;
    }
  }, [setError, addNotification]);

  // Refresh strategies
  const refreshStrategies = useCallback(async (network?: Network) => {
    try {
      setRefreshing(true);
      setError(null);

      await apiService.refreshYieldData();
      await fetchStrategies(network);
      
      addNotification({
        type: 'success',
        title: 'Strategies Refreshed',
        message: 'Yield data has been updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh strategies';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchStrategies, setError, addNotification]);

  // Get top strategies
  const getTopStrategies = useCallback(async (limit: number = 10, network?: Network): Promise<Strategy[]> => {
    try {
      setError(null);
      const topStrategies = await apiService.getTopYields(limit, network);
      return topStrategies;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch top strategies';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to Load Top Strategies',
        message: errorMessage
      });
      return [];
    }
  }, [setError, addNotification]);

  // Filter strategies by type
  const getStrategiesByType = useCallback((type: string) => {
    return strategies.filter(strategy => strategy.type === type);
  }, [strategies]);

  // Filter strategies by network
  const getStrategiesByNetwork = useCallback((network: Network) => {
    return strategies.filter(strategy => strategy.network === network);
  }, [strategies]);

  // Get strategies with high APY
  const getHighYieldStrategies = useCallback((minApy: number = 0.1) => {
    return strategies.filter(strategy => strategy.apy >= minApy);
  }, [strategies]);

  // Get strategies with low risk
  const getLowRiskStrategies = useCallback((maxRisk: number = 0.3) => {
    return strategies.filter(strategy => strategy.riskScore <= maxRisk);
  }, [strategies]);

  // Search strategies
  const searchStrategies = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return strategies.filter(strategy => 
      strategy.name.toLowerCase().includes(lowercaseQuery) ||
      strategy.type.toLowerCase().includes(lowercaseQuery) ||
      strategy.network.toLowerCase().includes(lowercaseQuery)
    );
  }, [strategies]);

  // Get strategy statistics
  const getStrategyStats = useCallback(() => {
    const totalStrategies = strategies.length;
    const activeStrategies = strategies.filter(s => s.isActive).length;
    const totalTvl = strategies.reduce((sum, s) => sum + s.tvl, 0);
    const averageApy = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.apy, 0) / strategies.length 
      : 0;
    const averageRisk = strategies.length > 0 
      ? strategies.reduce((sum, s) => sum + s.riskScore, 0) / strategies.length 
      : 0;

    const byType = strategies.reduce((acc, strategy) => {
      acc[strategy.type] = (acc[strategy.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byNetwork = strategies.reduce((acc, strategy) => {
      acc[strategy.network] = (acc[strategy.network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStrategies,
      activeStrategies,
      totalTvl,
      averageApy,
      averageRisk,
      byType,
      byNetwork
    };
  }, [strategies]);

  // Load strategies on mount
  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  return {
    strategies,
    loading: loading.strategies,
    refreshing,
    fetchStrategies,
    fetchStrategy,
    refreshStrategies,
    getTopStrategies,
    getStrategiesByType,
    getStrategiesByNetwork,
    getHighYieldStrategies,
    getLowRiskStrategies,
    searchStrategies,
    getStrategyStats
  };
};
