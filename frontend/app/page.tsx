'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';
import {
  Bot, MessageSquare, Zap, TrendingUp, Wallet, ArrowRight
} from 'lucide-react';

const API = 'http://localhost:3001/api';

type Overview = {
  messagesRemaining: number;
  totalMessagesUsed: number;
  totalTokens: number;
  avgTokensPerMessage: number;
  totalRequests: number;
  todayUsage: number;
};

type BotInfo = {
  id: number;
  slug: string;
  platform: string;
  isActive: boolean;
  name?: string;
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [o, b] = await Promise.all([
          fetch(`${API}/statistics/overview`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
          fetch(`${API}/bots`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
        ]);
        if (o) setOverview(o);
        if (Array.isArray(b)) setBots(b);
        else if (b?.bots) setBots(b.bots);
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading || (!user && !loading)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const activeBots = bots.filter(b => b.isActive);
  const totalBots = bots.length;
  const used = overview?.totalMessagesUsed ?? 0;
  const remaining = overview?.messagesRemaining ?? 0;
  const total = used + remaining;
  const usedPct = total > 0 ? (used / total) * 100 : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--on-surface)', padding: '32px 28px', fontFamily: 'var(--font-plus-jakarta, Inter, sans-serif)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header greeting */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
            {user?.name || 'Пользователь'}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 6, fontSize: 14 }}>
            Вот сводка работы твоих AI-агентов на сегодня
          </p>
        </div>

        {/* Top KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            {
              icon: <Bot size={20} />, color: '#3b82f6',
              label: 'Активных ботов',
              value: dataLoading ? '—' : `${activeBots.length} / ${totalBots}`,
              sub: totalBots === 0 ? 'Нет ботов' : `${totalBots - activeBots.length} оффлайн`
            },
            {
              icon: <MessageSquare size={20} />, color: '#10b981',
              label: 'Сообщений сегодня',
              value: dataLoading ? '—' : (overview?.todayUsage ?? 0).toString(),
              sub: 'использовано за день'
            },
            {
              icon: <Zap size={20} />, color: '#8b5cf6',
              label: 'Среднее токенов',
              value: dataLoading ? '—' : (overview?.avgTokensPerMessage ?? 0).toLocaleString(),
              sub: 'на сообщение'
            },
            {
              icon: <TrendingUp size={20} />, color: '#f59e0b',
              label: 'Запросов всего',
              value: dataLoading ? '—' : (overview?.totalRequests ?? 0).toLocaleString(),
              sub: 'за всё время'
            },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: '20px', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ padding: 10, borderRadius: 12, background: `${kpi.color}18`, color: kpi.color, flexShrink: 0 }}>{kpi.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>{kpi.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Large Messages Balance Hero Card */}
        <div style={{ background: 'var(--surface-container-low)', borderRadius: 20, padding: '32px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Wallet size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Баланс сообщений аккаунта</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 56, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              {remaining.toLocaleString()}
            </span>
            <span style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>доступно из {total.toLocaleString()} сообщений</span>
          </div>

          {/* Large Progress bar */}
          <div style={{ background: 'var(--surface-container-high)', borderRadius: 999, height: 12, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: usedPct > 80 ? '#ef4444' : usedPct > 50 ? '#f59e0b' : 'var(--primary)',
              width: `${Math.max(2, 100 - usedPct)}%`,
              transition: 'width 0.6s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 24 }}>
            <span>Использовано: <strong style={{ color: 'var(--on-surface)' }}>{used.toLocaleString()} msg</strong> ({usedPct.toFixed(1)}%)</span>
            <span>Осталось: <strong style={{ color: 'var(--primary)' }}>{remaining.toLocaleString()} msg</strong> ({(100 - usedPct).toFixed(1)}%)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, borderTop: '1px solid var(--outline-variant)', paddingTop: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--on-surface)' }}>Тарификация сообщений:</strong><br />
              Каждый входящий запрос пользователя, обработанный искусственным интеллектом, списывает ровно 1 сообщение с вашего баланса.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Link href="/statistics" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Подробная статистика сообщений <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
