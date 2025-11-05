import React from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatAddress, formatRelativeTime, formatTokenAmount } from '@/utils/formatters';

interface TransactionModalProps {
  data?: any;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ data, onClose }) => {
  // Mock transaction data
  const transaction = data || {
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'deposit',
    amount: '1000000000000000000000',
    status: 'pending',
    gasUsed: '21000',
    gasPrice: '20',
    blockNumber: 12345,
    createdAt: new Date().toISOString()
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transaction Details
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View transaction information and status
        </p>
      </div>

      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center space-x-4">
          {getStatusIcon(transaction.status)}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Transaction {transaction.status}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeTime(transaction.createdAt)}
            </p>
          </div>
        </div>

        {/* Transaction Hash */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transaction Hash
          </label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <code className="text-sm font-mono text-gray-900 dark:text-white">
              {formatAddress(transaction.hash)}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(transaction.hash)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatTokenAmount(transaction.amount)} ETH
            </span>
          </div>
        </div>

        {/* Gas Information */}
        {transaction.gasUsed && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gas Used
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {transaction.gasUsed}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gas Price
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {transaction.gasPrice} Gwei
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Block Number */}
        {transaction.blockNumber && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Block Number
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {transaction.blockNumber.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Close
          </button>
          <button
            onClick={() => window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank')}
            className="flex-1 btn-primary"
          >
            View on Etherscan
          </button>
        </div>
      </div>
    </div>
  );
};
