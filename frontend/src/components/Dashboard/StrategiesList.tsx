"use client";

import React from 'react';
import { useStrategies } from '@/hooks/useStrategies';
import { formatAPY, formatTVL, formatRiskScore, getRiskColor, getRiskBgColor } from '@/utils/formatters';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export const StrategiesList: React.FC = () => {
  const { strategies, loading, getTopStrategies } = useStrategies();
  const [topStrategies, setTopStrategies] = React.useState<any[]>([]);

  /*
    React.useEffect(() => {
      const fetchTopStrategies = async () => {
        const top = await getTopStrategies(5);
        setTopStrategies(top);
      };
      fetchTopStrategies();
    }, [getTopStrategies]);
  */

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="card-body space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Strategies
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Highest yielding strategies by APY
        </p>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {topStrategies.length > 0 ? (
            topStrategies.map((strategy, index) => (
              <div
                key={strategy.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {strategy.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {strategy.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {strategy.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {strategy.network}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatAPY(strategy.apy)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      APY
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTVL(strategy.tvl)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      TVL
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskBgColor(strategy.riskScore)} ${getRiskColor(strategy.riskScore)}`}>
                      {formatRiskScore(strategy.riskScore)}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {index < 3 ? (
                      <ArrowUpIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No strategies available
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button className="w-full btn-secondary">
            View All Strategies
          </button>
        </div>
      </div>
    </div>
  );
};
