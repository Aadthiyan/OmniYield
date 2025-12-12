"use client";

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useStore } from '@/store/useStore';
import {
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
    BellIcon,
    GlobeAltIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
    const ui = useStore((state) => state.ui);
    const setUI = useStore((state) => state.setUI);

    const [settings, setSettings] = useState({
        theme: ui.theme,
        currency: 'USD',
        language: 'en',
        defaultSlippage: 0.5,
        gasPrice: 'medium',
        notifications: {
            email: true,
            push: true,
            yieldAlerts: true,
            priceAlerts: false,
        },
    });

    const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
        setSettings({ ...settings, theme });
        setUI({ theme });
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Configure your application preferences
                    </p>
                </div>

                {/* Appearance */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Appearance
                        </h2>
                    </div>
                    <div className="card-body">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Theme
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => handleThemeChange('light')}
                                className={`p-4 rounded-lg border-2 transition-all ${settings.theme === 'light'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <SunIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
                            </button>

                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`p-4 rounded-lg border-2 transition-all ${settings.theme === 'dark'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <MoonIcon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
                            </button>

                            <button
                                onClick={() => handleThemeChange('system')}
                                className={`p-4 rounded-lg border-2 transition-all ${settings.theme === 'system'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <ComputerDesktopIcon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm font-medium text-gray-900 dark:text-white">System</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Preferences
                        </h2>
                    </div>
                    <div className="card-body space-y-6">
                        {/* Currency */}
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <CurrencyDollarIcon className="w-5 h-5" />
                                <span>Display Currency</span>
                            </label>
                            <select
                                value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                className="input"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="ETH">ETH (Ξ)</option>
                                <option value="BTC">BTC (₿)</option>
                            </select>
                        </div>

                        {/* Language */}
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <GlobeAltIcon className="w-5 h-5" />
                                <span>Language</span>
                            </label>
                            <select
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                className="input"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                                <option value="zh">中文</option>
                            </select>
                        </div>

                        {/* Default Slippage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Default Slippage Tolerance: {settings.defaultSlippage}%
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={settings.defaultSlippage}
                                onChange={(e) => setSettings({ ...settings, defaultSlippage: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>0.1%</span>
                                <span>5%</span>
                            </div>
                        </div>

                        {/* Gas Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Default Gas Price
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['low', 'medium', 'high'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSettings({ ...settings, gasPrice: level })}
                                        className={`p-3 rounded-lg border-2 transition-all capitalize ${settings.gasPrice === level
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card">
                    <div className="card-header">
                        <div className="flex items-center space-x-2">
                            <BellIcon className="w-5 h-5" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Notifications
                            </h2>
                        </div>
                    </div>
                    <div className="card-body space-y-4">
                        {Object.entries(settings.notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Receive notifications via {key === 'email' ? 'email' : key === 'push' ? 'push' : 'alerts'}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={value}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                notifications: { ...settings.notifications, [key]: e.target.checked },
                                            })
                                        }
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button className="btn-primary px-8">
                        Save Changes
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
