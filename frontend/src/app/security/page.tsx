"use client";

import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import {
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ComputerDesktopIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function SecurityPage() {
    const mockSessions = [
        {
            id: 1,
            device: 'Chrome on Windows',
            location: 'New York, USA',
            lastActive: '2 minutes ago',
            current: true,
        },
        {
            id: 2,
            device: 'Safari on iPhone',
            location: 'New York, USA',
            lastActive: '2 hours ago',
            current: false,
        },
    ];

    const mockAlerts = [
        {
            id: 1,
            type: 'warning',
            title: 'New device login detected',
            message: 'A new device logged into your account from New York',
            time: '1 hour ago',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Security
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your security settings and monitor account activity
                    </p>
                </div>

                {/* Security Score */}
                <div className="card bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100">Security Score</p>
                                <p className="text-5xl font-bold mt-2">85/100</p>
                                <p className="text-green-100 mt-1">Good security posture</p>
                            </div>
                            <ShieldCheckIcon className="w-24 h-24 text-green-200 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Security Alerts */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Security Alerts
                        </h2>
                    </div>
                    <div className="card-body">
                        {mockAlerts.length > 0 ? (
                            <div className="space-y-4">
                                {mockAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-start space-x-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                                    >
                                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {alert.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {alert.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                {alert.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                                No security alerts
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Sessions */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Active Sessions
                        </h2>
                    </div>
                    <div className="card-body">
                        <div className="space-y-4">
                            {mockSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                            <ComputerDesktopIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {session.device}
                                                </p>
                                                {session.current && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {session.location}
                                            </p>
                                            <div className="flex items-center space-x-1 mt-1">
                                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {session.lastActive}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {!session.current && (
                                        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors">
                                            <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Security Settings
                        </h2>
                    </div>
                    <div className="card-body space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    Two-Factor Authentication
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Add an extra layer of security to your account
                                </p>
                            </div>
                            <button className="btn-primary">
                                Enable
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    Transaction Signing
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Require signature for all transactions
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    Emergency Pause
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Immediately pause all active strategies
                                </p>
                            </div>
                            <button className="btn-danger">
                                Pause All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
