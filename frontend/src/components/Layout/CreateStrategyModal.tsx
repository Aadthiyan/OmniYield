"use client";

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiService } from '@/services/apiService';
import { useStore } from '@/store/useStore';

interface CreateStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STRATEGY_TYPES = [
  'lending',
  'compound',
  'uniswap_v3',
  'aave',
  'curve',
  'staking',
  'farming'
];

const NETWORKS = [
  'ethereum',
  'polygon',
  'bsc',
  'arbitrum',
  'optimism',
  'testnet'
];

export const CreateStrategyModal: React.FC<CreateStrategyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useStore((state) => state.addNotification);

  const [formData, setFormData] = useState({
    name: '',
    type: 'lending',
    contract_address: '',
    network: 'ethereum',
    apy: 0,
    tvl: 0,
    risk_score: 0,
    is_active: true,
    meta_data: {}
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else if (name === 'apy' || name === 'risk_score') {
      setFormData({
        ...formData,
        [name]: value ? parseFloat(value) : ''
      });
    } else if (name === 'tvl') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Strategy name is required');
      return false;
    }
    if (!formData.contract_address.trim()) {
      setError('Contract address is required');
      return false;
    }
    if (formData.contract_address.length !== 42) {
      setError('Contract address must be 42 characters (Ethereum address)');
      return false;
    }
    if (!formData.apy || formData.apy < 0) {
      setError('APY must be a positive number');
      return false;
    }
    if (!formData.tvl || formData.tvl < 0) {
      setError('TVL must be a positive number');
      return false;
    }
    if (!formData.risk_score || formData.risk_score < 0 || formData.risk_score > 1) {
      setError('Risk score must be between 0 and 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        type: formData.type,
        contract_address: formData.contract_address,
        network: formData.network,
        apy: formData.apy,
        tvl: formData.tvl,
        risk_score: formData.risk_score,
        is_active: formData.is_active,
        meta_data: formData.meta_data
      };

      await apiService.createStrategy(payload);

      addNotification({
        type: 'success',
        title: 'Strategy Created',
        message: `${formData.name} has been added successfully`,
        read: false
      });

      // Reset form
      setFormData({
        name: '',
        type: 'lending',
        contract_address: '',
        network: 'ethereum',
        apy: 0,
        tvl: 0,
        risk_score: 0,
        is_active: true,
        meta_data: {}
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create strategy';
      setError(errorMsg);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMsg,
        read: false
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Strategy
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Aave USDC Lending"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STRATEGY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contract Address *
              </label>
              <input
                type="text"
                name="contract_address"
                value={formData.contract_address}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Network */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Network *
              </label>
              <select
                name="network"
                value={formData.network}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NETWORKS.map((network) => (
                  <option key={network} value={network}>
                    {network.charAt(0).toUpperCase() + network.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* APY */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                APY (%) *
              </label>
              <input
                type="number"
                name="apy"
                value={formData.apy}
                onChange={handleChange}
                placeholder="5.5"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* TVL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TVL (Wei) *
              </label>
              <input
                type="number"
                name="tvl"
                value={formData.tvl}
                onChange={handleChange}
                placeholder="1000000000000000000"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Risk Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Score (0-1) *
              </label>
              <input
                type="number"
                name="risk_score"
                value={formData.risk_score}
                onChange={handleChange}
                placeholder="0.5"
                step="0.01"
                min="0"
                max="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
