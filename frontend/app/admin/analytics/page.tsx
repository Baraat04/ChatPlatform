"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, MessageSquare, DollarSign, BrainCircuit, Users, ChevronDown, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';

const INPUT_COLOR = '#3b82f6';
const OUTPUT_COLOR = '#ec4899';

function formatCost(v: number) {
  if (v === 0) return '$0.0000000';
  if (v < 0.000001) return `$${v.toFixed(8)}`;
  if (v < 0.001) return `$${v.toFixed(7)}`;
  return `$${v.toFixed(5)}`;
}

export default function AnalyticsDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalSpendToday: 0, totalSpendMonth: 0, avgCostPerMessage: 0, totalMessages: 0, activeBots: 0 });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [dailyUsage, setDailyUsage] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [perUserStats, setPerUserStats] = useState<any[]>([]);
  const [avgStats, setAvgStats] = useState({ avgInputTokens: 0, avgOutputTokens: 0, avgTotalTokens: 0, totalRequests: 0 });
  const [pricing, setPricing] = useState({ inputPerMillion: 0.25, outputPerMillion: 1.50 });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('admin_authorized') === 'true';
      if (isAuth) {
        setAuthorized(true);
      }
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password === 'admin123' || password === 'homelander') {
      sessionStorage.setItem('admin_authorized', 'true');
      setAuthorized(true);
      setError('');
    } else {
      setError('Неверный пароль. Попробуйте еще раз.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:3001/api/statistics/admin-analytics', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setTopUsers(data.topUsers || []);
          if (data.dailyUsage) setDailyUsage(data.dailyUsage);
          if (data.recentRequests) setRecentRequests(data.recentRequests);
          if (data.perUserStats) setPerUserStats(data.perUserStats);
          if (data.avgStats) setAvgStats(data.avgStats);
          if (data.pricing) setPricing(data.pricing);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!authorized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #111827, #030712)',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <BrainCircuit size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Доступ ограничен
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px', lineHeight: 1.5 }}>
            Для просмотра административной панели AI Аналитики введите секретный пароль доступа.
          </p>

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Секретный пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0', textAlign: 'left', fontWeight: 500 }}>
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              Подтвердить пароль
            </button>
          </form>

          <div style={{ marginTop: '32px' }}>
            <Link href="/bots" style={{ color: '#9ca3af', fontSize: '13px', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--on-surface)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ opacity: 0.6 }}>Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  const totalInputCost = recentRequests.reduce((s, r) => s + r.inputCost, 0);
  const totalOutputCost = recentRequests.reduce((s, r) => s + r.outputCost, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--on-surface)', padding: '24px', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
              <Activity size={28} style={{ color: 'var(--primary)' }} />
              Vertex AI Analytics
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', marginTop: 4, fontSize: 14 }}>
              Детальный анализ потребления токенов · Цены: ${pricing.inputPerMillion}/1M input · ${pricing.outputPerMillion}/1M output
            </p>
          </div>
          <Link href="/bots" style={{ padding: '8px 16px', background: 'var(--surface-container)', borderRadius: 10, color: 'var(--on-surface)', textDecoration: 'none', border: '1px solid var(--outline-variant)', fontSize: 14 }}>
            ← Dashboard
          </Link>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Spend', value: `$${stats.totalSpendMonth.toFixed(5)}`, icon: <DollarSign size={22} />, color: '#3b82f6' },
            { label: 'Avg Cost / Msg', value: `$${stats.avgCostPerMessage.toFixed(6)}`, icon: <Zap size={22} />, color: '#8b5cf6' },
            { label: 'Total Messages', value: stats.totalMessages.toLocaleString(), icon: <MessageSquare size={22} />, color: '#f59e0b' },
            { label: 'Active Bots', value: stats.activeBots, icon: <BrainCircuit size={22} />, color: '#ec4899' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: '20px', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ padding: 10, borderRadius: 12, background: `${kpi.color}18`, color: kpi.color }}>{kpi.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Average Tokens per Request Widget */}
        <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: 24, border: '1px solid var(--outline-variant)', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: 'var(--primary)' }} />
              Среднее кол-во токенов на 1 запрос
            </h2>
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container)', padding: '4px 12px', borderRadius: 999 }}>
              всего запросов: <strong style={{ color: 'var(--on-surface)' }}>{avgStats.totalRequests}</strong>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* Input */}
            <div style={{ padding: '20px', background: `${INPUT_COLOR}12`, borderRadius: 14, border: `1px solid ${INPUT_COLOR}30`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: INPUT_COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>⬇ Input Tokens</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: INPUT_COLOR, lineHeight: 1 }}>{avgStats.avgInputTokens.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 6 }}>System + История + Data + Вопрос</div>
              <div style={{ marginTop: 14, display: 'inline-block', background: `${INPUT_COLOR}20`, padding: '4px 14px', borderRadius: 999, fontSize: 13, color: INPUT_COLOR, fontFamily: 'monospace', fontWeight: 700 }}>
                ≈ {formatCost((avgStats.avgInputTokens / 1_000_000) * pricing.inputPerMillion)} / запрос
              </div>
            </div>
            {/* Output */}
            <div style={{ padding: '20px', background: `${OUTPUT_COLOR}12`, borderRadius: 14, border: `1px solid ${OUTPUT_COLOR}30`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: OUTPUT_COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>⬆ Output Tokens</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: OUTPUT_COLOR, lineHeight: 1 }}>{avgStats.avgOutputTokens.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 6 }}>Ответ модели</div>
              <div style={{ marginTop: 14, display: 'inline-block', background: `${OUTPUT_COLOR}20`, padding: '4px 14px', borderRadius: 999, fontSize: 13, color: OUTPUT_COLOR, fontFamily: 'monospace', fontWeight: 700 }}>
                ≈ {formatCost((avgStats.avgOutputTokens / 1_000_000) * pricing.outputPerMillion)} / запрос
              </div>
            </div>
            {/* Total */}
            <div style={{ padding: '20px', background: 'var(--surface-container)', borderRadius: 14, border: '1px solid var(--outline-variant)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Σ Total Tokens</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--on-surface)', lineHeight: 1 }}>{avgStats.avgTotalTokens.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 6 }}>Input + Output</div>
              <div style={{ marginTop: 14, display: 'inline-block', background: 'var(--surface-container-high)', padding: '4px 14px', borderRadius: 999, fontSize: 13, color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                ≈ {formatCost(
                  (avgStats.avgInputTokens / 1_000_000) * pricing.inputPerMillion +
                  (avgStats.avgOutputTokens / 1_000_000) * pricing.outputPerMillion
                )} / запрос
              </div>
            </div>
          </div>
        </div>

        {/* Daily Chart + Pricing Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
          <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: 24, border: '1px solid var(--outline-variant)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Daily Token Volume (7 дней)</h2>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyUsage} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--on-surface-variant)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--on-surface-variant)', fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <RechartsTooltip
                    contentStyle={{ background: 'var(--surface-container-highest)', border: 'none', borderRadius: 10, color: 'var(--on-surface)' }}
                    formatter={(val: any) => [`${val.toLocaleString()} токенов`, 'Tokens']}
                  />
                  <Bar dataKey="tokens" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: 24, border: '1px solid var(--outline-variant)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Структура цен</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '14px 16px', background: `${INPUT_COLOR}12`, borderRadius: 12, border: `1px solid ${INPUT_COLOR}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: INPUT_COLOR, fontWeight: 700, fontSize: 14 }}>Input Tokens</div>
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>System + History + Data + Message</div>
                  </div>
                  <div style={{ fontWeight: 800, color: INPUT_COLOR }}>${pricing.inputPerMillion}/1M</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: `${OUTPUT_COLOR}12`, borderRadius: 12, border: `1px solid ${OUTPUT_COLOR}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: OUTPUT_COLOR, fontWeight: 700, fontSize: 14 }}>Output Tokens</div>
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Ответ модели</div>
                  </div>
                  <div style={{ fontWeight: 800, color: OUTPUT_COLOR }}>${pricing.outputPerMillion}/1M</div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--surface-container)', borderRadius: 12, fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--on-surface)' }}>Разбивка Input:</strong><br />
                ~50% история · ~20% system prompt<br />
                ~15% RAG данные · ~15% вопрос юзера
              </div>
            </div>
          </div>
        </div>

        {/* Per-User Aggregated Stats */}
        <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, border: '1px solid var(--outline-variant)', marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Стоимость по пользователям
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>Пользователь</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Запросов</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Ср. Input tkn</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Ср. Output tkn</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: INPUT_COLOR }}>Input Cost</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: OUTPUT_COLOR }}>Output Cost</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600 }}>ИТОГО</th>
                </tr>
              </thead>
              <tbody>
                {perUserStats.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700 }}>{u.userName}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--on-surface-variant)' }}>{u.requests}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ color: INPUT_COLOR, fontWeight: 600 }}>{u.avgInputTokens.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ color: OUTPUT_COLOR, fontWeight: 600 }}>{u.avgOutputTokens.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: INPUT_COLOR, fontFamily: 'monospace', fontSize: 12 }}>{formatCost(u.totalInputCost)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: OUTPUT_COLOR, fontFamily: 'monospace', fontSize: 12 }}>{formatCost(u.totalOutputCost)}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 13 }}>{formatCost(u.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Request Log */}
        <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Zap size={18} style={{ color: 'var(--primary)' }} />
              Детальный лог запросов (последние 50)
            </h2>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span style={{ color: INPUT_COLOR }}>Input: <strong>{formatCost(totalInputCost)}</strong></span>
              <span style={{ color: OUTPUT_COLOR }}>Output: <strong>{formatCost(totalOutputCost)}</strong></span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Время</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Пользователь</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: INPUT_COLOR }}>Input tkn</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: OUTPUT_COLOR }}>Output tkn</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Total tkn</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: INPUT_COLOR }}>Input $</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: OUTPUT_COLOR }}>Output $</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>Total $</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Разбивка</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req) => (
                  <React.Fragment key={req.id}>
                    <tr
                      style={{ borderBottom: '1px solid var(--outline-variant)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setExpandedRow(expandedRow === req.id ? null : req.id)}
                    >
                      <td style={{ padding: '10px 16px', color: 'var(--on-surface-variant)', fontSize: 12 }}>
                        {new Date(req.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{req.userName}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: INPUT_COLOR, fontWeight: 700 }}>{req.inputTokens.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: OUTPUT_COLOR, fontWeight: 700 }}>{req.outputTokens.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--on-surface-variant)' }}>{req.totalTokens.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: INPUT_COLOR, fontFamily: 'monospace', fontSize: 12 }}>{formatCost(req.inputCost)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: OUTPUT_COLOR, fontFamily: 'monospace', fontSize: 12 }}>{formatCost(req.outputCost)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 13 }}>{formatCost(req.totalCost)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                        {expandedRow === req.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {expandedRow === req.id && (
                      <tr style={{ background: 'var(--surface-container-lowest)' }}>
                        <td colSpan={9} style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 8 }}>
                                Разбивка Input ({req.inputTokens} токенов) — оценочная
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                  { label: '📜 История диалога (~50%)', val: req.estimatedBreakdown.history },
                                  { label: '⚙️ System Prompt (~20%)', val: req.estimatedBreakdown.systemPrompt },
                                  { label: '📚 Data / RAG контекст (~15%)', val: req.estimatedBreakdown.ragData },
                                  { label: '💬 Вопрос пользователя (~15%)', val: req.estimatedBreakdown.userMsg },
                                ].map((item, j) => (
                                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 160, fontSize: 12, color: 'var(--on-surface-variant)' }}>{item.label}</div>
                                    <div style={{ flex: 1, maxWidth: 200, height: 6, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${(item.val / req.inputTokens) * 100}%`, background: INPUT_COLOR, borderRadius: 999 }} />
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: INPUT_COLOR, fontFamily: 'monospace', minWidth: 50 }}>{item.val} tkn</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 8 }}>Output</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>🤖 Ответ модели</div>
                                <div style={{ fontWeight: 800, color: OUTPUT_COLOR, fontFamily: 'monospace' }}>{req.outputTokens} tkn</div>
                              </div>
                              <div style={{ marginTop: 8, padding: '10px 14px', background: `${OUTPUT_COLOR}12`, borderRadius: 10, fontSize: 12 }}>
                                <div>Cost: <strong style={{ color: OUTPUT_COLOR }}>{formatCost(req.outputCost)}</strong></div>
                                <div style={{ marginTop: 4, color: 'var(--on-surface-variant)' }}>@ ${pricing.outputPerMillion}/1M tkn</div>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 8 }}>Модель</div>
                              <code style={{ fontSize: 12, background: 'var(--surface-container)', padding: '4px 10px', borderRadius: 6, color: 'var(--primary)' }}>{req.model}</code>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
