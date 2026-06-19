'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import InitialsAvatar from '../components/InitialsAvatar/InitialsAvatar';
import styles from './page.module.css';
import { Mail, Shield, Clock, MessageCircle, TrendingUp, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import { API_URL } from '../config';
import { useSearchParams } from 'next/navigation';

const profileDict = {
  RU: {
    loading: 'Загрузка профиля...',
    notAuth: 'Не авторизован.',
    login: 'Войти',
    title: 'Ваш профиль',
    subtitle: 'Управляйте своим аккаунтом и просматривайте статистику',
    back: 'На главную',
    role: 'Administrator',
    fullName: 'Полное имя',
    security: 'Безопасность',
    lastActivity: 'Последняя активность',
    logout: 'Выйти из аккаунта',
    statsTitle: 'Статистика аккаунта',
    statsSubtitle: 'Текущее использование платформы',
    plan: 'Текущий тариф',
    balance: 'Баланс сообщений',
    sent: 'Всего отправлено',
    knowledgeBases: 'Баз знаний',
    analytics: 'Открыть статистику',
    expand: 'Расширить возможности',
    messages: 'сообщений',
    popular: 'ПОПУЛЯРНО',
    growthBonus: '6,000 сообщений + приоритет',
    proBonus: '15,000 сообщений + макс. скорость',
    purchaseSuccess: 'Успешно! Добавлено {amount} сообщений',
    purchaseError: 'Ошибка при покупке',
    networkError: 'Ошибка соединения',
    freeExhausted: 'Ваши 100 бесплатных сообщений закончились. Готовы начать по-настоящему? Выберите один из наших тарифов ниже!'
  },
  EN: {
    loading: 'Loading profile...',
    notAuth: 'Not authorized.',
    login: 'Log in',
    title: 'Your Profile',
    subtitle: 'Manage your account and view statistics',
    back: 'Back to Home',
    role: 'Administrator',
    fullName: 'Full Name',
    security: 'Security',
    lastActivity: 'Last Activity',
    logout: 'Log out',
    statsTitle: 'Account Statistics',
    statsSubtitle: 'Current platform usage',
    plan: 'Current Plan',
    balance: 'Message Balance',
    sent: 'Total Sent',
    knowledgeBases: 'Knowledge Bases',
    analytics: 'Open Analytics',
    expand: 'Expand capabilities',
    messages: 'messages',
    popular: 'POPULAR',
    growthBonus: '6,000 messages + priority',
    proBonus: '15,000 messages + max speed',
    purchaseSuccess: 'Success! Added {amount} messages',
    purchaseError: 'Purchase error',
    networkError: 'Network error',
    freeExhausted: 'Your 100 free messages are over. Ready to really start? Choose one of our plans below!'
  },
  KZ: {
    loading: 'Профиль жүктелуде...',
    notAuth: 'Авторизациядан өтпеген.',
    login: 'Кіру',
    title: 'Сіздің профиліңіз',
    subtitle: 'Тіркелгіңізді басқарыңыз және статистиканы көріңіз',
    back: 'Басты бетке',
    role: 'Administrator',
    fullName: 'Толық аты-жөні',
    security: 'Қауіпсіздік',
    lastActivity: 'Соңғы белсенділік',
    logout: 'Шығу',
    statsTitle: 'Тіркелгі статистикасы',
    statsSubtitle: 'Платформаны ағымдағы пайдалану',
    plan: 'Ағымдағы тариф',
    balance: 'Хабарламалар теңгерімі',
    sent: 'Барлығы жіберілді',
    knowledgeBases: 'Білім базалары',
    analytics: 'Статистиканы ашу',
    expand: 'Мүмкіндіктерді кеңейту',
    messages: 'хабарлама',
    popular: 'ТАНЫМАЛ',
    growthBonus: '6,000 хабарлама + басымдық',
    proBonus: '15,000 хабарлама + макс. жылдамдық',
    purchaseSuccess: 'Сәтті! {amount} хабарлама қосылды',
    purchaseError: 'Сатып алу қатесі',
    networkError: 'Қосылу қатесі',
    freeExhausted: 'Сіздің 100 тегін хабарламаңыз таусылды. Нағыз жұмысты бастауға дайынсыз ба? Төмендегі тарифтердің бірін таңдаңыз!'
  }
};


function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${highlight ? styles.statHighlight : ''}`}>{value}</span>
    </div>
  );
}

export default function Profile() {
  const { user, loading, logout, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const t = profileDict[language] || profileDict.RU;
  const searchParams = useSearchParams();

  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Auto-refresh profile after successful payment redirect
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    if (paymentStatus === 'success') {
      // Poll a few times to wait for Robokassa webhook to update the DB
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshProfile();
        if (attempts >= 5) clearInterval(poll);
      }, 2000);
      return () => clearInterval(poll);
    }
  }, [searchParams]);

  const showBanner = (type: 'success' | 'error', msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 4000);
  };

  const handlePurchase = async (plan: string) => {
    setPurchaseLoading(plan);
    try {
      const res = await fetch(`${API_URL}/payments/robokassa/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user?.id }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        showBanner('error', data.error || t.purchaseError);
      }
    } catch (e) {
      showBanner('error', t.networkError);
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loadingWrap}>
        <p style={{ color: 'var(--on-surface-variant)' }}>{t.notAuth}</p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t.login}</Link>
      </div>
    );
  }

  const joinedDate = new Date().toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'KZ' ? 'kk-KZ' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      {banner && (
        <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>
          {banner.msg}
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t.title}</h1>
          <p className={styles.pageSubtitle}>{t.subtitle}</p>
        </div>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          {t.back}
        </Link>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>

        {/* Left Card: Details */}
        <div className={styles.card}>
          {/* Avatar Header */}
          <div className={styles.avatarSection}>
            <InitialsAvatar name={user.name} size={80} fontSize={32} />
            <div>
              <h2 className={styles.userName}>{user.name}</h2>
              <span className={styles.userRole}>{t.role}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Fields Grid */}
          <div className={styles.fieldsGrid}>
            <Field
              icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>}
              label={t.fullName}
              value={user.name}
            />
            <Field
              icon={<Mail size={16} />}
              label="Email"
              value={user.email}
            />
            <Field
              icon={<Shield size={16} />}
              label={t.security}
              value="Standard Auth"
            />
            <Field
              icon={<Clock size={16} />}
              label={t.lastActivity}
              value={joinedDate}
            />
          </div>

          <div className={styles.divider} />

          {/* Logout */}
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>

        {/* Right Card: Stats */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>{t.statsTitle}</h3>
          <p className={styles.statsSubtitle}>{t.statsSubtitle}</p>

          {user.subscriptionPlan === 'FREE' && user.messagesRemaining <= 0 && (
            <div style={{ padding: '1rem', background: '#ffe4e6', color: '#e11d48', borderRadius: '12px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', lineHeight: '1.5' }}>
              {t.freeExhausted}
            </div>
          )}

          <div className={styles.statsBody}>
            <StatRow label={t.plan} value={user.subscriptionPlan || 'FREE'} highlight={false} />
            <StatRow label={t.balance} value={user.messagesRemaining} highlight />
            <StatRow label={t.sent} value={user.totalMessagesUsed} />
            <StatRow label={t.knowledgeBases} value={0} />
          </div>

          <div className={styles.divider} />

          {/* Purchase Bundles */}
          <div className={styles.bundlesStack}>
            <h3 className={styles.statsTitle} style={{ fontSize: '16px', marginBottom: '16px' }}>{t.expand}</h3>
            
            <div className={styles.bundle} onClick={() => handlePurchase('STARTER')}>
              <div>
                <div className={styles.bundleName}>Starter</div>
                <div className={styles.bundleInfo}>1,000 {t.messages}</div>
              </div>
              <div className={styles.bundlePrice}>{purchaseLoading === 'STARTER' ? <Loader2 className={styles.spin} /> : '6 990 ₸'}</div>
            </div>

            <div className={`${styles.bundle} ${styles.bundlePopular}`} onClick={() => handlePurchase('GROWTH')}>
              <div className={styles.popularLabel}>{t.popular}</div>
              <div>
                <div className={styles.bundleName}>Growth</div>
                <div className={styles.bundleInfo}>{t.growthBonus}</div>
              </div>
              <div className={styles.bundlePrice}>{purchaseLoading === 'GROWTH' ? <Loader2 className={styles.spin} /> : '15 990 ₸'}</div>
            </div>

            <div className={styles.bundle} onClick={() => handlePurchase('PRO')}>
              <div>
                <div className={styles.bundleName}>Pro Unlimited</div>
                <div className={styles.bundleInfo}>{t.proBonus}</div>
              </div>
              <div className={styles.bundlePrice}>{purchaseLoading === 'PRO' ? <Loader2 className={styles.spin} /> : '33 990 ₸'}</div>
            </div>
          </div>

          <div className={styles.divider} />

          <Link href="/statistics" className={styles.analyticsLink}>
            <TrendingUp size={16} />
            {t.analytics}
          </Link>
        </div>
      </div>
    </div>
  );
}
