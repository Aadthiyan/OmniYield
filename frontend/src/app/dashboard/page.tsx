"use client";

import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { PortfolioOverview } from '@/components/Dashboard/PortfolioOverview';
import { PortfolioChart } from '@/components/Dashboard/PortfolioChart';
import { StrategiesList } from '@/components/Dashboard/StrategiesList';
import { RecentTransactions } from '@/components/Dashboard/RecentTransactions';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-8 animate-fade-in">
                    {/* Page header */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-3">
                            Dashboard
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Monitor your DeFi yield farming strategies and portfolio performance
                        </p>
                    </div>

                    {/* Portfolio overview */}
                    <PortfolioOverview />

                    {/* Charts */}
                    <PortfolioChart />

                    {/* Bottom section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Strategies */}
                        <StrategiesList />

                        {/* Recent transactions */}
                        <RecentTransactions />
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
