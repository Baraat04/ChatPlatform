'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';
import {
  Bot, MessageSquare, Zap, TrendingUp, Wallet, ArrowRight
} from 'lucide-react';

import { API_URL } from './config';

const API = API_URL;

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

import { useLanguage } from './contexts/LanguageContext';

const localT = {
  EN: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    userFallback: 'User',
    summary: 'Here is the summary of your AI agents today',
    activeBotsLabel: 'Active Bots',
    noBots: 'No bots',
    offline: 'offline',
    msgsTodayLabel: 'Messages Today',
    usedToday: 'used today',
    avgTokensLabel: 'Avg Tokens',
    perMsg: 'per message',
    totalRequestsLabel: 'Total Requests',
    allTime: 'all time',
    balanceTitle: 'Account Message Balance',
    availableFrom: 'available from',
    messages: 'messages',
    usedWord: 'Used',
    remainingWord: 'Remaining',
    msgAbbr: 'msg',
    pricingRules: 'Message Pricing:',
    pricingDesc: 'Each incoming user request processed by AI deducts exactly 1 message from your balance.',
    detailedStats: 'Detailed Message Statistics'
  },
  RU: {
    morning: 'Доброе утро',
    afternoon: 'Добрый день',
    evening: 'Добрый вечер',
    userFallback: 'Пользователь',
    summary: 'Вот сводка работы ваших AI-агентов на сегодня',
    activeBotsLabel: 'Активных ботов',
    noBots: 'Нет ботов',
    offline: 'оффлайн',
    msgsTodayLabel: 'Сообщений сегодня',
    usedToday: 'использовано за день',
    avgTokensLabel: 'Среднее токенов',
    perMsg: 'на сообщение',
    totalRequestsLabel: 'Запросов всего',
    allTime: 'за всё время',
    balanceTitle: 'Баланс сообщений аккаунта',
    availableFrom: 'доступно из',
    messages: 'сообщений',
    usedWord: 'Использовано',
    remainingWord: 'Осталось',
    msgAbbr: 'сообщ.',
    pricingRules: 'Тарификация сообщений:',
    pricingDesc: 'Каждый входящий запрос пользователя, обработанный искусственным интеллектом, списывает ровно 1 сообщение с вашего баланса.',
    detailedStats: 'Подробная статистика сообщений'
  },
  KZ: {
    morning: 'Қайырлы таң',
    afternoon: 'Қайырлы күн',
    evening: 'Қайырлы кеш',
    userFallback: 'Пайдаланушы',
    summary: 'Міне, бүгінгі AI агенттеріңіздің жұмыс қорытындысы',
    activeBotsLabel: 'Белсенді боттар',
    noBots: 'Боттар жоқ',
    offline: 'оффлайн',
    msgsTodayLabel: 'Бүгінгі хабарламалар',
    usedToday: 'бүгін пайдаланылды',
    avgTokensLabel: 'Орташа токендер',
    perMsg: 'хабарлама үшін',
    totalRequestsLabel: 'Барлық сұраныстар',
    allTime: 'барлық уақытта',
    balanceTitle: 'Аккаунттың хабарлама балансы',
    availableFrom: 'қолжетімді, барлығы',
    messages: 'хабарламадан',
    usedWord: 'Пайдаланылды',
    remainingWord: 'Қалды',
    msgAbbr: 'хаб.',
    pricingRules: 'Хабарламалар тарифі:',
    pricingDesc: 'Жасанды интеллект өңдеген әрбір кіріс пайдаланушы сұранысы сіздің балансыңыздан дәл 1 хабарламаны алады.',
    detailedStats: 'Толық хабарлама статистикасы'
  }
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const tLocal = localT[language as keyof typeof localT] || localT.EN;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/landing');
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
  const greeting = hour < 12 ? tLocal.morning : hour < 18 ? tLocal.afternoon : tLocal.evening;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--on-surface)', padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 28px)', fontFamily: 'var(--font-plus-jakarta, Inter, sans-serif)', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>

        {/* Header greeting */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
            {user?.name || tLocal.userFallback}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 6, fontSize: 14 }}>
            {tLocal.summary}
          </p>
        </div>

        {/* Top KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            {
              icon: <Bot size={20} />, color: '#3b82f6',
              label: tLocal.activeBotsLabel,
              value: dataLoading ? '—' : `${activeBots.length} / ${totalBots}`,
              sub: totalBots === 0 ? tLocal.noBots : `${totalBots - activeBots.length} ${tLocal.offline}`
            },
            {
              icon: <MessageSquare size={20} />, color: '#10b981',
              label: tLocal.msgsTodayLabel,
              value: dataLoading ? '—' : (overview?.todayUsage ?? 0).toString(),
              sub: tLocal.usedToday
            },
            {
              icon: <Zap size={20} />, color: '#8b5cf6',
              label: tLocal.avgTokensLabel,
              value: dataLoading ? '—' : (overview?.avgTokensPerMessage ?? 0).toLocaleString(),
              sub: tLocal.perMsg
            },
            {
              icon: <TrendingUp size={20} />, color: '#f59e0b',
              label: tLocal.totalRequestsLabel,
              value: dataLoading ? '—' : (overview?.totalRequests ?? 0).toLocaleString(),
              sub: tLocal.allTime
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
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{tLocal.balanceTitle}</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              {remaining.toLocaleString()}
            </span>
            <span style={{ fontSize: 'clamp(13px, 3vw, 18px)', color: 'var(--on-surface-variant)' }}>{tLocal.availableFrom} {total.toLocaleString()} {tLocal.messages}</span>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 24, flexWrap: 'wrap', gap: 4 }}>
            <span>{tLocal.usedWord}: <strong style={{ color: 'var(--on-surface)' }}>{used.toLocaleString()} {tLocal.msgAbbr}</strong> ({usedPct.toFixed(1)}%)</span>
            <span>{tLocal.remainingWord}: <strong style={{ color: 'var(--primary)' }}>{remaining.toLocaleString()} {tLocal.msgAbbr}</strong> ({(100 - usedPct).toFixed(1)}%)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, borderTop: '1px solid var(--outline-variant)', paddingTop: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--on-surface)' }}>{tLocal.pricingRules}</strong><br />
              {tLocal.pricingDesc}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Link href="/statistics" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {tLocal.detailedStats} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
