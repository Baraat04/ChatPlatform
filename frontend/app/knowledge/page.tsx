'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, FileText, PieChart, ShieldCheck, TrendingUp } from 'lucide-react';
import styles from './page.module.css';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<any[]>([]);

  // Fetch knowledge base docs from backend
  useEffect(() => {
    // fetch('/api/knowledge').then(...)
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Base</h1>
          <p className={styles.subtitle}>Manage and index documents, URLs, and structured data to enhance your AI models' context.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>
            <RefreshCw size={18} />
            Sync All
          </button>
          <button className={styles.btnPrimary}>
            <Plus size={18} />
            Add Source
          </button>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h3 className={styles.metricLabel}>Total Documents</h3>
            <div className={styles.metricIcon}>
              <FileText size={16} />
            </div>
          </div>
          <div className={styles.metricValue}>0</div>
          <div className={styles.metricSub}>
            <TrendingUp size={14} />
            +0 this week
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h3 className={styles.metricLabel}>Indexed Tokens</h3>
            <div className={styles.metricIcon}>
              <PieChart size={16} />
            </div>
          </div>
          <div className={styles.metricValue}>0</div>
          <div className={styles.metricSub}>
            0% of plan limit
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h3 className={styles.metricLabel}>System Health</h3>
            <div className={styles.metricIcon}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className={styles.metricValue}>N/A</div>
          <div className={styles.metricSub}>
            <span className={styles.statusDotWarning} style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '4px' }}></span>
            No data synced
          </div>
        </div>
      </div>

      <div className={styles.tableSectionHeader}>
        <h2 className={styles.tableTitle}>Data Sources</h2>
        <select className={styles.selectBox}>
          <option>All Types</option>
          <option>Document</option>
          <option>Web Crawl</option>
          <option>Integration</option>
        </select>
      </div>

      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Type</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      No data sources found.
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc, i) => (
                  <tr key={i}>
                    <td>
                      <div className={styles.sourceCell}>
                        <FileText size={20} className={styles.sourceIcon} />
                        <div>
                          <div className={styles.sourceName}>{doc.name}</div>
                          <div className={styles.sourceSub}>{doc.subInfo}</div>
                        </div>
                      </div>
                    </td>
                    <td>{doc.type}</td>
                    <td>
                      {doc.tags?.map((tag: string, idx: number) => (
                        <span key={idx} className={styles.tag}>{tag}</span>
                      ))}
                    </td>
                    <td>
                      <div className={styles.status}>
                        <span className={`${styles.statusDot} ${doc.status === 'Indexed' ? styles.statusDotSuccess : doc.status === 'Failed' ? styles.statusDotError : styles.statusDotWarning}`}></span>
                        <span className={`${doc.status === 'Indexed' ? styles.statusSuccess : doc.status === 'Failed' ? styles.statusError : styles.statusWarning}`}>
                          {doc.status}
                        </span>
                      </div>
                    </td>
                    <td>{doc.updated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>Showing {documents.length} entries</span>
          <div className={styles.pagination}>
            <button className={styles.pageBtn}>Prev</button>
            <button className={styles.pageBtn}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
