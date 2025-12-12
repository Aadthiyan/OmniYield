"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
    ChartBarIcon,
    ShieldCheckIcon,
    BoltIcon,
    GlobeAltIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
    const router = useRouter();
    const user = useStore((state) => state.user);

    // Redirect to dashboard if already authenticated
    React.useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const features = [
        {
            icon: ChartBarIcon,
            title: 'Smart Yield Optimization',
            description: 'AI-powered algorithms automatically find and optimize the best yields across multiple DeFi protocols.',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: ShieldCheckIcon,
            title: 'Bank-Grade Security',
            description: 'Your assets are protected by industry-leading security measures and smart contract audits.',
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            icon: BoltIcon,
            title: 'Lightning Fast',
            description: 'Execute trades and rebalance your portfolio in milliseconds with our optimized infrastructure.',
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            icon: GlobeAltIcon,
            title: 'Multi-Chain Support',
            description: 'Access opportunities across Ethereum, Polygon, BSC, Arbitrum, and more from one dashboard.',
            gradient: 'from-orange-500 to-red-500',
        },
    ];

    const stats = [
        { label: 'Total Value Locked', value: '$2.5B+' },
        { label: 'Active Users', value: '50K+' },
        { label: 'Supported Chains', value: '10+' },
        { label: 'Average APY', value: '12.5%' },
    ];

    const benefits = [
        'No hidden fees or commissions',
        'Real-time portfolio tracking',
        'Automated yield optimization',
        'Cross-chain asset management',
        'Advanced analytics dashboard',
        '24/7 customer support',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <SparklesIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold gradient-text">YieldX</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="btn-primary"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center animate-fade-in">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6">
                            <span className="gradient-text">Maximize Your</span>
                            <br />
                            <span className="text-gray-900 dark:text-white">DeFi Yields</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                            The smartest way to earn passive income from your crypto. Automated yield farming across multiple chains.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/signup"
                                className="btn-primary text-lg px-8 py-4 flex items-center space-x-2"
                            >
                                <span>Get Started</span>
                                <ArrowRightIcon className="w-5 h-5" />
                            </Link>
                            <Link
                                href="#features"
                                className="btn-secondary text-lg px-8 py-4"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
                        {stats.map((stat, index) => (
                            <div
                                key={stat.label}
                                className="metric-card from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-center"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
                            Why Choose YieldX?
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Everything you need to maximize your DeFi returns
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className="card group"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="card-body">
                                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-4 bg-white/50 dark:bg-gray-900/50">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                <span className="gradient-text">Everything You Need</span>
                                <br />
                                <span className="text-gray-900 dark:text-white">In One Platform</span>
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                                YieldX combines the best DeFi protocols into one easy-to-use platform, saving you time and maximizing your returns.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {benefits.map((benefit) => (
                                    <div key={benefit} className="flex items-center space-x-3">
                                        <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl opacity-20 absolute inset-0 blur-3xl"></div>
                            <div className="relative card p-8">
                                <div className="text-center">
                                    <div className="text-6xl font-bold gradient-text mb-4">12.5%</div>
                                    <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Average APY
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Earn more than traditional savings accounts
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="metric-card from-blue-600 to-purple-600 text-center text-white p-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Start Earning?
                        </h2>
                        <p className="text-xl mb-8 opacity-90">
                            Create your account and start maximizing your DeFi yields in minutes
                        </p>
                        <Link
                            href="/signup"
                            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-lg inline-block"
                        >
                            Sign Up Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-800">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center text-gray-600 dark:text-gray-400">
                        <p className="mb-2">© 2024 YieldX. All rights reserved.</p>
                        <p className="text-sm">
                            Powered by cutting-edge DeFi technology
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
