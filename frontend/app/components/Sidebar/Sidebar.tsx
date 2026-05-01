'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, BookOpen, PlusCircle, HelpCircle, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Bots', path: '/bots', icon: Bot },
    { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
    { name: 'Create Bot', path: '/create-bot', icon: PlusCircle },
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
          <button className={styles.navItem}>
            <HelpCircle size={20} />
            <span>Support</span>
          </button>
          <button className={styles.navItem}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
