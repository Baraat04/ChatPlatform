'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Filter, Plus, Bot, ArrowRight, Link as LinkIcon } from 'lucide-react';
import styles from './page.module.css';

export default function MyBots() {
  const [bots, setBots] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBots() {
      try {
        const res = await fetch('http://localhost:3001/api/bot');
        const data = await res.json();
        console.log(data)

        const formattedBots = data.map((bot: any) => ({
          id: bot.id,
          name: `Bot ${bot.id}`,
          type: bot.platform,
          status: bot.isActive ? 'ONLINE' : 'OFFLINE',
          description: bot.system_prompt.slice(0, 100) + '...',
          slug: bot.slug,
          createdAt: new Date(bot.createdAt).toLocaleDateString(),
        }));

        setBots(formattedBots);
      } catch (error) {
        console.log('Fetch error:', error);
      }
    }

    fetchBots();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Bots</h1>
          <p className={styles.subtitle}>Manage and monitor your active conversational agents.</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.filterBtn}>
            <Filter size={18} />
            Filter
          </button>

          <Link href="/create-bot" className={styles.newBotBtn}>
            <Plus size={18} />
            New Bot
          </Link>
        </div>
      </div>

      <div className={styles.botsGrid}>
        {bots.length === 0 ? (
          <div className={styles.emptyState}>
            <Bot size={48} className={styles.emptyIcon} />
            <span className={styles.emptyText}>You haven't created any bots yet.</span>

            <Link href="/create-bot" className={styles.newBotBtn} style={{ marginTop: '16px' }}>
              Create First Bot
            </Link>
          </div>
        ) : (
          bots.map((bot: any) => (
            <Link href={`/bots/${bot.id}`} key={bot.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.botCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.botInfo}>
                    <div className={styles.botIcon}>
                      <Bot size={24} />
                    </div>

                    <div>
                      <div className={styles.botName}>{bot.name}</div>
                      <div className={styles.botSub}>{bot.type}</div>
                    </div>
                  </div>

                  <div className={styles.statusBadge}>
                    <div className={`${styles.statusDot} ${bot.status === 'ONLINE' ? styles.statusDotOnline : ''}`}></div>
                    {bot.status}
                  </div>
                </div>

                <div className={styles.botDesc}>{bot.description}</div>

                <div className={styles.divider}></div>

                <div className={styles.cardFooter}>
                  <div className={styles.integration}>
                    <LinkIcon size={16} />
                    {bot.slug}
                  </div>

                  <div className={styles.integration}>
                    Created: {bot.createdAt}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}