"use client";

import React from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <Link href="/landing" className="inline-flex items-center space-x-2 mb-6 group">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">YieldX</span>
                    </Link>
                </div>

                {/* Clerk SignIn Component */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 animate-fade-in">
                    <SignIn 
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none border-0 rounded-2xl",
                                headerTitle: "text-3xl font-bold text-gray-900 dark:text-white",
                                headerSubtitle: "text-gray-600 dark:text-gray-400",
                                formFieldLabel: "text-sm font-medium text-gray-700 dark:text-gray-300",
                                formFieldInput: "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white",
                                button: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200",
                                dividerLine: "bg-gray-200 dark:bg-gray-700",
                                dividerText: "text-gray-600 dark:text-gray-400",
                                socialButtonsBlockButton: "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white",
                                footerActionLink: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium",
                                identifierInputField: "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
                            }
                        }}
                        redirectUrl="/dashboard"
                    />
                </div>

                {/* Sign up link */}
                <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">
                        Sign up for free
                    </Link>
                </div>
            </div>
        </div>
    );
}

