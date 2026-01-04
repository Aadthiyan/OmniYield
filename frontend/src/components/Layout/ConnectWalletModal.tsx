"use client";

import React, { useState } from 'react';
import { WalletIcon, KeyIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useWallet } from '@/hooks/useWallet';

interface ConnectWalletModalProps {
  onClose: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ onClose }) => {
  const { connectWallet, isConnecting } = useWallet();
  const [selectedType, setSelectedType] = useState<'privateKey' | 'mnemonic' | 'hardware'>('privateKey');

  const handleConnect = async () => {
    try {
      await connectWallet(selectedType);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const walletTypes = [
    {
      type: 'privateKey' as const,
      name: 'Private Key',
      description: 'Connect using a private key',
      icon: KeyIcon,
      available: true
    },
    {
      type: 'mnemonic' as const,
      name: 'Mnemonic Phrase',
      description: 'Connect using a 12-word seed phrase',
      icon: WalletIcon,
      available: true
    },
    {
      type: 'hardware' as const,
      name: 'Hardware Wallet',
      description: 'Connect using Ledger or Trezor',
      icon: DevicePhoneMobileIcon,
      available: false
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Connect QIE Wallet
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose how you&apos;d like to connect your QIE wallet to access DeFi yield opportunities
        </p>
      </div>

      <div className="space-y-4">
        {walletTypes.map((walletType) => (
          <button
            key={walletType.type}
            onClick={() => setSelectedType(walletType.type)}
            disabled={!walletType.available}
            className={`
              w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${selectedType === walletType.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }
              ${!walletType.available
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }
            `}
          >
            <div className="flex items-center space-x-4">
              <div className={`
                p-2 rounded-lg
                ${selectedType === walletType.type
                  ? 'bg-blue-100 dark:bg-blue-800'
                  : 'bg-gray-100 dark:bg-gray-700'
                }
              `}>
                <walletType.icon className={`
                  w-6 h-6
                  ${selectedType === walletType.type
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `} />
              </div>

              <div className="flex-1">
                <h3 className={`
                  font-medium
                  ${selectedType === walletType.type
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-white'
                  }
                `}>
                  {walletType.name}
                </h3>
                <p className={`
                  text-sm mt-1
                  ${selectedType === walletType.type
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {walletType.description}
                </p>
                {!walletType.available && (
                  <p className="text-xs text-red-500 mt-1">
                    Coming soon
                  </p>
                )}
              </div>

              {selectedType === walletType.type && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex space-x-4">
        <button
          onClick={onClose}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleConnect}
          disabled={isConnecting || !walletTypes.find(w => w.type === selectedType)?.available}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
};
