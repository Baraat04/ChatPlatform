'use client';

import { Menu, Search, Bell, Globe, ChevronDown, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './TopAppBar.module.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../locales/translations';
import { useAuth } from '../../contexts/AuthContext';

import InitialsAvatar from '../InitialsAvatar/InitialsAvatar';

interface TopAppBarProps {
  onMenuClick: () => void;
}

export default function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
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
    <>
      <header className={styles.header}>
      <div className={styles.leftContainer}>
        <button className={styles.burgerButton} onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <span className={styles.brandMobile}>UP-CHAT</span>
      </div>

      {user && user.messagesRemaining <= 20 && user.messagesRemaining > 0 && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            background: 'var(--error)', 
            color: 'var(--on-error)', 
            padding: '4px 12px', 
            borderRadius: '16px', 
            fontSize: '12px', 
            fontWeight: '600',
            animation: 'pulse 2s infinite'
          }}>
            Осталось сообщений: {user.messagesRemaining}
          </div>
        </div>
      )}

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


      <div className={styles.actions}>
        <button className={styles.actionButton}>
          <Bell size={20} />
        </button>
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <InitialsAvatar name={user?.name} size={36} fontSize={14} border />
        </Link>
      </div>
      </header>
      {user && user.messagesRemaining <= 0 && (
        <div style={{
          width: '100%',
          background: '#ef4444',
          color: 'white',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          position: 'sticky',
          top: '64px',
          zIndex: 39,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'center' }}>
            {(t as any).balanceExhaustedBanner || 'Ваш баланс токенов исчерпан! Все боты были приостановлены. Пожалуйста, пополните баланс.'}
          </span>
          <Link href="/profile" style={{
            marginLeft: '8px',
            background: 'white',
            color: '#ef4444',
            padding: '6px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}>
            {(t as any).topupBtn || 'Пополнить'}
          </Link>
        </div>
      )}
    </>
  );
}
