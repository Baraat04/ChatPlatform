'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '../Sidebar/Sidebar';
import TopAppBar from '../TopAppBar/TopAppBar';
import styles from './LayoutWrapper.module.css';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const noLayoutPage = isAuthPage;

  useEffect(() => {
    if (!loading && !user && !noLayoutPage) {
      router.push('/login');
    }
  }, [user, loading, noLayoutPage, router]);

  console.log('LayoutWrapper RENDER: loading =', loading, 'noLayoutPage =', noLayoutPage, 'user =', user?.id);
  
  // Public routes (/login, /register, landing page) should render immediately without loading blocks
  if (noLayoutPage) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff' }}>Loading...</div>;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className={styles.layout}>
          {!noLayoutPage && <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />}
          <div className={noLayoutPage ? styles.fullWidthContent : styles.mainContent}>
            {!noLayoutPage && <TopAppBar onMenuClick={toggleSidebar} />}
            {children}
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
