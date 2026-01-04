"use client";

import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useStore } from '@/store/useStore';
import { useWallet } from '@/hooks/useWallet';
import {
    WalletIcon,
    ArrowTopRightOnSquareIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatAddress } from '@/utils/formatters';
import { useState } from 'react';
import { ethers } from 'ethers';

export default function WalletPage() {
    const wallet = useStore((state) => state.wallet);
    const isWalletConnected = useStore((state) => state.isWalletConnected);
    const { connectWallet, disconnectWallet, refreshWallet } = useWallet();
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshWallet();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Format balance from wei to QIE
    const formatBalance = (balance: string) => {
        try {
            const balanceInQIE = ethers.formatEther(balance);
            const numBalance = parseFloat(balanceInQIE);
            return numBalance.toFixed(4);
        } catch {
            return '0.0000';
        }
    };

    // Format balance to USD (assuming 1 QIE = $1 for now, update with real price)
    const formatBalanceUSD = (balance: string) => {
        try {
            const balanceInQIE = ethers.formatEther(balance);
            const numBalance = parseFloat(balanceInQIE);
            // TODO: Fetch real QIE price from API
            const qiePrice = 1; // Placeholder
            return (numBalance * qiePrice).toFixed(2);
        } catch {
            return '0.00';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Wallet
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your QIE wallet and view your assets
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
                                                    title="Copy address"
                                                >
                                                    {copied ? (
                                                        <CheckIcon className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <ClipboardDocumentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    )}
                                                </button>
                                                <a
                                                    href={`https://qiescan.io/address/${wallet.address}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                    title="View on QIE Explorer"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                </a>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                Network: {wallet.network} (Chain ID: {wallet.chainId})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="btn-secondary flex items-center space-x-2"
                                            title="Refresh balance"
                                        >
                                            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            <span>Refresh</span>
                                        </button>
                                        <button
                                            onClick={disconnectWallet}
                                            className="btn-danger"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Balance */}
                        <div className="card bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                            <div className="card-body">
                                <p className="text-blue-100">Total Balance</p>
                                <div className="flex items-baseline space-x-3 mt-2">
                                    <p className="text-5xl font-bold">
                                        {formatBalance(wallet.balance)}
                                    </p>
                                    <p className="text-2xl font-semibold text-blue-100">
                                        QIE
                                    </p>
                                </div>
                                <p className="text-blue-100 mt-2 text-lg">
                                    ≈ ${formatBalanceUSD(wallet.balance)} USD
                                </p>
                                <p className="text-blue-100 mt-1 text-sm">
                                    On QIE {wallet.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                                </p>
                            </div>
                        </div>

                        {/* Wallet Details */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Wallet Details
                                </h2>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Wallet Address
                                        </p>
                                        <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                                            {wallet.address}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Network
                                        </p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            QIE {wallet.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Chain ID
                                        </p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {wallet.chainId}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Balance (Wei)
                                        </p>
                                        <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                                            {wallet.balance}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button className="p-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all">
                                        <p className="font-semibold text-lg">Send QIE</p>
                                        <p className="text-sm text-blue-100 mt-1">Transfer to another wallet</p>
                                    </button>
                                    <button className="p-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all">
                                        <p className="font-semibold text-lg">Receive QIE</p>
                                        <p className="text-sm text-purple-100 mt-1">Show your address QR code</p>
                                    </button>
                                    <button className="p-6 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all">
                                        <p className="font-semibold text-lg">View History</p>
                                        <p className="text-sm text-green-100 mt-1">See transaction history</p>
                                    </button>
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
                                Connect your QIE wallet to view your assets and manage your portfolio
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
