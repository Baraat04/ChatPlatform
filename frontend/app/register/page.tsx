"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Link from 'next/link';

const localT = {
  EN: {
    createAccountTitle: "Create Account",
    subtitle: "Join BotFlow and create smart bots",
    name: "Name",
    email: "Email",
    password: "Password",
    register: "Register",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign In",
    regError: "Registration error",
    connError: "Connection error",
    namePlaceholder: "John Doe"
  },
  RU: {
    createAccountTitle: "Создать аккаунт",
    subtitle: "Присоединяйтесь к BotFlow и создавайте умных ботов",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    register: "Зарегистрироваться",
    alreadyHaveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
    regError: "Ошибка регистрации",
    connError: "Ошибка соединения",
    namePlaceholder: "Иван Иванов"
  },
  KZ: {
    createAccountTitle: "Тіркелгі жасау",
    subtitle: "BotFlow-қа қосылып, ақылды боттар жасаңыз",
    name: "Аты",
    email: "Email",
    password: "Құпия сөз",
    register: "Тіркелу",
    alreadyHaveAccount: "Тіркелгіңіз бар ма?",
    signIn: "Кіру",
    regError: "Тіркелу қатесі",
    connError: "Қосылу қатесі",
    namePlaceholder: "Әлібек Асқаров"
  }
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const t = localT[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.user);
        router.push('/bots');
      } else {
        setError(data.error || t.regError);
      }
    } catch (err) {
      setError(t.connError);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '24px' }}>
      <div style={{ 
        background: 'var(--surface-container-lowest)', 
        padding: '40px', 
        width: '100%', 
        maxWidth: '450px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 8px 32px rgba(0, 53, 39, 0.08)',
        border: '1px solid var(--outline-variant)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            background: 'var(--primary)', 
            color: 'var(--on-primary)', 
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: '800',
            margin: '0 auto 16px auto'
          }}>B</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--on-surface)', marginBottom: '8px' }}>{t.createAccountTitle}</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px' }}>{t.subtitle}</p>
        </div>
        
        {error && (
          <div style={{ 
            background: 'var(--error-container)', 
            color: 'var(--on-error-container)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '24px', 
            fontSize: '14px',
            border: '1px solid rgba(186, 26, 26, 0.2)'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.name}</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
              required 
              placeholder={t.namePlaceholder}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.email}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
              required 
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--on-surface)' }}>{t.password}</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--outline-variant)',
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
              required 
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" style={{ 
            background: 'var(--primary)', 
            color: 'var(--on-primary)', 
            border: 'none', 
            borderRadius: 'var(--radius-md)', 
            padding: '14px', 
            fontSize: '16px', 
            fontWeight: '600',
            marginTop: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 4px 12px rgba(0, 53, 39, 0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-container)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
          >
            {t.register}
          </button>
        </form>
        
        <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          {t.alreadyHaveAccount} <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>{t.signIn}</Link>
        </p>
      </div>
    </div>
  );
}
