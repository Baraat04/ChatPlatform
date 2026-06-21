'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart2, Zap, TrendingDown, Target, BrainCircuit, RefreshCcw, Star, AlertCircle, PhoneOff } from 'lucide-react';
import Link from 'next/link';
import { API_URL as API } from '../../../config';

export default function AnalyticsPage() {
  const { id: botId } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [selectiveChatId, setSelectiveChatId] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API}/analytics/${botId}`, { credentials: 'include' });
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else if (res.status === 403 && result.requiresUpgrade) {
        setRequiresUpgrade(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [botId]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await fetch(`${API}/analytics/trigger-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specificChatId: selectiveChatId || undefined, limit: 20 }),
        credentials: 'include'
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setSelectiveChatId('');
        fetchAnalytics(); // reload data
      } else {
         alert(result.error || 'Ошибка');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при запуске анализа');
    }
    setTriggering(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}><RefreshCcw className="spinning" size={32} color="var(--primary)" /></div>;
  }

  // Calculate funnel max
  const funnelStages = ['Лид', 'Квалификация', 'Презентация', 'Отработка возражений', 'Ожидание оплаты', 'Успешно', 'Отказ', 'Молчит'];
  const funnelCounts = data?.funnelCounts || {};
  const maxCount = Math.max(...Object.values(funnelCounts) as number[], 1);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--on-background)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/bots/${botId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Назад к боту
          </Link>
          <div style={{ width: '1px', height: '24px', background: 'var(--outline-variant)' }} />
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit color="var(--primary)" size={24} /> AI РОП (Аналитика)
          </h1>
          <span style={{ background: 'linear-gradient(135deg, #FFD700 0%, #F5A623 100%)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '0.5rem' }}>PRO</span>
        </div>
        {!requiresUpgrade && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Анализ одного чата (Phone/ID)" 
              value={selectiveChatId}
              onChange={e => setSelectiveChatId(e.target.value)}
              style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--outline-variant)', background: 'var(--background)', width: '250px' }}
            />
            <button 
              onClick={handleTrigger} 
              disabled={triggering}
              style={{ 
                background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
              }}
            >
              {triggering ? <RefreshCcw size={16} className="spinning" /> : <Zap size={16} />} 
              {selectiveChatId ? 'Анализ чата' : 'Анализ (Последние 20)'}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        {requiresUpgrade ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(245, 166, 35, 0.1)', borderRadius: '50%' }}>
                <Star size={48} color="#F5A623" />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Виртуальный РОП доступен в PRO</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
              Получите доступ к ИИ-Аналитике, интерактивной воронке продаж, анализу причин отказа клиентов и автоматическим рекомендациям.
            </p>
            <Link href="/billing" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FFD700 0%, #F5A623 100%)', color: '#fff', padding: '1rem 3rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '1.1rem' }}>
              Улучшить тариф
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Виртуальный Руководитель Отдела Продаж. ИИ автоматически анализирует каждый диалог, выявляет этапы воронки и причины отказов.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--outline-variant)' }}>
            <div 
              title="Общее количество чатов, которые были проанализированы ИИ-ботом для составления этой статистики."
              style={{ color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'help' }}
            >
              <Target size={18} /> Проанализировано чатов
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--on-surface)' }}>{data?.totalChatsAnalyzed || 0}</div>
          </div>
          
          <div style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--outline-variant)' }}>
            <div 
              title="Средняя оценка качества диалогов от 0 до 100. Учитывает: закрытие на следующий шаг, вежливость, скорость ответов и работу с возражениями."
              style={{ color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'help' }}
            >
              <Star size={18} color="#FFD700" /> Индекс качества диалогов
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              {data?.averageScore || 0}<span style={{ fontSize: '1rem', color: 'var(--on-surface-variant)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Оценка работы бота/менеджера (призывы к действию, вежливость)</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Funnel */}
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--outline-variant)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} color="var(--primary)" /> Воронка продаж</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {funnelStages.map((stage, idx) => {
                const count = funnelCounts[stage] || 0;
                const percent = Math.round((count / maxCount) * 100);
                const color = stage === 'Успешно' ? '#25d366' : stage === 'Отказ' ? '#d63031' : stage === 'Молчит' ? '#f39c12' : 'var(--primary)';
                
                let tooltip = 'Этап воронки продаж.';
                if (stage === 'Лид') tooltip = 'Новый контакт. ИИ только начал общение или клиент еще не ответил на первый вопрос.';
                if (stage === 'Квалификация') tooltip = 'ИИ задает вопросы, чтобы понять потребности клиента и собрать данные.';
                if (stage === 'Презентация') tooltip = 'ИИ рассказывает о компании, услугах на основе ответов клиента.';
                if (stage === 'Отработка возражений') tooltip = 'Клиент сомневается, и ИИ пытается закрыть возражение.';
                if (stage === 'Ожидание оплаты') tooltip = 'ИИ ждет подтверждения брони, оплаты или решения от клиента.';
                if (stage === 'Успешно') tooltip = 'Клиент записался, оставил данные или согласился на целевое действие.';
                if (stage === 'Отказ') tooltip = 'Клиент явно отказался от услуг или не подошел по условиям.';
                if (stage === 'Молчит') tooltip = 'Клиент перестал отвечать и пропал из диалога.';

                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div 
                      title={tooltip}
                      style={{ width: '150px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--on-surface-variant)', textAlign: 'right', cursor: 'help' }}
                    >
                      {stage}
                    </div>
                    <div style={{ flex: 1, height: '24px', background: 'var(--surface-container-high)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '12px' }} />
                    </div>
                    <div style={{ width: '40px', fontWeight: 800, color: 'var(--on-surface)' }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drop-offs */}
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--outline-variant)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d63031' }}><TrendingDown size={20} /> Причины отвалов (Анализ)</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data?.dropOffReasons?.length > 0 ? (
                data.dropOffReasons.map((reason: string, i: number) => (
                  <div key={i} style={{ background: '#fdf2f2', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #d63031', fontSize: '0.9rem', color: '#9b1c1c', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{reason}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <PhoneOff size={32} style={{ opacity: 0.3 }} />
                  Отвалов пока нет
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Insights list */}
        {data?.chatAnalytics?.some((a: any) => a.insights) && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={20} color="#F5A623" /> Инсайты и рекомендации ИИ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
              {data.chatAnalytics.filter((a: any) => a.insights).map((a: any, i: number) => (
                <div key={i} style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(245,166,35,0.1) 100%)', border: '1px solid rgba(245,166,35,0.2)', padding: '1.5rem', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Чат: {a.chatId}</div>
                  <div style={{ color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.95rem', lineHeight: '1.5' }}>{a.insights}</div>
                </div>
              ))}
            </div>
          </div>
        )}

          </>
        )}
      </div>
    </div>
  );
}
