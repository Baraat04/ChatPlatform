'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './page.module.css';
import { 
  Zap, 
  MessageSquare, 
  Activity, 
  Wallet, 
  TrendingUp, 
  Check, 
  Loader2,
  ShieldAlert
} from 'lucide-react';

import { API_URL } from '../config';
import { useLanguage } from '../contexts/LanguageContext';

const API = `${API_URL}/statistics`;

const statsDict = {
  RU: {
    title: 'Статистика',
    totalUsed: 'Всего использовано',
    avgTokens: 'Ср. токенов / сообщ.',
    usedToday: 'Использовано сегодня',
    remaining: 'Осталось сообщений',
    msg: 'сообщ.',
    balance: 'Баланс сообщений',
    spent: 'Потрачено',
    messages: 'сообщений',
    perReq: 'На каждый запрос',
    oneMsg: '1 сообщение',
    chartTitle: 'Кумулятивный рост использования (7д)',
    expand: 'Увеличить лимит',
    popular: 'ПОПУЛЯРНО',
    growthBonus: 'Growth (Бонус 20%)',
    proBonus: 'Pro Unlimited (Бонус 50%)',
    efficiency: 'Внутренняя эффективность',
    ledgerTitle: 'Журнал эффективности ботов',
    botIdSlug: 'ID БОТА / СЛАГ',
    platform: 'ПЛАТФОРМА',
    throughput: 'ПРОПУСКНАЯ СПОСОБНОСТЬ',
    messagesCol: 'СООБЩЕНИЯ',
    efficiencyCol: 'ЭФФЕКТИВНОСТЬ',
    txLogTitle: 'Глобальный журнал транзакций',
    timestamp: 'ВРЕМЯ',
    type: 'ТИП',
    delta: 'ИЗМЕНЕНИЕ',
    description: 'ОПИСАНИЕ',
    loadingText: 'Анализ нейронной сети...',
    purchaseSuccess: 'Успешно добавлено {amount} сообщений!',
    purchaseError: 'Ошибка покупки',
    networkError: 'Ошибка сети',
  },
  KZ: {
    title: 'Статистика',
    totalUsed: 'Барлығы пайдаланылды',
    avgTokens: 'Орташа токен / хабарлама',
    usedToday: 'Бүгін пайдаланылды',
    remaining: 'Қалған хабарламалар',
    msg: 'хаб.',
    balance: 'Хабарламалар теңгерімі',
    spent: 'Жұмсалды',
    messages: 'хабарлама',
    perReq: 'Әрбір сұранысқа',
    oneMsg: '1 хабарлама',
    chartTitle: 'Жиынтық пайдалану өсімі (7 күн)',
    expand: 'Сыйымдылықты арттыру',
    popular: 'ТАҢДАУЛЫ',
    growthBonus: 'Growth (20% бонус)',
    proBonus: 'Pro Unlimited (50% бонус)',
    efficiency: 'Ішкі тиімділік',
    ledgerTitle: 'Боттардың тиімділік журналы',
    botIdSlug: 'БОТ ID / СЛАГ',
    platform: 'ПЛАТФОРМА',
    throughput: 'ӨТКІЗГІШТІК ҚАБІЛЕТІ',
    messagesCol: 'ХАБАРЛАМАЛАР',
    efficiencyCol: 'ТИІМДІЛІК',
    txLogTitle: 'Жалпы транзакциялар журналы',
    timestamp: 'УАҚЫТЫ',
    type: 'ТҮРІ',
    delta: 'ӨЗГЕРІС',
    description: 'СИПАТТАМАСЫ',
    loadingText: 'Нейрондық желіні талдау...',
    purchaseSuccess: 'Сәтті түрде {amount} хабарлама қосылды!',
    purchaseError: 'Сатып алу қатесі',
    networkError: 'Желі қатесі',
  },
  EN: {
    title: 'Statistics',
    totalUsed: 'Total Used',
    avgTokens: 'Avg. Tokens / Msg',
    usedToday: 'Used Today',
    remaining: 'Messages Remaining',
    msg: 'msg',
    balance: 'Messages Balance',
    spent: 'Spent',
    messages: 'messages',
    perReq: 'On each request',
    oneMsg: '1 message',
    chartTitle: 'Cumulative Usage Growth (7d)',
    expand: 'Expand Capacity',
    popular: 'POPULAR',
    growthBonus: 'Growth (20% bonus)',
    proBonus: 'Pro Unlimited (50% bonus)',
    efficiency: 'Internal efficiency',
    ledgerTitle: 'Bot Performance Ledger',
    botIdSlug: 'BOT ID / SLUG',
    platform: 'PLATFORM',
    throughput: 'THROUGHPUT',
    messagesCol: 'MESSAGES',
    efficiencyCol: 'EFFICIENCY',
    txLogTitle: 'Global Transaction Log',
    timestamp: 'TIMESTAMP',
    type: 'TYPE',
    delta: 'DELTA',
    description: 'DESCRIPTION',
    loadingText: 'Analyzing neural network...',
    purchaseSuccess: 'Successfully added {amount} messages!',
    purchaseError: 'Purchase error',
    networkError: 'Network error',
  }
};

