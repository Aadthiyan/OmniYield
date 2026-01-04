"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import {
  BellIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  WalletIcon,
  ShieldCheckIcon,
  CogIcon,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Portfolio', href: '/portfolio', icon: ChartBarIcon },
  { name: 'Strategies', href: '/strategies', icon: ChartBarIcon },
  { name: 'Bridge', href: '/bridge', icon: ArrowsRightLeftIcon },
  { name: 'Wallet', href: '/wallet', icon: WalletIcon },
  { name: 'Security', href: '/security', icon: ShieldCheckIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const user = useStore((state) => state.user);
  const ui = useStore((state) => state.ui);
  const wallet = useStore((state) => state.wallet);
  const isWalletConnected = useStore((state) => state.isWalletConnected);
  const { connectWallet, disconnectWallet } = useWallet();
  const { logout } = useAuth();

  // Generate dynamic redirect URL based on current environment
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      return `${baseUrl}/dashboard`;
    }
    return 'https://omniyield-theta.vercel.app/dashboard';
  };

  const getClerkSignInUrl = () => {
    const redirectUrl = encodeURIComponent(getRedirectUrl());
    return `https://infinite-aardvark-49.accounts.dev/sign-in?redirect_url=${redirectUrl}`;
  };

  const getClerkSignUpUrl = () => {
    const redirectUrl = encodeURIComponent(getRedirectUrl());
    return `https://infinite-aardvark-49.accounts.dev/sign-up?redirect_url=${redirectUrl}`;
  };


  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              YieldX
            </span>
          </Link>

          {/* Navigation - Hidden on mobile, shown on tablet+ */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button
              onClick={() => {/* Notifications panel */ }}
              className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {ui.notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* User & Wallet */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Connection (Optional Add-on) */}
                {isWalletConnected && wallet ? (
                  <button
                    onClick={disconnectWallet}
                    className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    title="Disconnect Wallet"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => connectWallet()}
                    className="hidden sm:flex btn-secondary text-xs px-3 py-1.5"
                  >
                    Connect Wallet
                  </button>
                )}

                {/* User Profile & Logout */}
                <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Sign Out"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <a href={getClerkSignInUrl()} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Log In
                </a>
                <a href={getClerkSignUpUrl()} className="btn-primary text-sm px-4 py-2">
                  Sign Up
                </a>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {/* Toggle mobile menu */ }}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
