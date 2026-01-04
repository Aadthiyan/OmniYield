"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Wait for Clerk to load before redirecting
    if (!isLoaded) return;

    // Redirect based on authentication status
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/landing');
    }
  }, [user, isLoaded, router]);

  // Show loading while Clerk is loading or redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {!isLoaded ? 'Authenticating...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
