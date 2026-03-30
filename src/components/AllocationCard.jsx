import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { TYPE_META } from '../data/defaults';
import { fmt } from '../utils';
import styles from './AllocationCard.module.css';

ChartJS.register(ArcElement, Tooltip);

export default function AllocationCard({ holdings }) {
  const groups = useMemo(() => {
    const g = {};
    holdings.forEach(h => {
      g[h.type] = (g[h.type] || 0) + h.qty * h.current;
    });
    return g;
  }, [holdings]);

  const total = Object.values(groups).reduce((s, v) => s + v, 0);
  const keys   = Object.keys(groups);
  const vals   = keys.map(k => groups[k]);
  const colors = keys.map(k => TYPE_META[k]?.color || '#3ecfcf');

  const data = {
    datasets: [{
      data: vals,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#0e1318',
      hoverBorderColor: '#1c2630',
    }],
  };

  const options = {
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const key = keys[ctx.dataIndex];
            const pct = total > 0 ? ((vals[ctx.dataIndex] / total) * 100).toFixed(1) : 0;
            return `  ${TYPE_META[key]?.label || key}: ${pct}%  (${fmt(vals[ctx.dataIndex])})`;
          },
          title: () => '',
        },
        backgroundColor: '#141b22',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        bodyColor: '#e8edf2',
        bodyFont: { family: "'DM Mono', monospace", size: 12 },
        padding: 10,
        displayColors: false,
      },
    },
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Allocation</div>
      <div className={styles.donutWrap}>
        {holdings.length > 0
          ? <Doughnut data={data} options={options} />
          : <div className={styles.empty}>No data</div>
        }
        <div className={styles.center}>
          <span className={styles.centerVal}>{holdings.length}</span>
          <span className={styles.centerLbl}>Assets</span>
        </div>
      </div>
      <div className={styles.legend}>
        {keys.map((k, i) => {
          const pct = total > 0 ? ((vals[i] / total) * 100).toFixed(1) : 0;
          return (
            <div key={k} className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <div className={styles.dot} style={{ background: colors[i] }} />
                <span className={styles.legendName}>{TYPE_META[k]?.label || k}</span>
              </div>
              <span className={styles.legendPct}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
