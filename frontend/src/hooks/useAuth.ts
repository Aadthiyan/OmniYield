import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { User, LoginRequest, SignupRequest, ConnectWalletRequest } from '@/types';
import { apiService } from '@/services/apiService';

// API URL (should be in env vars in production)
const API_URL = 'http://localhost:8000/api/auth';

interface LoginCredentials {
    email: string;
    password: string;
}

interface SignUpCredentials {
    name: string;
    email: string;
    password: string;
}

export const useAuth = () => {
    const router = useRouter();
    const setUser = useStore((state) => state.setUser);
    const setWallet = useStore((state) => state.setWallet);
    const setWalletConnected = useStore((state) => state.setWalletConnected);
    const addNotification = useStore((state) => state.addNotification);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            setIsLoading(true);
            setError(null);

            // Use new apiService method
            const response = await apiService.login({
                email: credentials.email,
                password: credentials.password
            } as LoginRequest);

            // Transform backend user to frontend user type
            const user: User = {
                id: response.user.id.toString(),
                name: response.user.name,
                email: response.user.email,
                walletAddress: response.user.walletAddress,
                isActive: response.user.isActive,
                preferences: response.user.preferences,
                createdAt: response.user.createdAt,
                updatedAt: response.user.updatedAt
            };

            setUser(user);

            // If user has a wallet connected, restore it
            if (user.walletAddress) {
                setWallet({
                    address: user.walletAddress,
                    balance: '0', // Would need to fetch
                    network: 'ethereum',
                    chainId: 1,
                    isConnected: true
                });
                setWalletConnected(true);
            }

            addNotification({
                type: 'success',
                title: 'Welcome back!',
                message: `Successfully logged in as ${user.name}`,
                read: false
            });

            router.push('/dashboard');
        } catch (err: any) {
            const errorMsg = err.message || 'Login failed';
            setError(errorMsg);
            addNotification({
                type: 'error',
                title: 'Login Failed',
                message: errorMsg,
                read: false
            });
        } finally {
            setIsLoading(false);
        }
    }, [setUser, setWallet, setWalletConnected, addNotification, router]);

    const signup = useCallback(async (credentials: SignUpCredentials) => {
        try {
            setIsLoading(true);
            setError(null);

            // Use new apiService method
            const response = await apiService.signup({
                name: credentials.name,
                email: credentials.email,
                password: credentials.password
            } as SignupRequest);

            // Transform backend user to frontend user type
            const user: User = {
                id: response.user.id.toString(),
                name: response.user.name,
                email: response.user.email,
                walletAddress: response.user.walletAddress,
                isActive: response.user.isActive,
                preferences: response.user.preferences,
                createdAt: response.user.createdAt,
                updatedAt: response.user.updatedAt
            };

            setUser(user);

            addNotification({
                type: 'success',
                title: 'Account Created',
                message: 'Welcome to YieldX! Your account has been created.',
                read: false
            });

            router.push('/dashboard');
        } catch (err: any) {
            const errorMsg = err.message || 'Sign up failed';
            setError(errorMsg);
            addNotification({
                type: 'error',
                title: 'Sign Up Failed',
                message: errorMsg,
                read: false
            });
        } finally {
            setIsLoading(false);
        }
    }, [setUser, addNotification, router]);

    const connectWallet = useCallback(async (walletAddress: string, signature?: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Use new apiService method
            await apiService.connectWallet({
                walletAddress,
                signature
            } as ConnectWalletRequest);

            // Update wallet in store
            setWallet({
                address: walletAddress,
                balance: '0', // Would need to fetch
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

    const logout = useCallback(() => {
        apiService.logout();
        setUser(null);
        setWallet(null);
        setWalletConnected(false);
        router.push('/login');

        addNotification({
            type: 'info',
            title: 'Logged Out',
            message: 'You have been successfully logged out.',
            read: false
        });
    }, [setUser, setWallet, setWalletConnected, router, addNotification]);

    return {
        login,
        signup,
        connectWallet,
        logout,
        isLoading,
        error
    };
};
