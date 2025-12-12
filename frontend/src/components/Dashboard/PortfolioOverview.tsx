"use client";

import React from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ShieldCheckIcon
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="h-4 skeleton w-1/2 mb-3"></div>
            <div className="h-10 skeleton w-3/4"></div>
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
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Total Yield',
      value: formatCurrency(parseFloat(portfolioSummary?.totalYield || '0') / 1e18),
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: ArrowTrendingUpIcon,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Average APY',
      value: formatPercentage(metrics.averageApy),
      change: '+0.3%',
      changeType: 'positive' as const,
      icon: ChartBarIcon,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      name: 'Risk Score',
      value: formatPercentage(metrics.averageRisk),
      change: '-2.1%',
      changeType: 'negative' as const,
      icon: ShieldCheckIcon,
      gradient: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {stats.map((stat, index) => (
        <div
          key={stat.name}
          className="metric-card from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
            <div className={`flex items-center space-x-1 text-sm font-semibold ${stat.changeType === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
              }`}>
              {stat.changeType === 'positive' ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              <span>{stat.change}</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {stat.name}
            </p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </div>

          {/* Decorative gradient line */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        </div>
      ))}
    </div>
  );
};
