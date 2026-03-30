import { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { generateChartData } from '../utils';
import styles from './PortfolioChart.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function PortfolioChart({ totalValue, range }) {
  const chartRef = useRef(null);

  const { data: rawData, labels } = useMemo(
    () => generateChartData(totalValue, range),
    [totalValue, range]
  );

  const data = {
    labels,
    datasets: [
      {
        data: rawData,
        borderColor: '#3ecfcf',
        borderWidth: 2,
        fill: true,
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(62,207,207,0)';
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, 'rgba(62,207,207,0.22)');
          grad.addColorStop(1, 'rgba(62,207,207,0)');
          return grad;
        },
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#3ecfcf',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => '  ₹' + Math.round(ctx.parsed.y).toLocaleString('en-IN'),
          title: () => '',
        },
        backgroundColor: '#141b22',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        bodyColor: '#e8edf2',
        bodyFont: { family: "'DM Mono', monospace", size: 13 },
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: Math.min(...rawData) * 0.975 },
    },
  };

  return (
    <div className={`${styles.wrap} anim-fade-slide-d1`}>
      <div className={styles.inner}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
