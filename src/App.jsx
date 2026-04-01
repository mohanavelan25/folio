import { useState } from 'react';
import './styles/global.css';
import { usePortfolio } from './hooks/usePortfolio';

import Navbar              from './components/Navbar';
import HeroSection         from './components/HeroSection';
import PortfolioChart      from './components/PortfolioChart';
import HoldingsTable       from './components/HoldingsTable';
import AllocationCard      from './components/AllocationCard';
import PerformanceCard     from './components/PerformanceCard';
import ActivityCard        from './components/ActivityCard';
import AddPositionModal    from './components/AddPositionModal';
import EditPositionModal   from './components/EditPositionModal';

import styles from './App.module.css';

export default function App() {
  const {
    holdings, activity,
    addHolding, removeHolding, editHolding, addTransaction,
    stats,
    priceStatus, lastUpdated, isMarket, refreshPrices,
  } = usePortfolio();

  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing,  setEditing]  = useState(null);   // the holding being edited
  const [range,    setRange]    = useState('3M');

  function handleOpenEdit(holding) {
    setEditing(holding);
    setEditOpen(true);
  }

  function handleCloseEdit() {
    setEditOpen(false);
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      <Navbar
        onAdd={() => setAddOpen(true)}
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

        {/* 2. Main Chart */}
        <div className={styles.chartContainer}>
          <PortfolioChart totalValue={stats.totalValue} range={range} />
        </div>

        {/* 3. Secondary Stats Row */}
        <div className={`${styles.cardGrid} anim-fade-slide-d2`}>
          <AllocationCard holdings={holdings} />
          <PerformanceCard stats={stats} />
          <ActivityCard activity={activity} />
        </div>

        {/* 4. Holdings Table */}
        <section className={`${styles.tableSection} anim-fade-slide-d3`}>
          <HoldingsTable
            holdings={holdings}
            onEdit={handleOpenEdit}
          />
        </section>
      </main>

      {/* Add position modal */}
      <AddPositionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addHolding}
      />

      {/* Edit position / add transaction modal */}
      <EditPositionModal
        open={editOpen}
        holding={editing}
        onClose={handleCloseEdit}
        onSave={editHolding}
        onRemove={removeHolding}
        onAddTransaction={addTransaction}
      />
    </div>
  );
}
