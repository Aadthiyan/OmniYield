"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import {
    ArrowsRightLeftIcon,
    ClockIcon,
    CurrencyDollarIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const NETWORKS = [
    { id: 'ethereum', name: 'Ethereum', color: 'bg-blue-500' },
    { id: 'polygon', name: 'Polygon', color: 'bg-purple-500' },
    { id: 'bsc', name: 'BSC', color: 'bg-yellow-500' },
    { id: 'arbitrum', name: 'Arbitrum', color: 'bg-cyan-500' },
];

export default function BridgePage() {
    const [sourceChain, setSourceChain] = useState('ethereum');
    const [destChain, setDestChain] = useState('polygon');
    const [amount, setAmount] = useState('');
    const [estimatedFee, setEstimatedFee] = useState(0.005);
    const [estimatedTime, setEstimatedTime] = useState('5-10 minutes');

    const handleSwapChains = () => {
        const temp = sourceChain;
        setSourceChain(destChain);
        setDestChain(temp);
    };

    const handleBridgeAssets = () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        console.log('Bridging', amount, 'ETH from', sourceChain, 'to', destChain);
        // TODO: Implement bridge logic with backend
        alert(`Bridge transaction initiated: ${amount} ETH from ${sourceChain} to ${destChain}`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Cross-Chain Bridge
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Transfer assets securely across different blockchain networks
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bridge Interface */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <div className="card-body space-y-6">
                                {/* Source Chain */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        From
                                    </label>
                                    <select
                                        value={sourceChain}
                                        onChange={(e) => setSourceChain(e.target.value)}
                                        className="input"
                                    >
                                        {NETWORKS.map((network) => (
                                            <option key={network.id} value={network.id}>
                                                {network.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Swap Button */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={handleSwapChains}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <ArrowsRightLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* Destination Chain */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        To
                                    </label>
                                    <select
                                        value={destChain}
                                        onChange={(e) => setDestChain(e.target.value)}
                                        className="input"
                                    >
                                        {NETWORKS.filter(n => n.id !== sourceChain).map((network) => (
                                            <option key={network.id} value={network.id}>
                                                {network.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Amount (ETH)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.0"
                                            className="input pr-20"
                                            step="0.01"
                                            min="0"
                                        />
                                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                            MAX
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Available: 0.00 ETH
                                    </p>
                                </div>

                                {/* Bridge Button */}
                                <button
                                    onClick={handleBridgeAssets}
                                    className="w-full btn-primary py-3 text-lg"
                                    disabled={!amount || parseFloat(amount) <= 0}
                                >
                                    Bridge Assets
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bridge Info */}
                    <div className="space-y-6">
                        {/* Estimated Details */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Bridge Details
                                </h3>
                            </div>
                            <div className="card-body space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Estimated Fee
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {estimatedFee} ETH
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Estimated Time
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {estimatedTime}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            You will receive
                                        </span>
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                                            {amount ? (parseFloat(amount) - estimatedFee).toFixed(4) : '0.00'} ETH
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="card-body">
                                <div className="flex items-start space-x-3">
                                    <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900 dark:text-blue-100">
                                        <p className="font-semibold mb-1">Bridge powered by QIE SDK</p>
                                        <p className="text-blue-700 dark:text-blue-300">
                                            Your assets are secured by smart contracts. Always verify transaction details before confirming.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Bridges */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Recent Bridge Transactions
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                            No bridge transactions yet
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