type Overview = {
  messagesRemaining: number;
  totalMessagesUsed: number;
  totalTokens: number;
  avgTokensPerMessage: number;
  totalRequests: number;
  todayUsage: number;
};

type BotStat = {
  botId: number;
  slug: string;
  platform: string;
  messagesUsed: number;
  requests: number;
  efficiency: number;
  throughput: number;
};

type HistoryPoint = { date: string; value: number };

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  model?: string;
  totalTokens?: number;
};

export default function StatisticsPage() {
  const { language } = useLanguage();
  const t = statsDict[language] || statsDict.RU;

  const { user, refreshProfile } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bots, setBots] = useState<BotStat[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; cumulative: number; date: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [o, b, h, t] = await Promise.all([
          fetch(`${API}/overview`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${API}/per-bot`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${API}/usage-history?range=7`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${API}/transactions`, { credentials: 'include' }).then(r => r.json()),
        ]);
        setOverview(o);
        setBots(b);
        setHistory(h);
        setTransactions(t.transactions);
      } catch (e) {
        console.error('Stats load error', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);


  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>{t.loadingText}</p>
      </div>
    );
  }

  // SVG Chart Logic
  const chartWidth = 1000;
  const chartHeight = 500;
  const padding = 60;
  const maxVal = Math.max(...history.map(p => p.value), 10);
  
  // Calculate cumulative points to show "growth"
  let cumulative = 0;
  const growthPoints = history.map((p, i) => {
    cumulative += p.value;
    const x = (i / (history.length - 1)) * (chartWidth - padding * 2) + padding;
    const y = chartHeight - ((cumulative / Math.max(cumulative, 10)) * (chartHeight - padding * 2) + padding);
    return { x, y, daily: p.value, cumulative, date: p.date };
  });

  const maxCumulative = Math.max(...growthPoints.map(p => p.cumulative), 10);
  
  const points = growthPoints.map(p => ({
    ...p,
    y: chartHeight - ((p.cumulative / maxCumulative) * (chartHeight - padding * 2) + padding)
  }));

  // Cubic Bezier path
  const getPath = () => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const areaPath = `${getPath()} L ${points[points.length-1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.title}</h1>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><MessageSquare size={14} /> {t.totalUsed}</div>
          <div className={styles.metricValue}>{(overview?.totalMessagesUsed ?? 0).toLocaleString()} {t.msg}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><Zap size={14} /> {t.avgTokens}</div>
          <div className={styles.metricValue}>{(overview?.avgTokensPerMessage ?? 0).toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><TrendingUp size={14} /> {t.usedToday}</div>
          <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{(overview?.todayUsage ?? 0).toLocaleString()} {t.msg}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><Wallet size={14} /> {t.remaining}</div>
          <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{(overview?.messagesRemaining ?? 0).toLocaleString()} {t.msg}</div>
        </div>
      </div>

      {/* Messages Balance Progress Bar */}
      {overview && (
        <div className={styles.metricCard} style={{ marginBottom: '16px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className={styles.metricLabel} style={{ fontSize: '14px' }}>
              <Wallet size={14} /> {t.balance}
            </div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>
              {overview.messagesRemaining.toLocaleString()} / {(overview.messagesRemaining + overview.totalMessagesUsed).toLocaleString()}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'var(--surface-container-high)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, var(--primary), var(--primary-fixed-dim))',
              width: `${Math.max(2, (overview.messagesRemaining / Math.max(1, overview.messagesRemaining + overview.totalMessagesUsed)) * 100)}%`,
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <span>{t.spent}: <strong style={{ color: 'var(--on-surface)' }}>{overview.totalMessagesUsed}</strong> {t.messages}</span>
            <span>{t.perReq}: <strong style={{ color: 'var(--primary)' }}>{t.oneMsg}</strong></span>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* SVG Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>{t.chartTitle}</h3>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.chartSvg}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(f => (
              <line key={f} x1={padding} y1={chartHeight - (f * (chartHeight-padding*2) + padding)} x2={chartWidth-padding} y2={chartHeight - (f * (chartHeight-padding*2) + padding)} stroke="var(--outline-variant)" strokeWidth="1" strokeDasharray="5,5" />
            ))}

            <path d={areaPath} fill="url(#chartGradient)" />
            <path d={getPath()} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" className={styles.chartPath} />
            {/* X-Axis labels */}
            {points.map((p, i) => (
              <text
                key={`label-${i}`}
                x={p.x}
                y={chartHeight - 20}
                fill="var(--on-surface)"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.9"
              >
                {new Date(p.date).toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'KZ' ? 'kk-KZ' : 'en-US', { day: 'numeric', month: 'short' })}
              </text>
            ))}

            {/* Circles */}
            {points.map((p, i) => (
              <circle 
                key={i} 
                cx={p.x} 
                cy={p.y} 
                r={tooltip?.date === p.date ? "7" : "5"} 
                fill={tooltip?.date === p.date ? "var(--primary)" : "var(--surface-container-lowest)"} 
                stroke="var(--primary)" 
                strokeWidth="2" 
                className={styles.point}
                style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
              />
            ))}

            {/* Hover columns */}
            {points.map((p, i) => {
              const width = (chartWidth - padding * 2) / Math.max(1, points.length - 1);
              return (
                <rect
                  key={`hover-${i}`}
                  x={p.x - width / 2}
                  y={0}
                  width={width}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setTooltip({ x: p.x, y: p.y, val: p.daily, cumulative: p.cumulative, date: p.date })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'crosshair' }}
                />
              );
            })}

            {tooltip && (
              <foreignObject x={Math.max(10, Math.min(chartWidth - 200, tooltip.x - 100))} y={Math.max(10, tooltip.y - 120)} width="200" height="110" style={{ pointerEvents: 'none' }}>
                <div className={styles.tooltip}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                    {new Date(tooltip.date).toLocaleDateString(language === 'RU' ? 'ru-RU' : language === 'KZ' ? 'kk-KZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                    <span style={{ opacity: 0.7 }}>{language === 'RU' ? 'За день:' : language === 'KZ' ? 'Күніне:' : 'Daily:'}</span>
                    <span style={{ fontWeight: 600 }}>{tooltip.val} {t.msg}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                    <span style={{ opacity: 0.7 }}>{language === 'RU' ? 'Всего:' : language === 'KZ' ? 'Барлығы:' : 'Total:'}</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{tooltip.cumulative} {t.msg}</span>
                  </div>
                </div>
              </foreignObject>
            )}
          </svg>
          
          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-container-low)', borderRadius: '16px', fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
            <Activity size={16} style={{ marginRight: 10, color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600 }}>{t.efficiency}:</span>
            <span style={{ marginLeft: 8, fontWeight: 800, color: 'var(--on-surface)' }}>{((overview?.totalMessagesUsed ?? 0) / (overview?.totalRequests ?? 1)).toFixed(2)} {t.msg}/req</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className={styles.tableSection}>
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>{t.ledgerTitle}</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t.botIdSlug}</th>
                  <th>{t.platform}</th>
                  <th>{t.throughput}</th>
                  <th>{t.messagesCol}</th>
                  <th>{t.efficiencyCol}</th>
                </tr>
              </thead>
              <tbody>
                {bots.map(b => (
                  <tr key={b.botId}>
                    <td style={{ fontWeight: 700 }}>{b.slug}</td>
                    <td>
                      <span className={`${styles.platformBadge} ${b.platform === 'WHATSAPP' ? styles.whatsappBadge : styles.telegramBadge}`}>
                        {b.platform}
                      </span>
                    </td>
                    <td>{b.throughput.toLocaleString()} tkn</td>
                    <td>{b.messagesUsed}</td>
                    <td>{b.efficiency}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>{t.txLogTitle}</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t.timestamp}</th>
                  <th>{t.type}</th>
                  <th>{t.delta}</th>
                  <th>{t.description}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tTx => (
                  <tr key={tTx.id}>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>{new Date(tTx.createdAt).toLocaleString(language === 'RU' ? 'ru-RU' : language === 'KZ' ? 'kk-KZ' : 'en-US')}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: tTx.type === 'usage' ? '#ef4444' : '#22c55e', fontSize: '11px', textTransform: 'uppercase' }}>
                        {tTx.type === 'usage' ? (language === 'RU' ? 'расход' : language === 'KZ' ? 'шығын' : 'usage') : (language === 'RU' ? 'покупка' : language === 'KZ' ? 'сатып алу' : 'purchase')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{tTx.amount > 0 ? `+${tTx.amount}` : tTx.amount}</td>
                    <td>{tTx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
