import styles from './HeroSection.module.css';

const RANGES = ['1W', '1M', '3M', '1Y', 'ALL'];

export default function HeroSection({ stats, activeRange, onRangeChange }) {
  const { totalValue, totalCost, totalPnl, pnlPct, dayPnl, dayPct } = stats;
  const dayUp = dayPnl >= 0;
  const pnlUp = totalPnl >= 0;

  return (
    <section className={`${styles.hero} anim-fade-slide`}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.left}>
            <div className={styles.label}>Total Portfolio Value</div>
            <div className={styles.value}>
              <span className={styles.currency}>₹</span>
              {Math.round(totalValue).toLocaleString('en-IN')}
            </div>
            
            <div className={`${styles.change} ${dayUp ? styles.up : styles.down}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {dayUp
                  ? <path d="M7 2.5v9M3 5.5l4-3 4 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M7 11.5v-9M3 8.5l4 3 4-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                }
              </svg>
              <span>{dayPct >= 0 ? '+' : ''}{dayPct.toFixed(2)}%</span>
              <span className={styles.badge}>
                {dayUp ? '+' : ''}{Math.round(dayPnl).toLocaleString('en-IN')}
              </span>
              <span className={styles.sub}>today</span>
            </div>
          </div>

          <div className={styles.rangeWrap}>
            {RANGES.map(r => (
              <button
                key={r}
                className={activeRange === r ? styles.rangeActive : styles.rangeBtn}
                onClick={() => onRangeChange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.meta}>
          <MetaItem label="Invested"   value={`₹${Math.round(totalCost).toLocaleString('en-IN')}`} color="neutral" />
          <MetaItem label="P&L"        value={`${totalPnl >= 0 ? '+' : ''}₹${Math.round(totalPnl).toLocaleString('en-IN')}`} color={pnlUp ? 'pos' : 'neg'} />
          <MetaItem label="Returns"    value={`${totalPnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`} color={pnlUp ? 'pos' : 'neg'} />
          <MetaItem label="Day's P&L"  value={`${dayUp ? '+' : '-'}₹${Math.round(Math.abs(dayPnl)).toLocaleString('en-IN')}`} color={dayUp ? 'pos' : 'neg'} />
        </div>
      </div>
    </section>
  );
}

function MetaItem({ label, value, color }) {
  return (
    <div className={styles.metaItem}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={`${styles.metaVal} ${styles[color] || ''}`}>{value}</span>
    </div>
  );
}