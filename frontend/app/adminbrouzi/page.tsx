'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL as API } from '../config';
import { ShieldAlert, Users, Trash2, ArrowUpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async (pass: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: {
          'x-admin-pass': pass
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setIsAuthenticated(true);
        setError('');
        sessionStorage.setItem('adminPass', pass);
      } else {
        setError('Неверный пароль');
        setIsAuthenticated(false);
      }
    } catch (e) {
      setError('Ошибка соединения');
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(password);
  };

  const handleChangePlan = async (userId: number, newPlan: string) => {
    if (!confirm(`Изменить тариф пользователя на ${newPlan}?`)) return;

    try {
      const res = await fetch(`${API}/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': password
        },
        body: JSON.stringify({ plan: newPlan })
      });

      if (res.ok) {
        // Refresh users
        fetchUsers(password);
      } else {
        alert('Ошибка изменения тарифа');
      }
    } catch (e) {
      alert('Ошибка соединения');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPass) return alert('Email и пароль обязательны');
    setIsCreating(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': password
        },
        body: JSON.stringify({ email: newEmail, password: newPass, name: newName, plan: 'FREE' })
      });
      if (res.ok) {
        setNewEmail(''); setNewPass(''); setNewName('');
        fetchUsers(password);
        alert('Пользователь успешно создан');
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при создании пользователя');
      }
    } catch (e) {
      alert('Ошибка соединения');
    }
    setIsCreating(false);
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${email}? Все его данные будут стёрты.`)) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pass': password }
      });
      if (res.ok) {
        fetchUsers(password);
      } else {
        alert('Ошибка удаления');
      }
    } catch (e) {
      alert('Ошибка соединения');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <ShieldAlert size={48} color="#3b82f6" />
            </div>
          </div>
          <h1 style={{ color: 'white', textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>ADMIN PANEL</h1>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password"
              placeholder="Пароль администратора"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #475569', background: '#0f172a', color: 'white', marginBottom: '1rem', outline: 'none' }}
              autoFocus
            />
            {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'ПРОВЕРКА...' : 'ВОЙТИ'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '1.5rem 2rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={32} color="#10b981" />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Управление пользователями</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Секретная админ-панель</p>
            </div>
          </div>
          <Link href="/bots" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Вернуться в приложение</Link>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Создать нового пользователя</h2>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required style={{ flex: 1, minWidth: '200px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="password" placeholder="Пароль" value={newPass} onChange={e => setNewPass(e.target.value)} required style={{ flex: 1, minWidth: '150px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="text" placeholder="Имя (необяз.)" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <button type="submit" disabled={isCreating} style={{ padding: '0.8rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              {isCreating ? 'Создание...' : 'Добавить'}
            </button>
          </form>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>ID / Дата</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Пользователь</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Текущий тариф</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Лимиты</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Управление тарифом</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr 
                  key={u.id} 
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }}
                  onClick={() => router.push(`/adminbrouzi/user/${u.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>#{u.id}</div>
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name || 'Без имени'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.3rem 0.8rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800,
                      background: u.subscriptionPlan === 'PRO' ? '#fef08a' : u.subscriptionPlan === 'GROWTH' ? '#bbf7d0' : (u.subscriptionPlan === 'STARTER' || u.subscriptionPlan === 'BASIC') ? '#bfdbfe' : '#e2e8f0',
                      color: u.subscriptionPlan === 'PRO' ? '#854d0e' : u.subscriptionPlan === 'GROWTH' ? '#166534' : (u.subscriptionPlan === 'STARTER' || u.subscriptionPlan === 'BASIC') ? '#1e3a8a' : '#475569'
                    }}>
                      {u.subscriptionPlan}
                    </span>
                    {u.subscriptionExpiresAt && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>до {new Date(u.subscriptionExpiresAt).toLocaleDateString('ru-RU')}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>{u.totalMessagesUsed} / {(u.totalMessagesUsed || 0) + (u.messagesRemaining || 0)}</div>
                    <div style={{ width: '100px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                      <div style={{ height: '100%', background: '#3b82f6', borderRadius: '2px', width: Math.min(100, ((u.totalMessagesUsed || 0) / (((u.totalMessagesUsed || 0) + (u.messagesRemaining || 0)) || 1)) * 100) + '%' }}></div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleChangePlan(u.id, 'STARTER')}
                        style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        Дать STARTER
                      </button>
                      <button 
                        onClick={() => handleChangePlan(u.id, 'GROWTH')}
                        style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        Дать GROWTH
                      </button>
                      <button 
                        onClick={() => handleChangePlan(u.id, 'PRO')}
                        style={{ padding: '0.4rem 0.8rem', background: '#eab308', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                        Дать PRO
                      </button>
                      <button 
                        onClick={() => handleChangePlan(u.id, 'FREE')}
                        style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        title="Сбросить до FREE">
                        Сброс
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        style={{ padding: '0.4rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Удалить пользователя">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Пользователей пока нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
