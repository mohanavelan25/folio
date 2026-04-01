import { TYPE_META } from '../data/defaults';
import { fmt, fmtPct, sparkPath } from '../utils';
import styles from './HoldingsTable.module.css';

export default function HoldingsTable({ holdings, onEdit }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>
          Holdings <em className={styles.count}>{holdings.length}</em>
        </span>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.left}>Asset</th>
              <th>Qty</th>
              <th>Avg Cost</th>
              <th>Current</th>
              <th>Value</th>
              <th>P&amp;L</th>
              <th>Return</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => (
              <HoldingRow key={h.id} holding={h} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
        {holdings.length === 0 && (
          <div className={styles.empty}>
            No holdings yet — add your first position.
          </div>
        )}
      </div>
    </div>
  );
}

function HoldingRow({ holding: h, onEdit }) {
  const val  = h.qty * h.current;
  const cost = h.qty * h.avg;
  const pnl  = val - cost;
  const pct  = cost > 0 ? (pnl / cost) * 100 : 0;
  const pos  = pnl >= 0;
  const tc   = TYPE_META[h.type] || TYPE_META.stock;

  return (
    <tr className={styles.row}>
      <td className={styles.left}>
        <div className={styles.tickerCell}>
          <div className={styles.icon} style={{ background: tc.bg, color: tc.color }}>
            {h.ticker.slice(0, 3)}
          </div>
          <div className={styles.tickerInfo}>
            <span className={styles.symbol}>{h.ticker}</span>
            <span className={styles.fullName}>{h.name}</span>
          </div>
        </div>
      </td>
      <td className={styles.num}>{h.qty}</td>
      <td className={styles.num}>{fmt(h.avg)}</td>
      <td className={styles.num}>{fmt(h.current)}</td>
      <td className={`${styles.num} ${styles.bold}`}>{fmt(val)}</td>
      <td className={styles.num}>
        <span style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>
          {pos ? '+' : '-'}{fmt(Math.abs(pnl))}
        </span>
      </td>
      <td className={styles.num}>
        <span className={`${styles.pill} ${pos ? styles.pillPos : styles.pillNeg}`}>
          {pos ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
        </span>
      </td>
      <td>
        <button
          className={styles.editBtn}
          onClick={() => onEdit(h)}
          title="Edit position"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M9.5 2.5a1.414 1.414 0 0 1 2 2L4 12H2v-2L9.5 2.5z"
              stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
}
