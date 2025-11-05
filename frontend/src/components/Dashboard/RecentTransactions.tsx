import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatAddress, formatRelativeTime, formatCurrency, formatTokenAmount } from '@/utils/formatters';

interface Transaction {
  id: number;
  txHash: string;
  type: 'deposit' | 'withdraw' | 'rebalance' | 'swap' | 'bridge' | 'claim';
  amount: string;
  tokenAddress: string;
  network: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  createdAt: string;
}

// Mock data - in real app, this would come from the store/API
const mockTransactions: Transaction[] = [
  {
    id: 1,
    txHash: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'deposit',
    amount: '1000000000000000000000', // 1000 ETH
    tokenAddress: '0x0000000000000000000000000000000000000000',
    network: 'ethereum',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: 2,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    type: 'withdraw',
    amount: '500000000000000000000', // 500 ETH
    tokenAddress: '0x0000000000000000000000000000000000000000',
    network: 'ethereum',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 3,
    txHash: '0x9876543210fedcba9876543210fedcba98765432',
    type: 'rebalance',
    amount: '200000000000000000000', // 200 ETH
    tokenAddress: '0x0000000000000000000000000000000000000000',
    network: 'ethereum',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 4,
    txHash: '0xfedcba0987654321fedcba0987654321fedcba09',
    type: 'bridge',
    amount: '1000000000000000000000', // 1000 ETH
    tokenAddress: '0x0000000000000000000000000000000000000000',
    network: 'polygon',
    status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
];

export const RecentTransactions: React.FC = () => {
  const [transactions] = React.useState<Transaction[]>(mockTransactions);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownIcon className="w-5 h-5 text-green-500" />;
      case 'withdraw':
        return <ArrowUpIcon className="w-5 h-5 text-red-500" />;
      case 'rebalance':
        return <ArrowsRightLeftIcon className="w-5 h-5 text-blue-500" />;
      case 'swap':
        return <ArrowsRightLeftIcon className="w-5 h-5 text-purple-500" />;
      case 'bridge':
        return <ArrowsRightLeftIcon className="w-5 h-5 text-orange-500" />;
      case 'claim':
        return <ArrowUpIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdraw':
        return 'text-red-600';
      case 'rebalance':
        return 'text-blue-600';
      case 'swap':
        return 'text-purple-600';
      case 'bridge':
        return 'text-orange-600';
      case 'claim':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your latest DeFi transactions
        </p>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-medium capitalize ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.network}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatAddress(transaction.txHash)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(transaction.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${getTypeColor(transaction.type)}`}>
                      {transaction.type === 'withdraw' ? '-' : '+'}
                      {formatTokenAmount(transaction.amount)} ETH
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(parseFloat(transaction.amount) / 1e18 * 2000)} {/* Mock ETH price */}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(transaction.status)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No transactions found
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <button className="w-full btn-secondary">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
};
