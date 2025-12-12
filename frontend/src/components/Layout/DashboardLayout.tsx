"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { Header } from './Header';
import { NotificationCenter } from './NotificationCenter';
import { Modal } from './Modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const modal = useStore((state) => state.modal);
  const setModal = useStore((state) => state.setModal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      {/* Header with navigation */}
      <Header />

      {/* Page content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>

      {/* Notification Center */}
      <NotificationCenter />

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        data={modal.data}
        onClose={() => setModal({ isOpen: false })}
      />
    </div>
  );
};
