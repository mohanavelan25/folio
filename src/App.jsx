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
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      <Navbar
        onAdd={() => setModalOpen(true)}
        priceStatus={priceStatus}
        lastUpdated={lastUpdated}
        isMarket={isMarket}
        onRefresh={refreshPrices}
      />

      <main className={styles.main}>
        {/* 1. Portfolio Header Stats */}
        <HeroSection
          stats={stats}
          activeRange={range}
          onRangeChange={setRange}
        />

        {/* 2. Main Chart (Large/Long Version) */}
        <div className={styles.chartContainer}>
          <PortfolioChart
            totalValue={stats.totalValue}
            range={range}
          />
        </div>

        {/* 3. Secondary Stats Row (Allocation, Performance, Activity) */}
        <div className={`${styles.cardGrid} anim-fade-slide-d2`}>
          <AllocationCard holdings={holdings} />
          <PerformanceCard stats={stats} />
          <ActivityCard activity={activity} />
        </div>

        {/* 4. Detailed Holdings Table */}
        <section className={`${styles.tableSection} anim-fade-slide-d3`}>
          <HoldingsTable
            holdings={holdings}
            onRemove={removeHolding}
          />
        </section>
      </main>

      <AddPositionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addHolding}
      />
    </div>
  );
}