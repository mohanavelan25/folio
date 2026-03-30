import { useState } from 'react';
import { useClock } from '../hooks/useClock';
import styles from './Navbar.module.css';

const TABS = ['Overview', 'Holdings', 'Analytics', 'Activity'];

export default function Navbar({ onAdd, priceStatus, lastUpdated, isMarket, onRefresh }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const time = useClock();

  const statusLabel = {
    idle:    null,
    loading: 'Updating…',
    success: isMarket ? 'Live' : 'Closed',
    error:   'Fetch failed',
  }[priceStatus] ?? null;

  const statusClass = {
    loading: styles.statusLoading,
    success: isMarket ? styles.statusLive : styles.statusClosed,
    error:   styles.statusError,
  }[priceStatus] ?? '';

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>Folio</div>

      <ul className={styles.tabs}>
        {TABS.map(t => (
          <li key={t}>
            <button
              className={activeTab === t ? styles.active : ''}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.right}>
        {/* Live / Closed / Error status pill */}
        {statusLabel && (
          <div className={`${styles.statusPill} ${statusClass}`}>
            <span className={styles.statusDot} />
            {statusLabel}
          </div>
        )}

        {/* Last updated time */}
        {lastUpdatedStr && priceStatus !== 'loading' && (
          <span className={styles.lastUpdated} title="Last price update">
            {lastUpdatedStr}
          </span>
        )}

        {/* Manual refresh button */}
        <button
          className={`${styles.refreshBtn} ${priceStatus === 'loading' ? styles.spinning : ''}`}
          onClick={onRefresh}
          title="Refresh prices"
          disabled={priceStatus === 'loading'}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 7A6 6 0 0 1 12.5 4M13 1v3h-3M13 7A6 6 0 0 1 1.5 10M1 13v-3h3"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>

        <span className={styles.time}>{time}</span>

        <button className={styles.addBtn} onClick={onAdd}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Position
        </button>
      </div>
    </nav>
  );
}
