'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, PlusCircle, LogOut, TrendingUp, Activity, User } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useLanguage } from '../../contexts/LanguageContext';

import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const { logout } = useAuth();

  const navItems = [
    { name: t.navDashboard, path: '/', icon: LayoutDashboard },
    { name: t.navBots, path: '/bots', icon: Bot },
    { name: t.navCreateBot, path: '/create-bot', icon: PlusCircle },
    { name: 'Статистика', path: '/statistics', icon: TrendingUp },
    { name: language === 'RU' ? 'AI Аналитика' : language === 'KZ' ? 'AI Аналитика' : 'AI Analytics', path: '/admin/analytics', icon: Activity },
    { name: language === 'RU' ? 'Профиль' : language === 'KZ' ? 'Профиль' : 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={onClose}
      />
      <nav className={`${styles.sidebar} ${isOpen ? styles.sidebarMobileOpen : styles.sidebarMobileHidden}`}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>B</div>
          <div>
            <div className={styles.brandText}>BotFlow</div>
            <div className={styles.brandSub}>Enterprise AI</div>
          </div>
        </div>

        <div className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                href={item.path} 
                key={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => onClose()}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.bottomNav}>
          <button className={styles.navItem} onClick={logout}>
            <LogOut size={20} />
            <span>{t.navLogout}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
