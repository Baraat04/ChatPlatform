'use client';

import { Menu, Search, Bell, Settings } from 'lucide-react';
import styles from './TopAppBar.module.css';

interface TopAppBarProps {
  onMenuClick: () => void;
}

export default function TopAppBar({ onMenuClick }: TopAppBarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leftContainer}>
        <button className={styles.burgerButton} onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <span className={styles.brandMobile}>BotFlow</span>
      </div>

      <div className={styles.searchContainer}>
        <Search size={20} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search bots, analytics, or knowledge..." 
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.actionButton}>
          <Bell size={20} />
        </button>
        <button className={styles.actionButton}>
          <Settings size={20} />
        </button>
        <div className={styles.profileAvatar}>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVcV9jbhvUqNxaf96IlKLSaSsqgLG2WGUdByVcNzT1PwpWTOoj1REBBI3F6WYziOJ5lmh-luL0T72VHZgOd7OkoPT8H_EENeyfpdqftF_UBXc4hb_TE-CHgYvz-jBOWeJrcsG5_JW9GoBgTZ9A4ZF2g7QTpBF4Iaw_atp9RkuUtIhMOM146P3gKNpdx4CjhvfN4jv8ZoFrrupojf6fo0vp-qLTIcvfIo4-NXWfEAO1Rw2jskCKKKcGoPQzphtl7dNbZ9RlYR86V9xM" 
            alt="Profile" 
            className={styles.profileImg}
          />
        </div>
      </div>
    </header>
  );
}
