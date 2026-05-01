'use client';

import { useState } from 'react';
import { ArrowRight, Bot, Database, Key } from 'lucide-react';
import styles from './page.module.css';

export default function CreateBot() {
  const [botToken, setBotToken] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataPrompt, setDataPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3500/api/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          data_prompt: dataPrompt,
          botToken: botToken,
          user_id: 1, // Hardcoded as requested
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Bot created and webhook configured successfully!');
        // Clear form
        setBotToken('');
        setSystemPrompt('');
        setDataPrompt('');
      } else {
        alert(`Error: ${data.error || 'Failed to create bot'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to the server.');
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

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Bot Configuration</h3>
          <p className={styles.cardSubtitle}>Provide your Telegram bot token and configure instructions.</p>
        </div>

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={`${styles.formGroup} ${styles.colSpan12}`}>
            <label className={styles.label} htmlFor="botToken">
              <span>Telegram Bot Token</span>
              <span className={styles.secureLabel}>
                <Key size={16} /> Required
              </span>
            </label>
            <input 
              className={styles.input} 
              id="botToken" 
              placeholder="1234567890:ABCDefGhIjKlMnOpQrStUvWxYz" 
              type="text" 
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              required
            />
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan12}`}>
            <label className={styles.label} htmlFor="systemPrompt">
              <span>System Prompt</span>
              <span className={styles.secureLabel}>
                <Bot size={16} /> Behavior
              </span>
            </label>
            <textarea 
              className={styles.input} 
              id="systemPrompt" 
              placeholder="You are a helpful customer support agent..." 
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan12}`}>
            <label className={styles.label} htmlFor="dataPrompt">
              <span>Data Grounding (Knowledge Base)</span>
              <span className={styles.secureLabel}>
                <Database size={16} /> Context
              </span>
            </label>
            <textarea 
              className={styles.input} 
              id="dataPrompt" 
              placeholder="Paste any company policies, FAQs, or structured data here..." 
              rows={6}
              value={dataPrompt}
              onChange={(e) => setDataPrompt(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className={`${styles.colSpan12} ${styles.actionArea}`}>
            <button type="button" className={styles.btnDiscard} onClick={() => {
              setBotToken('');
              setSystemPrompt('');
              setDataPrompt('');
            }}>
              Clear Form
            </button>
            <div className={styles.actionButtons}>
              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Deploy Bot'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
