'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 h-screen flex overflow-hidden transition-colors">
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        <Header onMenuClick={openSidebar} />

        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
