'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL as API } from '../../../config';
import { ArrowLeft, User, Bot, MessageSquare, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function AdminUserDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPass = sessionStorage.getItem('adminPass');
    if (!savedPass) {
      router.push('/adminbrouzi');
      return;
    }
    setPassword(savedPass);
    fetchUserDetails(savedPass);
  }, []);

  const fetchUserDetails = async (pass: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        headers: {
          'x-admin-pass': pass
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      } else {
        setError('Не удалось загрузить данные пользователя');
      }
    } catch (e) {
      setError('Ошибка соединения');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#3b82f6', fontWeight: 600 }}>Загрузка...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '1rem' }}>{error}</div>
        <Link href="/adminbrouzi" style={{ color: '#3b82f6', textDecoration: 'none' }}>Вернуться назад</Link>
      </div>
    );
  }

  const { user, usageChartData } = userData;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '1.5rem 2rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
              <User size={28} color="#3b82f6" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{user.name || 'Без имени'}</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{user.email}</p>
            </div>
          </div>
          <Link href="/adminbrouzi" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 600, textDecoration: 'none', background: '#f1f5f9', padding: '0.6rem 1.2rem', borderRadius: '12px', transition: 'background 0.2s' }}>
            <ArrowLeft size={18} /> Назад
          </Link>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '16px' }}>
              <Activity size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Тариф</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{user.subscriptionPlan}</div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '16px' }}>
              <MessageSquare size={24} color="#3b82f6" />
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Использовано сообщений</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{user.totalMessagesUsed} / {(user.totalMessagesUsed || 0) + (user.messagesRemaining || 0)}</div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '16px' }}>
              <Bot size={24} color="#eab308" />
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Всего ботов</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{user.bots?.length || 0}</div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '16px' }}>
              <Calendar size={24} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' }}>Дата регистрации</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
        </div>

        {/* Charts & Bots */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Chart */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem 0' }}>Использование AI (сообщения за 30 дней)</h2>
            {usageChartData && usageChartData.length > 0 ? (
              <div style={{ height: '350px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={20} tickFormatter={(tick) => {
                      const d = new Date(tick);
                      return `${d.getDate()}.${d.getMonth() + 1}`;
                    }} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
                    />
                    <Area type="monotone" dataKey="messages" name="Сообщения" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px' }}>
                Нет данных об использовании за последние 30 дней
              </div>
            )}
          </div>

          {/* Bots List */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem 0' }}>Боты пользователя</h2>
            {user.bots && user.bots.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {user.bots.map((bot: any) => (
                  <div key={bot.id} style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#fafaf9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>{bot.slug}</div>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: bot.isActive ? '#dcfce7' : '#fee2e2', color: bot.isActive ? '#166534' : '#991b1b' }}>
                        {bot.isActive ? 'Активен' : 'Отключен'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: bot.platform === 'WHATSAPP' ? '#10b981' : bot.platform === 'TELEGRAM' ? '#3b82f6' : '#e1306c' }}>
                        {bot.platform}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: 'auto' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Сообщений: <span style={{ fontWeight: 700, color: '#0f172a' }}>{bot._count.messages}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Создан: {new Date(bot.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                У пользователя пока нет ботов
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
