import React from 'react';
import { 
  CurrencyDollarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

export const PortfolioOverview: React.FC = () => {
  const { portfolioSummary, calculatePortfolioMetrics, loading } = usePortfolio();
  const { wallet } = useWallet();

  const metrics = calculatePortfolioMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Value',
      value: formatCurrency(parseFloat(metrics.totalValue) / 1e18),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: CurrencyDollarIcon,
      color: 'text-green-600'
    },
    {
      name: 'Total Yield',
      value: formatCurrency(parseFloat(portfolioSummary?.totalYield || '0') / 1e18),
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon,
      color: 'text-blue-600'
    },
    {
      name: 'Average APY',
      value: formatPercentage(metrics.averageApy),
      change: '+0.3%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon,
      color: 'text-purple-600'
    },
    {
      name: 'Risk Score',
      value: formatPercentage(metrics.averageRisk),
      change: '-2.1%',
      changeType: 'negative' as const,
      icon: TrendingDownIcon,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-').replace('-600', '-100')} dark:bg-gray-700`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            {stat.changeType === 'positive' ? (
              <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              vs last month
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
