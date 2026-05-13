'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Bot, Database, Key, MessageCircle, Phone } from 'lucide-react';
import styles from './page.module.css';
import { io, Socket } from 'socket.io-client';

export default function CreateBot() {
  const [platform, setPlatform] = useState<'TELEGRAM' | 'WHATSAPP'>('TELEGRAM');
  const [botToken, setBotToken] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataPrompt, setDataPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // WhatsApp State
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => { newSocket.disconnect(); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);
    setQrCode(null);
    setWaStatus(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          data_prompt: dataPrompt,
          botToken: platform === 'TELEGRAM' ? botToken : undefined,
          platform: platform,
          user_id: 1, // hardcoded user
        }),
      });

      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch {
        setMessage({ type: 'error', text: `Server error: ${text.slice(0, 300)}` });
        return;
      }

      if (response.ok) {
        if (platform === 'TELEGRAM') {
          setMessage({ type: 'success', text: '✅ Telegram Bot created and webhook configured successfully!' });
          setBotToken(''); setSystemPrompt(''); setDataPrompt('');
        } else {
          setMessage({ type: 'success', text: '⏳ Generating WhatsApp QR Code...' });
          // Listen to QR and status for this specific bot
          const botId = data.id;
          if (socket) {
            socket.on(`qr-${botId}`, (qrDataUrl) => {
              setQrCode(qrDataUrl);
              setMessage({ type: 'success', text: '📷 Scan this QR code in WhatsApp -> Linked Devices' });
            });
            socket.on(`status-${botId}`, (status) => {
              if (status === 'connected') {
                setWaStatus('✅ Connected to WhatsApp!');
                setQrCode(null);
                setMessage({ type: 'success', text: '✅ WhatsApp Bot is now active and ready!' });
              } else if (status === 'logged_out') {
                setWaStatus('❌ Disconnected');
              }
            });
          }
        }
      } else {
        setMessage({ type: 'error', text: `❌ ${data.error || data.details || 'Failed to create bot'}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: '❌ Failed to connect to backend on port 3001. Is it running?' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Configure AI Agent</h2>
        <p className={styles.subtitle}>Define connection parameters and establish core behavioral boundaries for your new bot instance.</p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
          color: message.type === 'success' ? '#22c55e' : '#ef4444', fontSize: '14px',
        }}>
          {message.text}
        </div>
      )}

      {qrCode && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', padding: '20px', background: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <h3 style={{ color: '#fff', marginBottom: '10px' }}>Scan with WhatsApp</h3>
          <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px', borderRadius: '8px', background: 'white', padding: '10px' }} />
        </div>
      )}
      {waStatus && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#22c55e', fontWeight: 'bold' }}>
          {waStatus}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Bot Configuration</h3>
          <p className={styles.cardSubtitle}>Select platform and configure instructions.</p>
        </div>

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          
          {/* Platform Selector */}
          <div className={`${styles.formGroup} ${styles.colSpan12}`}>
            <label className={styles.label}>
              <span>Platform</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setPlatform('TELEGRAM')}
                style={{ flex: 1, padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: platform === 'TELEGRAM' ? '2px solid #3b82f6' : '1px solid #374151', background: platform === 'TELEGRAM' ? 'rgba(59,130,246,0.1)' : 'transparent', color: '#fff', cursor: 'pointer' }}>
                <MessageCircle size={18} /> Telegram
              </button>
              <button 
                type="button" 
                onClick={() => setPlatform('WHATSAPP')}
                style={{ flex: 1, padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: platform === 'WHATSAPP' ? '2px solid #22c55e' : '1px solid #374151', background: platform === 'WHATSAPP' ? 'rgba(34,197,94,0.1)' : 'transparent', color: '#fff', cursor: 'pointer' }}>
                <Phone size={18} /> WhatsApp
              </button>
            </div>
          </div>

          {platform === 'TELEGRAM' && (
            <div className={`${styles.formGroup} ${styles.colSpan12}`}>
              <label className={styles.label} htmlFor="botToken">
                <span>Telegram Bot Token</span>
                <span className={styles.secureLabel}><Key size={16} /> Required</span>
              </label>
              <input className={styles.input} id="botToken"
                placeholder="1234567890:ABCDefGhIjKlMnOpQrStUvWxYz"
                type="text" value={botToken}
                onChange={(e) => setBotToken(e.target.value)} required />
            </div>
          )}

          <div className={`${styles.formGroup} ${styles.colSpan12}`}>
            <label className={styles.label} htmlFor="systemPrompt">
              <span>System Prompt</span>
              <span className={styles.secureLabel}><Bot size={16} /> Behavior</span>
            </label>
            <textarea className={styles.input} id="systemPrompt"
              placeholder="You are a helpful customer support agent..."
              rows={4} value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan12}`}>
            <label className={styles.label} htmlFor="dataPrompt">
              <span>Data Grounding (Knowledge Base)</span>
              <span className={styles.secureLabel}><Database size={16} /> Context</span>
            </label>
            <textarea className={styles.input} id="dataPrompt"
              placeholder="Paste any company policies, FAQs, or structured data here..."
              rows={6} value={dataPrompt}
              onChange={(e) => setDataPrompt(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          <div className={`${styles.colSpan12} ${styles.actionArea}`}>
            <button type="button" className={styles.btnDiscard} onClick={() => {
              setBotToken(''); setSystemPrompt(''); setDataPrompt(''); setMessage(null); setQrCode(null); setWaStatus(null);
            }}>Clear Form</button>
            <div className={styles.actionButtons}>
              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : `Deploy ${platform === 'TELEGRAM' ? 'Telegram' : 'WhatsApp'} Bot`}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
