"use client";

import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useStore } from '@/store/useStore';
import { useWallet } from '@/hooks/useWallet';
import {
    WalletIcon,
    ArrowTopRightOnSquareIcon,
    ClipboardDocumentIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { formatAddress, formatCurrency } from '@/utils/formatters';
import { useState } from 'react';

export default function WalletPage() {
    const wallet = useStore((state) => state.wallet);
    const isWalletConnected = useStore((state) => state.isWalletConnected);
    const { connectWallet, disconnectWallet } = useWallet();
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = () => {
        if (wallet?.address) {
            navigator.clipboard.writeText(wallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleConnectWallet = () => {
        connectWallet('privateKey');
    };

    const mockBalances = [
        { symbol: 'ETH', name: 'Ethereum', balance: 2.5, value: 5000, network: 'Ethereum' },
        { symbol: 'MATIC', name: 'Polygon', balance: 1500, value: 1200, network: 'Polygon' },
        { symbol: 'BNB', name: 'BNB', balance: 5.2, value: 1560, network: 'BSC' },
        { symbol: 'USDC', name: 'USD Coin', balance: 10000, value: 10000, network: 'Ethereum' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Wallet
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your wallet and view your assets
                    </p>
                </div>

                {isWalletConnected && wallet ? (
                    <>
                        {/* Wallet Info Card */}
                        <div className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <WalletIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Connected Wallet</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                                    {formatAddress(wallet.address)}
                                                </p>
                                                <button
                                                    onClick={handleCopyAddress}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    {copied ? (
                                                        <CheckIcon className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <ClipboardDocumentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    )}
                                                </button>
                                                <a
                                                    href={`https://etherscan.io/address/${wallet.address}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={disconnectWallet}
                                        className="btn-danger"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Total Balance */}
                        <div className="card bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                            <div className="card-body">
                                <p className="text-blue-100">Total Balance</p>
                                <p className="text-4xl font-bold mt-2">
                                    {formatCurrency(mockBalances.reduce((sum, b) => sum + b.value, 0))}
                                </p>
                                <p className="text-blue-100 mt-1">Across all networks</p>
                            </div>
                        </div>

                        {/* Token Balances */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Token Balances
                                </h2>
                            </div>
                            <div className="card-body">
                                <div className="space-y-4">
                                    {mockBalances.map((token) => (
                                        <div
                                            key={token.symbol}
                                            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {token.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {token.network}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {token.balance.toLocaleString()} {token.symbol}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatCurrency(token.value)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Connect Wallet Prompt */
                    <div className="card">
                        <div className="card-body text-center py-16">
                            <WalletIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                No Wallet Connected
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Connect your wallet to view your assets and manage your portfolio
                            </p>
                            <button
                                onClick={handleConnectWallet}
                                className="btn-primary px-8 py-3 text-lg"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
