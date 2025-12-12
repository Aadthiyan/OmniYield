"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useStrategies } from '@/hooks/useStrategies';
import { useStore } from '@/store/useStore';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    SparklesIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { formatPercentage, formatCurrency, formatRiskScore, getRiskColor } from '@/utils/formatters';
import { Network } from '@/types';

export default function StrategiesPage() {
    const { fetchStrategies } = useStrategies();
    const strategies = useStore((state) => state.strategies);
    const loading = useStore((state) => state.loading);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState<Network | 'all'>('all');
    const [minApy, setMinApy] = useState(0);

    useEffect(() => {
        fetchStrategies();
    }, [fetchStrategies]);

    const filteredStrategies = strategies.filter((strategy) => {
        const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesNetwork = selectedNetwork === 'all' || strategy.network === selectedNetwork;
        const matchesApy = strategy.apy >= minApy;
        return matchesSearch && matchesNetwork && matchesApy && strategy.isActive;
    });

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Strategies
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Explore and invest in the best yield farming strategies
                    </p>
                </div>

                {/* Filters */}
                <div className="card">
                    <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search strategies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input pl-10"
                                />
                            </div>

                            {/* Network Filter */}
                            <select
                                value={selectedNetwork}
                                onChange={(e) => setSelectedNetwork(e.target.value as Network | 'all')}
                                className="input"
                            >
                                <option value="all">All Networks</option>
                                <option value="ethereum">Ethereum</option>
                                <option value="polygon">Polygon</option>
                                <option value="bsc">BSC</option>
                                <option value="arbitrum">Arbitrum</option>
                            </select>

                            {/* Min APY Filter */}
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    Min APY: {formatPercentage(minApy)}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={minApy}
                                    onChange={(e) => setMinApy(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Results Count */}
                            <div className="flex items-center justify-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {filteredStrategies.length}
                                    </span>{' '}
                                    strategies found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategies Grid */}
                {loading.strategies ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading strategies...</p>
                    </div>
                ) : filteredStrategies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStrategies.map((strategy) => (
                            <div key={strategy.id} className="card hover:shadow-lg transition-shadow">
                                <div className="card-body">
                                    {/* Strategy Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                {strategy.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                {strategy.type} • {strategy.network}
                                            </p>
                                        </div>
                                        <SparklesIcon className="w-6 h-6 text-yellow-500" />
                                    </div>

                                    {/* Metrics */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">APY</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                {formatPercentage(strategy.apy)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">TVL</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(strategy.tvl / 1e18)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Risk</span>
                                            <span className={`font-semibold ${getRiskColor(strategy.riskScore)}`}>
                                                {formatRiskScore(strategy.riskScore)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className="w-full btn-primary">
                                        Invest in Strategy
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <FunnelIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                No strategies match your filters. Try adjusting your search criteria.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
