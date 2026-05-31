"use client";

import React, { useState, useEffect } from 'react';
import { LifeBuoy, Trash2, Mail, User, Clock, ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '../../config';

interface Ticket {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminSupportTickets() {
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
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
    const validUsernames = ['admin', 'support', 'moderator'];
    const validPasswords = ['admin', 'admin123', 'homelander'];
    
    if (validUsernames.includes(username.toLowerCase().trim()) && validPasswords.includes(password)) {
      sessionStorage.setItem('admin_authorized', 'true');
      sessionStorage.setItem('admin_username', username);
      sessionStorage.setItem('admin_password', password);
      setAuthorized(true);
      setError('');
    } else {
      setError('Неверный логин или пароль администратора.');
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const adminPass = sessionStorage.getItem('admin_password') || '';
      const res = await fetch(`${API_URL}/statistics/admin-support`, {
        credentials: 'include',
        headers: {
          'x-admin-password': adminPass
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchTickets();
    }
  }, [authorized]);

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это обращение?')) return;
    try {
      const adminPass = sessionStorage.getItem('admin_password') || '';
      const res = await fetch(`${API_URL}/statistics/admin-support/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-admin-password': adminPass
        }
      });
      if (res.ok) {
        setTickets(tickets.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete support ticket:', err);
    }
  };

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
          background: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.5)',
          textAlign: 'center'
        }}>
          {/* Back button */}
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <Link href="/docs" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#9ca3af',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
            >
              <ArrowLeft size={14} /> Вернуться в Инструкцию
            </Link>
          </div>

          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.025em' }}>Админ-панель Support</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.5 }}>Введите имя пользователя и пароль администратора для получения доступа.</p>
          
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {/* Username Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Логин</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444', 
                fontSize: '0.85rem', 
                padding: '10px 12px',
                borderRadius: '10px',
                marginTop: '4px'
              }}>
                {error}
              </div>
            )}

            <button type="submit" style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#ef4444',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              marginTop: '12px',
              fontSize: '0.95rem',
              transition: 'background 0.2s, transform 0.1s'
            }}
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--on-background)',
      fontFamily: 'Inter, sans-serif',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Navigation back */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/admin/analytics" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--on-surface-variant)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <ArrowLeft size={16} /> Назад в Аналитику
          </Link>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          borderBottom: '1px solid var(--outline-variant)',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--primary-container)',
              color: 'var(--on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LifeBuoy size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Обращения техподдержки</h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: 0, marginTop: '4px' }}>
                Список запросов и проблем от пользователей UP-CHAT.
              </p>
            </div>
          </div>
          <div style={{
            background: 'var(--surface-container-high)',
            color: 'var(--on-surface)',
            fontWeight: 700,
            fontSize: '0.88rem',
            padding: '8px 16px',
            borderRadius: '99px'
          }}>
            Всего обращений: {tickets.length}
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--on-surface-variant)' }}>Загрузка обращений...</div>
        ) : tickets.length === 0 ? (
          <div style={{
            background: 'var(--surface-container-low)',
            borderRadius: '20px',
            border: '1px solid var(--outline-variant)',
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--on-surface-variant)'
          }}>
            <LifeBuoy size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Обращений нет</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Пользователи пока не отправляли запросов в поддержку.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tickets.map(ticket => (
              <div key={ticket.id} style={{
                background: 'var(--surface-container-low)',
                borderRadius: '20px',
                border: '1px solid var(--outline-variant)',
                padding: '24px',
                transition: 'box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {/* Sender Info */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <User size={16} color="var(--primary)" />
                      <span>{ticket.name}</span>
                    </div>
                    <a href={`mailto:${ticket.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 500 }}>
                      <Mail size={16} />
                      <span>{ticket.email}</span>
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                      <Clock size={14} />
                      <span>{new Date(ticket.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>

                {/* Message Body */}
                <div style={{
                  background: 'var(--surface-container-lowest)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--on-surface)',
                  border: '1px solid var(--outline-variant)'
                }}>
                  {ticket.message}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
