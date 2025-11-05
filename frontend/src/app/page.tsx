import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { PortfolioOverview } from '@/components/Dashboard/PortfolioOverview';
import { PortfolioChart } from '@/components/Dashboard/PortfolioChart';
import { StrategiesList } from '@/components/Dashboard/StrategiesList';
import { RecentTransactions } from '@/components/Dashboard/RecentTransactions';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
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
  );
}
