'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import InitialsAvatar from '../components/InitialsAvatar/InitialsAvatar';
import styles from './page.module.css';
import { Mail, Shield, Clock, MessageCircle, TrendingUp, LogOut, ArrowLeft } from 'lucide-react';

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
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} />
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loadingWrap}>
        <p style={{ color: 'var(--on-surface-variant)' }}>Не авторизован.</p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Войти</Link>
      </div>
    );
  }

  const joinedDate = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Ваш профиль</h1>
          <p className={styles.pageSubtitle}>Управляйте своим аккаунтом и просматривайте статистику</p>
        </div>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          На главную
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
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Fields Grid */}
          <div className={styles.fieldsGrid}>
            <Field
              icon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>}
              label="Полное имя"
              value={user.name}
            />
            <Field
              icon={<Mail size={16} />}
              label="Email"
              value={user.email}
            />
            <Field
              icon={<Shield size={16} />}
              label="Безопасность"
              value="Standard Auth"
            />
            <Field
              icon={<Clock size={16} />}
              label="Последняя активность"
              value={joinedDate}
            />
          </div>

          <div className={styles.divider} />

          {/* Logout */}
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={16} />
            Выйти из аккаунта
          </button>
        </div>

        {/* Right Card: Stats */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Статистика аккаунта</h3>
          <p className={styles.statsSubtitle}>Текущее использование платформы</p>

          <div className={styles.statsBody}>
            <StatRow label="Баланс сообщений" value={user.messagesRemaining} highlight />
            <StatRow label="Всего отправлено" value={user.totalMessagesUsed} />
            <StatRow label="Баз знаний" value={0} />
          </div>

          <div className={styles.divider} />

          <div className={styles.billingNote}>
            <MessageCircle size={16} color="var(--primary)" />
            <span>
              <strong>$10 = 1 000 сообщений.</strong> 1 сообщение включает до 10 000 токенов.
            </span>
          </div>

          <Link href="/statistics" className={styles.analyticsLink}>
            <TrendingUp size={16} />
            Открыть статистику
          </Link>
        </div>
      </div>
    </div>
  );
}
