"use client";

import { useEffect } from 'react';

export default function SignUpPage() {
    useEffect(() => {
        // Redirect to Clerk's hosted sign-up page
        const clerkSignUpUrl = 'https://infinite-aardvark-49.accounts.dev/sign-up?redirect_url=https%3A%2F%2Fomniyield-theta.vercel.app%2Fdashboard';
        window.location.href = clerkSignUpUrl;
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Redirecting to sign up...</p>
            </div>
        </div>
    );
}
