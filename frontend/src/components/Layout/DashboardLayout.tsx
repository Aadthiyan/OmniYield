import React from 'react';
import { useStore, useStoreActions } from '@/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationCenter } from './NotificationCenter';
import { Modal } from './Modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { ui, modal } = useStore();
  const { setUI } = useStoreActions();

  const toggleSidebar = () => {
    setUI({ sidebarOpen: !ui.sidebarOpen });
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${ui.theme}`}>
      {/* Sidebar */}
      <Sidebar isOpen={ui.sidebarOpen} onClose={() => setUI({ sidebarOpen: false })} />
      
      {/* Main content */}
      <div className={`transition-all duration-300 ${ui.sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter />

      {/* Modal */}
      <Modal 
        isOpen={modal.isOpen}
        type={modal.type}
        data={modal.data}
        onClose={() => setUI({ modal: { isOpen: false } })}
      />
    </div>
  );
};
