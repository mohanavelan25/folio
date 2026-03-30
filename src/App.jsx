import { useState } from 'react';
import './styles/global.css';

import { usePortfolio } from './hooks/usePortfolio';

import Navbar           from './components/Navbar';
import HeroSection      from './components/HeroSection';
import PortfolioChart   from './components/PortfolioChart';
import HoldingsTable    from './components/HoldingsTable';
import AllocationCard   from './components/AllocationCard';
import PerformanceCard  from './components/PerformanceCard';
import ActivityCard     from './components/ActivityCard';
import AddPositionModal from './components/AddPositionModal';

import styles from './App.module.css';

export default function App() {
  const {
    holdings, activity,
    addHolding, removeHolding,
    stats,
    priceStatus, lastUpdated, isMarket, refreshPrices,
  } = usePortfolio();

  const [modalOpen, setModalOpen] = useState(false);
  const [range, setRange] = useState('3M');

  return (
    <>
      <Navbar
        onAdd={() => setModalOpen(true)}
        priceStatus={priceStatus}
        lastUpdated={lastUpdated}
        isMarket={isMarket}
        onRefresh={refreshPrices}
      />

      <main className={styles.main}>
        <HeroSection
          stats={stats}
          activeRange={range}
          onRangeChange={setRange}
        />

        <PortfolioChart
          totalValue={stats.totalValue}
          range={range}
        />

        <div className={`${styles.grid} anim-fade-slide-d2`}>
          <HoldingsTable
            holdings={holdings}
            onRemove={removeHolding}
          />

          <aside className={styles.sidebar}>
            <AllocationCard holdings={holdings} />
            <PerformanceCard stats={stats} />
            <ActivityCard activity={activity} />
          </aside>
        </div>
      </main>

      <AddPositionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addHolding}
      />
    </>
  );
}
