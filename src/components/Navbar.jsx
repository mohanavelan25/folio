import { useClock } from '../hooks/useClock';
import styles from './Navbar.module.css';

export default function Navbar({ page, onNavigate, onAdd, priceStatus, lastUpdated, isMarket, onRefresh }) {
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

      {/* Page tabs */}
      <ul className={styles.tabs}>
        <li>
          <button
            className={page === 'portfolio' ? styles.active : ''}
            onClick={() => onNavigate('portfolio')}
          >Overview</button>
        </li>
        <li>
          <button
            className={page === 'budget' ? styles.active : ''}
            onClick={() => onNavigate('budget')}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }}>
              <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M1 5.5h12M4 8.5h2M8 8.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Budget
          </button>
        </li>
      </ul>

      <div className={styles.right}>
        {statusLabel && (
          <div className={`${styles.statusPill} ${statusClass}`}>
            <span className={styles.statusDot} />
            {statusLabel}
          </div>
        )}

        {lastUpdatedStr && priceStatus !== 'loading' && (
          <span className={styles.lastUpdated}>{lastUpdatedStr}</span>
        )}

        <button
          className={`${styles.refreshBtn} ${priceStatus === 'loading' ? styles.spinning : ''}`}
          onClick={onRefresh}
          title="Refresh prices"
          disabled={priceStatus === 'loading'}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 7A6 6 0 0 1 12.5 4M13 1v3h-3M13 7A6 6 0 0 1 1.5 10M1 13v-3h3"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span className={styles.time}>{time}</span>

        <button className={styles.addBtn} onClick={onAdd}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add Position
        </button>
      </div>
    </nav>
  );
}
