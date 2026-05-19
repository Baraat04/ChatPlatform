'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '../Sidebar/Sidebar';
import TopAppBar from '../TopAppBar/TopAppBar';
import styles from './LayoutWrapper.module.css';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LifeBuoy, X, Send, CheckCircle } from 'lucide-react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
    } catch {}
    setSent(true);
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); setSent(false); setForm({ name: '', email: '', message: '' }); }}
        title="Техподдержка"
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000,
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--primary)', color: 'var(--on-primary)',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={22} /> : <LifeBuoy size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '92px', right: '28px', zIndex: 999,
          width: '340px', background: 'var(--surface-container-lowest)',
          borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid var(--outline-variant)', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 20px', background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LifeBuoy size={20} color="var(--on-primary)" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--on-primary)', fontSize: '0.97rem' }}>Техническая поддержка</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>Мы поможем с любым вопросом</div>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle size={40} color="#10b981" style={{ marginBottom: '10px' }} />
                <div style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>Отправлено!</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Ответим вам в ближайшее время.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['name', 'email'].map(field => (
                  <input
                    key={field}
                    required
                    type={field === 'email' ? 'email' : 'text'}
                    placeholder={field === 'name' ? 'Ваше имя' : 'Email'}
                    value={(form as any)[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{
                      padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem',
                      border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
                      color: 'var(--on-surface)', outline: 'none', fontFamily: 'inherit', width: '100%',
                    }}
                  />
                ))}
                <textarea
                  required rows={3}
                  placeholder="Опишите проблему или вопрос..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  style={{
                    padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem',
                    border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
                    color: 'var(--on-surface)', outline: 'none', fontFamily: 'inherit',
                    resize: 'vertical', width: '100%',
                  }}
                />
                <button
                  type="submit" disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                    padding: '11px', borderRadius: '10px', background: 'var(--primary)',
                    color: 'var(--on-primary)', fontWeight: 700, fontSize: '0.88rem',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <Send size={15} /> {loading ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const noLayoutPage = isAuthPage || pathname === '/landing';

  useEffect(() => {
    if (!loading && !user && !noLayoutPage) {
      router.push('/landing');
    }
  }, [user, loading, noLayoutPage, router]);

  if (noLayoutPage) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff' }}>Loading...</div>;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className={styles.layout}>
          {!noLayoutPage && <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />}
          <div className={noLayoutPage ? styles.fullWidthContent : styles.mainContent}>
            {!noLayoutPage && <TopAppBar onMenuClick={toggleSidebar} />}
            {children}
          </div>
        </div>
        {!noLayoutPage && <SupportWidget />}
      </LanguageProvider>
    </ThemeProvider>
  );
}
