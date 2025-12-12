"use client";

import React, { useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useStore } from '@/store/useStore';
import {
    ArrowUpIcon,
    ArrowDownIcon,
    PlusIcon,
    MinusIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage, formatTokenAmount } from '@/utils/formatters';

export default function PortfolioPage() {
    const { optimizePortfolio } = usePortfolio();
    const userStrategies = useStore((state) => state.userStrategies);
    const portfolioSummary = useStore((state) => state.portfolioSummary);
    const loading = useStore((state) => state.loading);

    const totalValue = Number(portfolioSummary?.totalValue || 0);
    const totalYield = Number(portfolioSummary?.totalYield || 0);
    const averageApy = 0.05; // Mock APY for now

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Portfolio
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Manage your DeFi portfolio and track your investments
                            </p>
                        </div>
                        <button
                            onClick={() => {/* Optimization requires strategies data */ }}
                            className="btn-primary flex items-center space-x-2"
                            disabled={true}
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                            <span>Optimize Portfolio</span>
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                            {formatCurrency(totalValue / 1e18)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                        <ArrowUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Yield Earned</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                            {formatCurrency(totalYield / 1e18)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                        <PlusIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Average APY</p>
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                            {formatPercentage(averageApy)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                        <ArrowPathIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Positions */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Your Positions
                            </h2>
                        </div>
                        <div className="card-body">
                            {loading.portfolio ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading positions...</p>
                                </div>
                            ) : userStrategies.length > 0 ? (
                                <div className="space-y-4">
                                    {userStrategies.map((position) => (
                                        <div
                                            key={position.id}
                                            className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        Strategy #{position.strategyId}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        Amount: {formatTokenAmount(position.amount.toString())} ETH
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {formatPercentage(position.weight || 0)}
                                                    </p>
                                                </div>
                                                <div className="ml-4 flex space-x-2">
                                                    <button className="btn-secondary text-sm">
                                                        <PlusIcon className="w-4 h-4 mr-1 inline" />
                                                        Deposit
                                                    </button>
                                                    <button className="btn-danger text-sm">
                                                        <MinusIcon className="w-4 h-4 mr-1 inline" />
                                                        Withdraw
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No positions yet. Start investing in strategies to see them here.
                                    </p>
                                    <button className="btn-primary mt-4">
                                        Browse Strategies
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
