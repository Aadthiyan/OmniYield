"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function HomePage() {
  const router = useRouter();
  const user = useStore((state) => state.user);

  useEffect(() => {
    // Redirect based on authentication status
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/landing');
    }
  }, [user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
