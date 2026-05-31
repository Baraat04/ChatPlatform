'use client';

import { Menu, Search, Bell, Globe, Sun, Moon, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './TopAppBar.module.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../locales/translations';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import InitialsAvatar from '../InitialsAvatar/InitialsAvatar';

interface TopAppBarProps {
  onMenuClick: () => void;
}

export default function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.leftContainer}>
        <button className={styles.burgerButton} onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <span className={styles.brandMobile}>UP-CHAT</span>
      </div>



      <div className={styles.langSelectorWrapper} onClick={() => setIsLangOpen(!isLangOpen)} ref={langRef}>
        <Globe size={16} className={styles.langIcon} />
        <span className={styles.langValue}>{language}</span>
        <ChevronDown size={14} className={styles.langIcon} style={{ transform: isLangOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        
        {isLangOpen && (
          <div className={styles.langDropdown}>
            {(['EN', 'RU', 'KZ'] as Language[]).map((l) => (
              <div 
                key={l} 
                className={`${styles.langOption} ${language === l ? styles.langOptionActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(l);
                  setIsLangOpen(false);
                }}
              >
                {l === 'EN' ? 'English' : l === 'RU' ? 'Русский' : 'Қазақша'}
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={toggleTheme} 
        className={styles.actionButton}
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        style={{ marginRight: '8px' }}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className={styles.actions}>
        <button className={styles.actionButton}>
          <Bell size={20} />
        </button>
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <InitialsAvatar name={user?.name} size={36} fontSize={14} border />
        </Link>
      </div>
    </header>
  );
}
