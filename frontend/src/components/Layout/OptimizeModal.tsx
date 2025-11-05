import React, { useState } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useStrategies } from '@/hooks/useStrategies';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface OptimizeModalProps {
  data?: any;
  onClose: () => void;
}

export const OptimizeModal: React.FC<OptimizeModalProps> = ({ onClose }) => {
  const { optimizePortfolio, optimizing } = usePortfolio();
  const { strategies } = useStrategies();
  const [formData, setFormData] = useState({
    totalAmount: '',
    riskTolerance: 0.5,
    maxSlippage: 0.05,
    selectedStrategies: [] as number[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedStrategies.length === 0) {
      alert('Please select at least one strategy');
      return;
    }

    const request = {
      totalAmount: BigInt(formData.totalAmount).toString(),
      strategies: formData.selectedStrategies.map(id => ({
        strategyId: id,
        weight: 1 / formData.selectedStrategies.length
      })),
      riskTolerance: formData.riskTolerance,
      maxSlippage: formData.maxSlippage
    };

    try {
      await optimizePortfolio(request);
      onClose();
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const handleStrategyToggle = (strategyId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedStrategies: prev.selectedStrategies.includes(strategyId)
        ? prev.selectedStrategies.filter(id => id !== strategyId)
        : [...prev.selectedStrategies, strategyId]
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Optimize Portfolio
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure your yield optimization parameters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Total Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Amount (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
            className="input"
            placeholder="Enter amount in ETH"
            required
          />
        </div>

        {/* Risk Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Risk Tolerance: {formatPercentage(formData.riskTolerance)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formData.riskTolerance}
            onChange={(e) => setFormData(prev => ({ ...prev, riskTolerance: parseFloat(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Max Slippage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Slippage: {formatPercentage(formData.maxSlippage)}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.1"
            step="0.01"
            value={formData.maxSlippage}
            onChange={(e) => setFormData(prev => ({ ...prev, maxSlippage: parseFloat(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Strategy Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Strategies
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {strategies.slice(0, 10).map((strategy) => (
              <label key={strategy.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.selectedStrategies.includes(strategy.id)}
                  onChange={() => handleStrategyToggle(strategy.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {strategy.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatPercentage(strategy.apy)} APY • {strategy.network}
                  </div>
                </div>
              </label>
            ))}
          </div>
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
            disabled={optimizing || formData.selectedStrategies.length === 0}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>
      </form>
    </div>
  );
};
