"use client";

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
// import { useStore } from '@/store/useStore'; // unused if we just use props
import { ConnectWalletModal } from './ConnectWalletModal';
import { OptimizeModal } from './OptimizeModal';
import { RebalanceModal } from './RebalanceModal';
import { TransactionModal } from './TransactionModal';
import { SettingsModal } from './SettingsModal';

interface ModalProps {
  isOpen: boolean;
  type: 'connect-wallet' | 'optimize' | 'rebalance' | 'transaction' | 'settings';
  data?: any;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, type, data, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const renderModalContent = () => {
    switch (type) {
      case 'connect-wallet':
        return <ConnectWalletModal onClose={handleClose} />;
      case 'optimize':
        return <OptimizeModal data={data} onClose={handleClose} />;
      case 'rebalance':
        return <RebalanceModal data={data} onClose={handleClose} />;
      case 'transaction':
        return <TransactionModal data={data} onClose={handleClose} />;
      case 'settings':
        return <SettingsModal onClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Content */}
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};
