"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  WalletIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useStore, useStoreActions } from '@/store/useStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Portfolio', href: '/portfolio', icon: ChartBarIcon },
  { name: 'Strategies', href: '/strategies', icon: CurrencyDollarIcon },
  { name: 'Bridge', href: '/bridge', icon: ArrowsRightLeftIcon },
  { name: 'Wallet', href: '/wallet', icon: WalletIcon },
  { name: 'Security', href: '/security', icon: ShieldCheckIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const wallet = useStore((state) => state.wallet);
  const isWalletConnected = useStore((state) => state.isWalletConnected);
  const setWallet = useStore((state) => state.setWallet);

  const handleDisconnect = async () => {
    try {
      setWallet(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                DeFi Yield
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={onClose}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Status */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            {isWalletConnected && wallet ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Connected Wallet
                  </span>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {parseFloat(wallet.balance) / 1e18} ETH
                </div>
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No wallet connected
                </div>
                <button
                  onClick={() => {
                    // This would open the connect wallet modal
                    console.log('Connect wallet clicked');
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
