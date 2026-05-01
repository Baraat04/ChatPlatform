'use client';

import { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import TopAppBar from '../TopAppBar/TopAppBar';
import styles from './LayoutWrapper.module.css';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className={styles.mainContent}>
        <TopAppBar onMenuClick={toggleSidebar} />
        {children}
      </div>
    </div>
  );
}
