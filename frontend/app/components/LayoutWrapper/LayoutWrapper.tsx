'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '../Sidebar/Sidebar';
import TopAppBar from '../TopAppBar/TopAppBar';
import styles from './LayoutWrapper.module.css';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Send, Headphones, Loader2 } from 'lucide-react';
import { API_URL } from '../../config';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Inline SVG robot icon — no file needed
function RobotIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Headphone arc */}
      <path d="M12 30 C12 16 52 16 52 30" stroke="#4a4a5a" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Left ear cup */}
      <rect x="6" y="28" width="10" height="14" rx="4" fill="#6fb3e0"/>
      {/* Right ear cup */}
      <rect x="48" y="28" width="10" height="14" rx="4" fill="#6fb3e0"/>
      {/* Face */}
      <rect x="16" y="28" width="32" height="26" rx="6" fill="#c9e6f7"/>
      {/* Left eye */}
      <rect x="22" y="36" width="7" height="6" rx="2" fill="#4a4a5a"/>
      {/* Right eye */}
      <rect x="35" y="36" width="7" height="6" rx="2" fill="#4a4a5a"/>
      {/* Mouth */}
      <rect x="26" y="46" width="12" height="4" rx="2" fill="#4a4a5a"/>
      {/* Mic arm */}
      <path d="M56 38 Q62 44 56 50" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Привет! 👋 Я ИИ-помощник платформы UP-CHAT. Задайте любой вопрос о работе с платформой — подключение ботов, настройка, тарифы, и многое другое.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' });
  const [supportLoading, setSupportLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_URL}/platform-ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Произошла ошибка. Попробуйте ещё раз.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения. Пожалуйста, попробуйте позже.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    try {
      await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(supportForm),
      });
    } catch {}
    setSupportSent(true);
    setSupportLoading(false);
  };

  return (
    <>
      {/* Floating robot button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Помощник UP-CHAT"
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000,
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'white',
          border: '2px solid #d1d5db',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)'; }}
      >
        {open
          ? <X size={26} color="#64748b" />
          : <RobotIcon size={42} />
        }
      </button>

      {/* Chat popup */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '104px', right: '28px', zIndex: 999,
          width: '360px', maxHeight: '540px',
          background: 'var(--surface-container-lowest)',
          borderRadius: '24px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          border: '1px solid var(--outline-variant)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <style>{`
            @keyframes chatPopIn {
              0% { opacity:0; transform: scale(0.9) translateY(16px); }
              100% { opacity:1; transform: scale(1) translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '16px 20px', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
          }}>
              <RobotIcon size={32} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--on-primary)', fontSize: '0.95rem' }}>Помощник UP-CHAT</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)' }}>Возникли вопросы по платформе? Спросите ИИ</div>
            </div>
            {!showSupportForm && (
              <button
                onClick={() => { setShowSupportForm(true); setSupportSent(false); }}
                title="Техподдержка"
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
              >
                <Headphones size={16} />
              </button>
            )}
            {showSupportForm && (
              <button
                onClick={() => setShowSupportForm(false)}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Main content */}
          {!showSupportForm ? (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    {msg.role === 'assistant' && (
                      <RobotIcon size={26} />
                    )}
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-container-low)',
                      color: msg.role === 'user' ? 'var(--on-primary)' : 'var(--on-surface)',
                      fontSize: '0.85rem', lineHeight: '1.5',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RobotIcon size={24} />
                    <div style={{ background: 'var(--surface-container-low)', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--on-surface-variant)', animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
                <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.7);opacity:0.5} 40%{transform:scale(1);opacity:1} }`}</style>
              </div>

              {/* Support footer */}
              <div style={{ padding: '8px 16px', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container)', flexShrink: 0 }}>
                <button
                  onClick={() => { setShowSupportForm(true); setSupportSent(false); }}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '0.75rem', textAlign: 'center', padding: '4px 0' }}
                >
                  Не можете получить ответ? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Напишите в поддержку</span> — с вами свяжутся
                </button>
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '8px', flexShrink: 0 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Задайте вопрос по платформе..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem',
                    border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)',
                    color: 'var(--on-surface)', outline: 'none', fontFamily: 'inherit',
                  }}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'var(--primary)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0,
                  }}
                >
                  {loading ? <Loader2 size={17} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={17} color="white" />}
                </button>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            </>
          ) : (
            /* Support form */
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {supportSent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px', fontSize: '1rem' }}>Заявка отправлена!</div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Наша команда свяжется с вами в ближайшее время.</div>
                  <button onClick={() => { setShowSupportForm(false); setSupportSent(false); }} style={{ marginTop: '16px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Вернуться к чату</button>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>Написать в техподдержку</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>Не смогли найти ответ? Опишите проблему — мы поможем.</div>
                  {['name', 'email'].map(field => (
                    <input
                      key={field} required
                      type={field === 'email' ? 'email' : 'text'}
                      placeholder={field === 'name' ? 'Ваше имя' : 'Email для ответа'}
                      value={(supportForm as any)[field]}
                      onChange={e => setSupportForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontFamily: 'inherit', width: '100%' }}
                    />
                  ))}
                  <textarea
                    required rows={4}
                    placeholder="Опишите ваш вопрос или проблему..."
                    value={supportForm.message}
                    onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                    style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', color: 'var(--on-surface)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', width: '100%' }}
                  />
                  <button type="submit" disabled={supportLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '11px', borderRadius: '10px', background: 'var(--primary)', color: 'var(--on-primary)', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: supportLoading ? 'not-allowed' : 'pointer', opacity: supportLoading ? 0.7 : 1 }}>
                    <Send size={15} /> {supportLoading ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

const SupportWidget = AIChatWidget;

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const publicPage = pathname === '/landing' || pathname === '/demo' || 
    pathname === '/privacy-policy' || pathname === '/offer' || pathname === '/terms-of-use' ||
    pathname?.startsWith('/verify-email') || pathname === '/create-bot';
  const noLayoutPage = isAuthPage || publicPage;

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
