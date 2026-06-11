'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Bot, ArrowRight, Link as LinkIcon } from 'lucide-react';
import styles from './page.module.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function MyBots() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [bots, setBots] = useState<any[]>([]);
  const [stats, setStats] = useState({ messageCount: 0, cost: "0.00" });
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal once per user account (keyed by user.id so new accounts always see it)
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const key = `up_welcome_shown_${user.id}`;
      const welcomeShown = localStorage.getItem(key);
      if (!welcomeShown) {
        setShowWelcome(true);
      }
    }
  }, [user?.id]);

  const handleCloseWelcome = (startCreation = false) => {
    if (user?.id) {
      localStorage.setItem(`up_welcome_shown_${user.id}`, 'true');
    }
    setShowWelcome(false);
    if (startCreation) {
      router.push('/create-bot');
    }
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/stats`, { credentials: 'include' });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error('Stats fetch error:', e);
      }
    }
    fetchStats();
    async function fetchBots() {
      try {
        const res = await fetch(`${API_URL}/bot`, { credentials: 'include' });
        const data = await res.json();
        console.log(data)

        const formattedBots = data.map((bot: any) => ({
          id: bot.id,
          name: `Bot ${bot.id}`,
          type: bot.platform,
          status: bot.isActive ? 'ONLINE' : 'OFFLINE',
          description: bot.system_prompt.slice(0, 100) + '...',
          slug: bot.slug,
          createdAt: new Date(bot.createdAt).toLocaleDateString(),
        }));

        setBots(formattedBots);
      } catch (error) {
        console.log('Fetch error:', error);
      }
    }

    fetchBots();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.myBots}</h1>
          <p className={styles.subtitle}>{t.myBotsSub}</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.filterBtn}>
            <Filter size={18} />
            {t.filter}
          </button>

          <Link href="/create-bot" className={styles.newBotBtn}>
            <Plus size={18} />
            {t.newBot}
          </Link>
        </div>
      </div>


      <div className={styles.botsGrid}>
        {bots.length === 0 ? (
          <div className={styles.emptyState}>
            <Bot size={48} className={styles.emptyIcon} />
            <span className={styles.emptyText}>{t.noBotsText}</span>

            <Link href="/create-bot" className={styles.newBotBtn} style={{ marginTop: '16px' }}>
              {t.createFirstBot}
            </Link>
          </div>
        ) : (
          bots.map((bot: any) => (
            <Link href={`/bots/${bot.id}`} key={bot.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.botCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.botInfo}>
                    <div className={styles.botIcon}>
                      <Bot size={24} />
                    </div>

                    <div>
                      <div className={styles.botName}>{bot.name}</div>
                      <div className={styles.botSub}>{bot.type}</div>
                    </div>
                  </div>

                  <div className={styles.statusBadge}>
                    <div className={`${styles.statusDot} ${bot.status === 'ONLINE' ? styles.statusDotOnline : ''}`}></div>
                    {bot.status}
                  </div>
                </div>

                <div className={styles.botDesc}>{bot.description}</div>

                <div className={styles.divider}></div>

                <div className={styles.cardFooter}>
                  <div className={styles.integration}>
                    <LinkIcon size={16} />
                    {bot.slug}
                  </div>

                  <div className={styles.integration}>
                    {t.created}: {bot.createdAt}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <style>{`
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.9) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .pop-in-card {
              animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>
          
          <div className="pop-in-card" style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: '28px',
            padding: '40px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {/* Colorful top accent */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '6px',
              background: 'linear-gradient(to right, var(--primary), #10b981)'
            }}></div>

            <div style={{
              width: '80px', height: '80px',
              background: 'rgba(43, 108, 0, 0.1)',
              borderRadius: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px auto',
            }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover' }} />
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--on-surface)', marginBottom: '12px' }}>
              Добро пожаловать в UP-CHAT! 👋
            </h2>

            <p style={{ color: 'var(--on-surface-variant)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
              Рады видеть вас на платформе! Давайте создадим вашего первого умного AI-ассистента всего за 3 простых шага. Он сможет общаться с вашими клиентами и отвечать на их вопросы 24/7.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => handleCloseWelcome(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 16px rgba(43, 108, 0, 0.15)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.filter = 'brightness(0.9)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                🚀 Создать первого ассистента
              </button>
              
              <button 
                onClick={() => handleCloseWelcome(false)}
                style={{
                  background: 'transparent',
                  color: 'var(--on-surface-variant)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--on-surface)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--on-surface-variant)'}
              >
                Я осмотрюсь сам
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}