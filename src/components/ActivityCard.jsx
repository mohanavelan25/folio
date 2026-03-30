import { fmt } from '../utils';
import styles from './ActivityCard.module.css';

const KIND_META = {
  buy:  { label: 'BUY',  cls: 'buy' },
  sell: { label: 'SELL', cls: 'sell' },
  div:  { label: 'DIV',  cls: 'div' },
};

export default function ActivityCard({ activity }) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>Recent Activity</div>
      {activity.slice(0, 5).map(a => (
        <ActivityItem key={a.id} item={a} />
      ))}
      {activity.length === 0 && (
        <p className={styles.empty}>No activity yet.</p>
      )}
    </div>
  );
}

function ActivityItem({ item: a }) {
  const meta = KIND_META[a.kind] || KIND_META.buy;
  const amount = a.amount ?? (a.qty != null && a.price != null ? a.qty * a.price : 0);
  const amtColor = a.kind === 'sell' ? 'var(--red)' : a.kind === 'div' ? 'var(--gold)' : 'var(--green)';
  const sign = a.kind === 'sell' ? '-' : '+';

  let subtitle = a.date;
  if (a.kind !== 'div' && a.qty && a.price) {
    subtitle = `${a.qty} shares @ ${fmt(a.price)} · ${a.date}`;
  }

  return (
    <div className={styles.item}>
      <div className={`${styles.icon} ${styles[meta.cls]}`}>{meta.label}</div>
      <div className={styles.info}>
        <div className={styles.actTitle}>
          {a.ticker}{a.kind === 'div' ? ' Dividend' : ''}
        </div>
        <div className={styles.sub}>{subtitle}</div>
      </div>
      <div className={styles.amount} style={{ color: amtColor }}>
        {sign}{fmt(amount)}
      </div>
    </div>
  );
}
