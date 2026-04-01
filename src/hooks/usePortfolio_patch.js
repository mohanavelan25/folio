// ─────────────────────────────────────────────────────────────────────────────
// PATCH: Add these two functions inside usePortfolio() and include them in the
//        return object.  Place them alongside the existing addHolding /
//        removeHolding functions.
// ─────────────────────────────────────────────────────────────────────────────

// 1. Edit an existing holding's qty / avg / current in-place
function editHolding(id, updates) {
  setHoldings(prev =>
    prev.map(h => h.id === id ? { ...h, ...updates } : h)
  );
}

// 2. Record a new transaction AND update the affected holding in one step.
//    `tx`      — the activity row  { id, kind, ticker, qty, price, amount, date }
//    `holdingId` — id of the holding to patch
//    `updates` — { qty, avg, current } computed by EditPositionModal
function addTransaction(tx, holdingId, updates) {
  // Prepend to activity feed
  setActivity(prev => [tx, ...prev]);
  // Apply the position update (same as editHolding)
  setHoldings(prev =>
    prev.map(h => h.id === holdingId ? { ...h, ...updates } : h)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Make sure your return statement includes both new functions:
//
// return {
//   holdings, activity,
//   addHolding, removeHolding,
//   editHolding,        // ← add
//   addTransaction,     // ← add
//   stats,
//   priceStatus, lastUpdated, isMarket, refreshPrices,
// };
// ─────────────────────────────────────────────────────────────────────────────
