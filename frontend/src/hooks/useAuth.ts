import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useStore } from '@/store/useStore';
import { User, ConnectWalletRequest } from '@/types';
import { apiService } from '@/services/apiService';

export const useAuth = () => {
    const router = useRouter();
    const { signOut, getToken } = useClerkAuth();
    const { user: clerkUser, isLoaded } = useUser();
    const setUser = useStore((state) => state.setUser);
    const setWallet = useStore((state) => state.setWallet);
    const setWalletConnected = useStore((state) => state.setWalletConnected);
    const addNotification = useStore((state) => state.addNotification);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync Clerk user to store
    useEffect(() => {
        if (isLoaded && clerkUser) {
            const user: User = {
                id: clerkUser.id,
                name: clerkUser.firstName && clerkUser.lastName 
                    ? `${clerkUser.firstName} ${clerkUser.lastName}`
                    : clerkUser.username || 'User',
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                walletAddress: undefined,
                isActive: true,
                preferences: {
                    theme: 'system',
                    currency: 'USD',
                    notifications: {
                        email: true,
                        push: true,
                        yieldAlerts: true,
                        riskAlerts: true,
                        transactionUpdates: true
                    },
                    riskTolerance: 0.5,
                    defaultSlippage: 0.01
                },
                createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString()
            };
            setUser(user);
        } else if (isLoaded && !clerkUser) {
            setUser(null);
        }
    }, [isLoaded, clerkUser, setUser]);

    const connectWallet = useCallback(async (walletAddress: string, signature?: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Use apiService method with Clerk authentication
            await apiService.connectWallet({
                walletAddress,
                signature
            } as ConnectWalletRequest);

            // Update wallet in store
            setWallet({
                address: walletAddress,
                balance: '0',
                network: 'ethereum',
                chainId: 1,
                isConnected: true
            });
            setWalletConnected(true);

            addNotification({
                type: 'success',
                title: 'Wallet Connected',
                message: `Connected wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
                read: false
            });
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to connect wallet';
            setError(errorMsg);
            addNotification({
                type: 'error',
                title: 'Wallet Connection Failed',
                message: errorMsg,
                read: false
            });
        } finally {
            setIsLoading(false);
        }
    }, [setWallet, setWalletConnected, addNotification]);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            await signOut();
            setUser(null);
            setWallet(null);
            setWalletConnected(false);
            router.push('/');

            addNotification({
                type: 'info',
                title: 'Logged Out',
                message: 'You have been successfully logged out.',
                read: false
            });
        } catch (err: any) {
            const errorMsg = err.message || 'Logout failed';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [signOut, setUser, setWallet, setWalletConnected, router, addNotification]);

    return {
        connectWallet,
        logout,
        isLoading,
        error,
        user: clerkUser ? {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            name: clerkUser.firstName && clerkUser.lastName 
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : clerkUser.username || 'User'
        } : null
    };
};
