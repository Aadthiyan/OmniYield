import React from 'react';
import { 
  Bars3Icon, 
  BellIcon, 
  SunIcon, 
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useStore, useStoreActions } from '@/store';
import { useWallet } from '@/hooks/useWallet';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { ui, wallet, isWalletConnected } = useStore();
  const { setUI, addNotification } = useStoreActions();
  const { connectWallet, disconnectWallet } = useWallet();

  const handleThemeToggle = () => {
    const newTheme = ui.theme === 'light' ? 'dark' : ui.theme === 'dark' ? 'system' : 'light';
    setUI({ theme: newTheme });
    addNotification({
      type: 'info',
      title: 'Theme Changed',
      message: `Switched to ${newTheme} theme`
    });
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet('privateKey');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const getThemeIcon = () => {
    switch (ui.theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'system':
        return <ComputerDesktopIcon className="w-5 h-5" />;
      default:
        return <SunIcon className="w-5 h-5" />;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              DeFi Yield Aggregator
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            title={`Current theme: ${ui.theme}`}
          >
            {getThemeIcon()}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setUI({ modal: { isOpen: true, type: 'notifications' } })}
            className="relative p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <BellIcon className="w-6 h-6" />
            {ui.notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {ui.notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {/* Wallet connection */}
          {isWalletConnected && wallet ? (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {parseFloat(wallet.balance) / 1e18} ETH
                </div>
              </div>
              <button
                onClick={handleDisconnectWallet}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
