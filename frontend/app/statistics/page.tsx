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

const API = 'http://localhost:3001/api/statistics';

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
  const { user, refreshProfile } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bots, setBots] = useState<BotStat[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
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

  const showBanner = (type: 'success' | 'error', msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 4000);
  };

  const handlePurchase = async (plan: string) => {
    setPurchaseLoading(plan);
    try {
      const res = await fetch(`${API}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showBanner('success', `Успешно добавлено ${data.added} сообщений!`);
        await refreshProfile();
        // Refresh overview
        const o = await fetch(`${API}/overview`, { credentials: 'include' }).then(r => r.json());
        setOverview(o);
      } else {
        showBanner('error', data.error || 'Ошибка покупки');
      }
    } catch (e) {
      showBanner('error', 'Ошибка сети');
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Анализ нейронной сети...</p>
      </div>
    );
  }

  // SVG Chart Logic
  const chartWidth = 1000;
  const chartHeight = 400;
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
      {banner && <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>{banner.msg}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Intelligence Analytics</h1>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><MessageSquare size={14} /> Total Used</div>
          <div className={styles.metricValue}>{(overview?.totalMessagesUsed ?? 0).toLocaleString()} msg</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><Zap size={14} /> Avg. Tokens / Msg</div>
          <div className={styles.metricValue}>{(overview?.avgTokensPerMessage ?? 0).toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><TrendingUp size={14} /> Used Today</div>
          <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{(overview?.todayUsage ?? 0).toLocaleString()} msg</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}><Wallet size={14} /> Messages Remaining</div>
          <div className={styles.metricValue} style={{ color: 'var(--primary)' }}>{(overview?.messagesRemaining ?? 0).toLocaleString()} msg</div>
        </div>
      </div>

      {/* Messages Balance Progress Bar */}
      {overview && (
        <div className={styles.metricCard} style={{ marginBottom: '16px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className={styles.metricLabel} style={{ fontSize: '14px' }}>
              <Wallet size={14} /> Баланс сообщений
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
            <span>Потрачено: <strong style={{ color: 'var(--on-surface)' }}>{overview.totalMessagesUsed}</strong> сообщений</span>
            <span>На каждый запрос: <strong style={{ color: 'var(--primary)' }}>1 сообщение</strong></span>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* SVG Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Cumulative Usage Growth (7d)</h3>
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
                {new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
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
              <foreignObject x={Math.max(10, Math.min(chartWidth - 150, tooltip.x - 70))} y={Math.max(10, tooltip.y - 95)} width="150" height="85" style={{ pointerEvents: 'none' }}>
                <div className={styles.tooltip}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {new Date(tooltip.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Рост за день: {tooltip.val} msg</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>Всего: {tooltip.cumulative} msg</div>
                </div>
              </foreignObject>
            )}
          </svg>
        </div>

        {/* Purchase Bundles */}
        <div className={styles.bundlesStack}>
          <h3 className={styles.cardTitle}>Expand Capacity</h3>
          
          <div className={styles.bundle} onClick={() => handlePurchase('starter')}>
            <div>
              <div className={styles.bundleName}>Starter</div>
              <div className={styles.bundleInfo}>1,000 Messages</div>
            </div>
            <div className={styles.bundlePrice}>{purchaseLoading === 'starter' ? <Loader2 className={styles.spin} /> : '$10'}</div>
          </div>

          <div className={`${styles.bundle} ${styles.bundlePopular}`} onClick={() => handlePurchase('growth')}>
            <div className={styles.popularLabel}>POPULAR</div>
            <div>
              <div className={styles.bundleName}>Growth</div>
              <div className={styles.bundleInfo}>6,000 Messages (20% bonus)</div>
            </div>
            <div className={styles.bundlePrice}>{purchaseLoading === 'growth' ? <Loader2 className={styles.spin} /> : '$50'}</div>
          </div>

          <div className={styles.bundle} onClick={() => handlePurchase('pro')}>
            <div>
              <div className={styles.bundleName}>Pro Unlimited</div>
              <div className={styles.bundleInfo}>30,000 Messages (50% bonus)</div>
            </div>
            <div className={styles.bundlePrice}>{purchaseLoading === 'pro' ? <Loader2 className={styles.spin} /> : '$200'}</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--surface-container-low)', borderRadius: '16px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <Activity size={14} style={{ marginRight: 8 }} />
            Internal efficiency: {((overview?.totalMessagesUsed ?? 0) / (overview?.totalRequests ?? 1)).toFixed(2)} messages/req
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className={styles.tableSection}>
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>Bot Performance Ledger</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>BOT ID / SLUG</th>
                  <th>PLATFORM</th>
                  <th>THROUGHPUT</th>
                  <th>MESSAGES</th>
                  <th>EFFICIENCY</th>
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
          <h3 className={styles.cardTitle}>Global Transaction Log</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>TYPE</th>
                  <th>DELTA</th>
                  <th>DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>{new Date(t.createdAt).toLocaleString('ru-RU')}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: t.type === 'usage' ? '#ef4444' : '#22c55e', fontSize: '11px', textTransform: 'uppercase' }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{t.amount > 0 ? `+${t.amount}` : t.amount}</td>
                    <td>{t.description}</td>
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
