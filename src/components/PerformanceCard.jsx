import { fmt, fmtPct } from '../utils';
import styles from './PerformanceCard.module.css';

export default function PerformanceCard({ stats }) {
  const { best, worst, totalPnl, pnlPct } = stats;

  const bestPct  = best  ? ((best.current  - best.avg)  / best.avg)  * 100 : 0;
  const worstPct = worst ? ((worst.current - worst.avg) / worst.avg) * 100 : 0;

  return (
    <div className={styles.card}>
      <div className={styles.title}>Performance</div>

      <StatRow label="Best performer">
        {best
          ? <span className={styles.pos}>{best.ticker} ({bestPct >= 0 ? '+' : ''}{bestPct.toFixed(1)}%)</span>
          : <span className={styles.muted}>—</span>}
      </StatRow>

      <StatRow label="Worst performer">
        {worst
          ? <span className={styles.neg}>{worst.ticker} ({worstPct.toFixed(1)}%)</span>
          : <span className={styles.muted}>—</span>}
      </StatRow>

      <StatRow label="Total returns">
        <span className={totalPnl >= 0 ? styles.pos : styles.neg}>
          {totalPnl >= 0 ? '+' : '-'}{fmt(totalPnl)} ({fmtPct(pnlPct)})
        </span>
      </StatRow>

      <StatRow label="Portfolio beta">
        <span className={styles.neutral}>0.94</span>
      </StatRow>

      <StatRow label="Sharpe ratio">
        <span className={styles.neutral}>1.38</span>
      </StatRow>
    </div>
  );
}

function StatRow({ label, children }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      {children}
    </div>
  );
}
