'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Bot, CheckCircle, MoreHorizontal } from 'lucide-react';
import styles from './page.module.css';

export default function Dashboard() {
  const [bots, setBots] = useState([]);
  const [insights, setInsights] = useState([]);
  
  // Real implementation would fetch these from the backend
  useEffect(() => {
    // fetch('/api/bots').then(...)
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Overview</h1>
          <p className={styles.subtitle}>Real-time performance metrics and bot status.</p>
        </div>
        <Link href="/create-bot" className={styles.newBotBtn}>
          <Plus size={20} />
          New Bot
        </Link>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <MessageSquare size={24} />
            </div>
            <h3 className={styles.metricLabel}>Total Conversations</h3>
          </div>
          <div className={styles.metricValueContainer}>
            <span className={styles.metricValue}>0</span>
          </div>
          <p className={styles.metricSub}>Awaiting data...</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <Bot size={24} />
            </div>
            <h3 className={styles.metricLabel}>Active Bots</h3>
          </div>
          <div className={styles.metricValueContainer}>
            <span className={styles.metricValue}>{bots.length}</span>
            <span className={styles.metricSub}>Deployed</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon}>
              <CheckCircle size={24} />
            </div>
            <h3 className={styles.metricLabel}>Resolution Rate</h3>
          </div>
          <div className={styles.metricValueContainer}>
            <span className={styles.metricValue}>0%</span>
          </div>
          <p className={styles.metricSub}>Awaiting data...</p>
        </div>
      </div>

      <div className={styles.lowerSection}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Your Bots</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}><MoreHorizontal size={20} /></button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bot Name</th>
                  <th>Status</th>
                  <th>Interactions</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {bots.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className={styles.emptyState}>
                        No bots found. Create one to get started!
                      </div>
                    </td>
                  </tr>
                ) : (
                  bots.map((bot: any, i) => (
                    <tr key={i}>
                      <td>{bot.name}</td>
                      <td>{bot.status}</td>
                      <td>{bot.interactions}</td>
                      <td>{bot.health}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>System Insights</h3>
          </div>
          <div className={styles.insightsList}>
            {insights.length === 0 ? (
              <div className={styles.emptyState}>No recent insights.</div>
            ) : (
              insights.map((insight: any, i) => (
                <div key={i} className={styles.insightItem}>
                  <div className={styles.insightDot}></div>
                  <div>
                    <p className={styles.insightText}>{insight.text}</p>
                    <span className={styles.insightTime}>{insight.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
