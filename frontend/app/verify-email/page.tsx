"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '../config';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState('Проверка...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('Неверный или отсутствующий токен подтверждения.');
      return;
    }
    
    fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
      if (status === 200) {
        setIsSuccess(true);
        setStatus('Почта успешно подтверждена! Сейчас вы будете перенаправлены на страницу входа...');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setStatus(body.error || 'Ошибка подтверждения почты. Возможно, ссылка устарела.');
      }
    })
    .catch(() => setStatus('Ошибка соединения с сервером.'));
  }, [token, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '24px' }}>
      <div style={{ 
        background: 'var(--surface-container-lowest)', 
        padding: '40px', 
        width: '100%', 
        maxWidth: '450px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 8px 32px rgba(0, 53, 39, 0.08)',
        border: '1px solid var(--outline-variant)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: isSuccess ? 'var(--primary)' : 'var(--on-surface)', marginBottom: '16px' }}>
          {isSuccess ? 'Успешно!' : 'Подтверждение почты'}
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '15px', marginBottom: '32px' }}>
          {status}
        </p>

        {!isSuccess && (
          <Link href="/login" style={{ 
            background: 'var(--primary)', 
            color: 'var(--on-primary)', 
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)', 
            padding: '14px 24px', 
            fontSize: '16px', 
            fontWeight: '600',
            display: 'inline-block'
          }}>
            Вернуться ко входу
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
