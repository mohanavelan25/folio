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
        // Gradient logic remains same, it will now scale to the new height
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
        pointHoverRadius: 6, // Slightly larger for the bigger chart
        pointHoverBackgroundColor: '#3ecfcf',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // CRITICAL: allows chart to stretch vertically
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        // ... your existing tooltip config ...
      },
    },
    scales: {
      x: { display: false },
      y: { 
        display: false, 
        // Ensure the Y-axis range adjusts to the new data spread
        min: Math.min(...rawData) * 0.98 
      },
    },
  };

  return (
    /* Removed the 'inner' div as it often creates a second layer of size constraints */
    <div className={`${styles.wrap} anim-fade-slide-d1`}>
       <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
