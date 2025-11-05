import React, { useState } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { formatPercentage } from '@/utils/formatters';

interface RebalanceModalProps {
  data?: any;
  onClose: () => void;
}

export const RebalanceModal: React.FC<RebalanceModalProps> = ({ onClose }) => {
  const { rebalancePortfolio, rebalancing, userStrategies } = usePortfolio();
  const [targetAllocations, setTargetAllocations] = useState<Record<number, number>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allocations = Object.entries(targetAllocations).map(([strategyId, weight]) => ({
      strategyId: parseInt(strategyId),
      weight
    }));

    const request = {
      userId: 1, // This would come from auth context
      targetAllocations: allocations
    };

    try {
      await rebalancePortfolio(request);
      onClose();
    } catch (error) {
      console.error('Rebalancing failed:', error);
    }
  };

  const handleWeightChange = (strategyId: number, weight: number) => {
    setTargetAllocations(prev => ({
      ...prev,
      [strategyId]: weight
    }));
  };

  const totalWeight = Object.values(targetAllocations).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rebalance Portfolio
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Adjust your portfolio allocation across strategies
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {userStrategies.map((userStrategy) => (
            <div key={userStrategy.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  Strategy {userStrategy.strategyId}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Current: {formatPercentage(userStrategy.weight)}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={targetAllocations[userStrategy.strategyId] || userStrategy.weight}
                  onChange={(e) => handleWeightChange(userStrategy.strategyId, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white w-16">
                  {formatPercentage(targetAllocations[userStrategy.strategyId] || userStrategy.weight)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Allocation:
            </span>
            <span className={`text-sm font-bold ${Math.abs(totalWeight - 1) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(totalWeight)}
            </span>
          </div>
          {Math.abs(totalWeight - 1) > 0.01 && (
            <p className="text-xs text-red-500 mt-1">
              Total allocation must equal 100%
            </p>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={rebalancing || Math.abs(totalWeight - 1) > 0.01}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rebalancing ? 'Rebalancing...' : 'Rebalance'}
          </button>
        </div>
      </form>
    </div>
  );
};
