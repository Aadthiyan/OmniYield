import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';

// Mock the store
jest.mock('@/store', () => ({
  useStore: () => ({
    ui: {
      sidebarOpen: false,
      theme: 'light',
      notifications: []
    },
    modal: {
      isOpen: false,
      type: 'connect-wallet'
    }
  }),
  useStoreActions: () => ({
    setUI: jest.fn()
  })
}));

// Mock child components
jest.mock('@/components/Layout/Sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar">{children}</div>
}));

jest.mock('@/components/Layout/Header', () => ({
  Header: ({ children }: { children: React.ReactNode }) => <div data-testid="header">{children}</div>
}));

jest.mock('@/components/Layout/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notification Center</div>
}));

jest.mock('@/components/Layout/Modal', () => ({
  Modal: () => <div data-testid="modal">Modal</div>
}));

describe('DashboardLayout', () => {
  it('renders without crashing', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const testContent = 'Dashboard Content';
    render(
      <DashboardLayout>
        <div>{testContent}</div>
      </DashboardLayout>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });
});
