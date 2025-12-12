import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  User,
  WalletInfo,
  Strategy,
  UserStrategy,
  PortfolioSummary,
  UIState,
  ModalState,
  Notification,
  UserPreferences,
  Network
} from '@/types';

// Main application store
interface AppState {
  // User state
  user: User | null;
  wallet: WalletInfo | null;
  isWalletConnected: boolean;

  // Portfolio state
  strategies: Strategy[];
  userStrategies: UserStrategy[];
  portfolioSummary: PortfolioSummary | null;

  // UI state
  ui: UIState;
  modal: ModalState;

  // Loading states
  loading: {
    strategies: boolean;
    portfolio: boolean;
    wallet: boolean;
    optimization: boolean;
    rebalance: boolean;
  };

  // Error state
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setWallet: (wallet: WalletInfo | null) => void;
  setWalletConnected: (connected: boolean) => void;
  setStrategies: (strategies: Strategy[]) => void;
  setUserStrategies: (strategies: UserStrategy[]) => void;
  setPortfolioSummary: (summary: PortfolioSummary | null) => void;
  setUI: (ui: Partial<UIState>) => void;
  setModal: (modal: Partial<ModalState>) => void;
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  switchNetwork: (network: Network) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  wallet: null,
  isWalletConnected: false,
  strategies: [],
  userStrategies: [],
  portfolioSummary: null,
  ui: {
    theme: 'system' as const,
    sidebarOpen: true,
    loading: false,
    error: null,
    notifications: []
  },
  modal: {
    isOpen: false,
    type: 'connect-wallet' as const,
    data: null
  },
  loading: {
    strategies: false,
    portfolio: false,
    wallet: false,
    optimization: false,
    rebalance: false
  },
  error: null
};

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User actions
        setUser: (user) => set({ user }),

        // Wallet actions
        setWallet: (wallet) => set({ wallet, isWalletConnected: !!wallet }),
        setWalletConnected: (connected) => set({ isWalletConnected: connected }),

        // Portfolio actions
        setStrategies: (strategies) => set({ strategies }),
        setUserStrategies: (userStrategies) => set({ userStrategies }),
        setPortfolioSummary: (portfolioSummary) => set({ portfolioSummary }),

        // UI actions
        setUI: (ui) => set((state) => ({ ui: { ...state.ui, ...ui } })),
        setModal: (modal) => set((state) => ({ modal: { ...state.modal, ...modal } })),

        // Loading actions
        setLoading: (key, loading) =>
          set((state) => ({
            loading: { ...state.loading, [key]: loading }
          })),

        // Error actions
        setError: (error) => set({ error }),

        // Notification actions
        addNotification: (notification) =>
          set((state) => ({
            ui: {
              ...state.ui,
              notifications: [
                ...state.ui.notifications,
                {
                  ...notification,
                  id: Date.now().toString(),
                  timestamp: new Date().toISOString()
                }
              ]
            }
          })),

        removeNotification: (id) =>
          set((state) => ({
            ui: {
              ...state.ui,
              notifications: state.ui.notifications.filter((n) => n.id !== id)
            }
          })),

        markNotificationAsRead: (id) =>
          set((state) => ({
            ui: {
              ...state.ui,
              notifications: state.ui.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              )
            }
          })),

        clearNotifications: () =>
          set((state) => ({
            ui: { ...state.ui, notifications: [] }
          })),

        // User preferences
        updateUserPreferences: (preferences) =>
          set((state) => ({
            user: state.user
              ? { ...state.user, preferences: { ...state.user.preferences, ...preferences } }
              : null
          })),

        // Network switching
        switchNetwork: (network) => {
          // This would trigger wallet network switch
          console.log('Switching to network:', network);
        },

        // Reset store
        reset: () => set(initialState)
      }),
      {
        name: 'defi-yield-aggregator-store',
        partialize: (state) => ({
          user: state.user,
          ui: {
            theme: state.ui.theme,
            sidebarOpen: state.ui.sidebarOpen,
            loading: false,
            error: null,
            notifications: []
          }
        })
      }
    ),
    {
      name: 'defi-yield-aggregator'
    }
  )
);

// Selectors for better performance
export const useUser = () => useStore((state) => state.user);
export const useWallet = () => useStore((state) => state.wallet);
export const useIsWalletConnected = () => useStore((state) => state.isWalletConnected);
export const useStrategies = () => useStore((state) => state.strategies);
export const useUserStrategies = () => useStore((state) => state.userStrategies);
export const usePortfolioSummary = () => useStore((state) => state.portfolioSummary);
export const useUI = () => useStore((state) => state.ui);
export const useModal = () => useStore((state) => state.modal);
export const useLoading = () => useStore((state) => state.loading);
export const useError = () => useStore((state) => state.error);
export const useNotifications = () => useStore((state) => state.ui.notifications);

// Action selectors
export const useStoreActions = () => useStore((state) => ({
  setUser: state.setUser,
  setWallet: state.setWallet,
  setWalletConnected: state.setWalletConnected,
  setStrategies: state.setStrategies,
  setUserStrategies: state.setUserStrategies,
  setPortfolioSummary: state.setPortfolioSummary,
  setUI: state.setUI,
  setModal: state.setModal,
  setLoading: state.setLoading,
  setError: state.setError,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markNotificationAsRead: state.markNotificationAsRead,
  clearNotifications: state.clearNotifications,
  updateUserPreferences: state.updateUserPreferences,
  switchNetwork: state.switchNetwork,
  reset: state.reset
}));
