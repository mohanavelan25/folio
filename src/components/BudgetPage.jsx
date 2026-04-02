import { useState, useMemo, useEffect } from 'react';
import styles from './BudgetPage.module.css';

/* ── Persistent state hook ───────────────────────────────────────────────── */
function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage full or unavailable — fail silently
    }
  }, [key, state]);

  return [state, setState];
}

/* ── Categories (no icons) ───────────────────────────────────────────────── */
const CATS = [
  { id: 'housing',     label: 'Housing',     color: '#3ecfcf' },
  { id: 'bills',       label: 'Bills',       color: '#f5c842' },
  { id: 'needs',       label: 'Needs',       color: '#2dd4a0' },
  { id: 'wants',       label: 'Wants',       color: '#9b6dff' },
  { id: 'savings',     label: 'Savings',     color: '#60a5fa' },
  { id: 'investments', label: 'Investments', color: '#ff8c50' },
  { id: 'misc',        label: 'Misc',        color: '#f05a6e' },
];

/* ── Groups (50/30/20) ───────────────────────────────────────────────────── */
const GROUPS = [
  { id: 'needs',   label: 'Needs',   defaultPct: 50, color: '#3ecfcf', cats: ['housing', 'bills', 'needs'] },
  { id: 'wants',   label: 'Wants',   defaultPct: 30, color: '#9b6dff', cats: ['wants', 'misc'] },
  { id: 'savings', label: 'Savings', defaultPct: 20, color: '#60a5fa', cats: ['savings', 'investments'] },
];

const uid   = () => Math.random().toString(36).slice(2, 9);
const fmt   = n  => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const catOf = id => CATS.find(c => c.id === id) || CATS[0];

function alpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* Display only the day-of-month with ordinal suffix, e.g. "5th", "21st" */
function dayOrdinal(dateStr) {
  if (!dateStr) return null;
  const d   = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const v   = day % 100;
  const sfx = ['th', 'st', 'nd', 'rd'];
  return day + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
}

const DEFAULT_ITEMS = [
  { id: uid(), name: 'Rent',              catId: 'housing',     groupId: 'needs',   amount: '', due: '', paid: false, notes: '' },
  { id: uid(), name: 'Electricity Bill',  catId: 'bills',       groupId: 'needs',   amount: '', due: '', paid: false, notes: '' },
  { id: uid(), name: 'Groceries',         catId: 'needs',       groupId: 'needs',   amount: '', due: '', paid: false, notes: '' },
  { id: uid(), name: 'OTT Subscriptions', catId: 'wants',       groupId: 'wants',   amount: '', due: '', paid: false, notes: '' },
  { id: uid(), name: 'Dining Out',        catId: 'misc',        groupId: 'wants',   amount: '', due: '', paid: false, notes: '' },
  { id: uid(), name: 'Monthly SIP',       catId: 'investments', groupId: 'savings', amount: '', due: '', paid: false, notes: '' },
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function BudgetPage() {
  const [salary,      setSalary]      = useLocalStorage('budget_salary', '');
  const [items,       setItems]       = useLocalStorage('budget_items',  DEFAULT_ITEMS);
  const [pcts,        setPcts]        = useLocalStorage('budget_pcts',   { needs: 50, wants: 30, savings: 20 });
  const [addingGroup, setAddingGroup] = useState(null);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState({ name: '', catId: 'housing', amount: '', due: '', notes: '' });
  const [sortState,   setSortState]   = useState({
    needs:   { col: 'name', asc: true },
    wants:   { col: 'name', asc: true },
    savings: { col: 'name', asc: true },
  });

  const sal        = parseFloat(salary) || 0;
  const totalSpent = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalPaid  = items.filter(i => i.paid).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const paidCount  = items.filter(i => i.paid).length;

  /* ── Actions ── */
  function togglePaid(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, paid: !i.paid } : i));
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function startEdit(item) {
    setEditId(item.id);
    setForm({ name: item.name, catId: item.catId, amount: item.amount, due: item.due, notes: item.notes });
  }

  function saveEdit() {
    setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form } : i));
    setEditId(null);
  }

  function startAdd(groupId) {
    const group = GROUPS.find(g => g.id === groupId);
    setForm({ name: '', catId: group.cats[0], amount: '', due: '', notes: '' });
    setAddingGroup(groupId);
  }

  function submitAdd() {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { id: uid(), ...form, groupId: addingGroup, paid: false }]);
    setAddingGroup(null);
  }

  function toggleSort(groupId, col) {
    setSortState(prev => {
      const cur = prev[groupId];
      return { ...prev, [groupId]: { col, asc: cur.col === col ? !cur.asc : true } };
    });
  }

  return (
    <div className={styles.page}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroEyebrow}>Personal Finance</div>
          <h1 className={styles.heroTitle}>Budget Planner</h1>
          <p className={styles.heroSub}>Allocate your income across needs, wants &amp; savings</p>
        </div>
        <div className={styles.heroControls}>
          <div className={styles.controlGroup}>
            <label className={styles.ctrlLabel}>Monthly Income</label>
            <div className={styles.salWrap}>
              <span className={styles.salPrefix}>₹</span>
              <input
                type="number"
                className={styles.salInput}
                placeholder="0"
                value={salary}
                onChange={e => setSalary(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
      <div className={styles.statRow}>
        <StatCard label="Total Budgeted" value={fmt(totalSpent)}              sub={`${items.length} items`}               color="#e8edf2" />
        <StatCard label="Paid"           value={fmt(totalPaid)}               sub={`${paidCount} of ${items.length}`}     color="#2dd4a0" />
        <StatCard label="Unpaid"         value={fmt(totalSpent - totalPaid)}  sub={`${items.length - paidCount} pending`} color="#f05a6e" />
        {sal > 0 && (
          <StatCard
            label="Unallocated"
            value={fmt(sal - totalSpent)}
            sub={(sal - totalSpent) < 0 ? 'Over budget' : 'Left to allocate'}
            color={(sal - totalSpent) < 0 ? '#f05a6e' : '#3ecfcf'}
          />
        )}
        <div className={styles.progressCard}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>Payment progress</span>
            <span className={styles.progressPct}>
              {items.length > 0 ? Math.round((paidCount / items.length) * 100) : 0}%
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: items.length > 0 ? `${(paidCount / items.length) * 100}%` : '0%' }}
            />
          </div>
          <div className={styles.progressSub}>{paidCount} of {items.length} items cleared</div>
        </div>
      </div>

      {/* ── THREE TABLES ─────────────────────────────────────────────────── */}
      {GROUPS.map(group => (
        <BudgetSection
          key={group.id}
          group={group}
          items={items}
          sal={sal}
          pct={pcts[group.id]}
          onPctChange={val => setPcts(p => ({ ...p, [group.id]: Math.min(100, Math.max(0, val)) }))}
          sortState={sortState[group.id]}
          onToggleSort={col => toggleSort(group.id, col)}
          addingHere={addingGroup === group.id}
          editId={editId}
          form={form}
          setForm={setForm}
          onStartAdd={() => startAdd(group.id)}
          onSubmitAdd={submitAdd}
          onCancelAdd={() => setAddingGroup(null)}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditId(null)}
          onTogglePaid={togglePaid}
          onRemove={removeItem}
        />
      ))}

    </div>
  );
}

/* ── BudgetSection ───────────────────────────────────────────────────────── */
function BudgetSection({
  group, items, sal, pct, onPctChange,
  sortState, onToggleSort,
  addingHere, editId, form, setForm,
  onStartAdd, onSubmitAdd, onCancelAdd,
  onStartEdit, onSaveEdit, onCancelEdit,
  onTogglePaid, onRemove,
}) {
  const groupItems = items.filter(i => i.groupId === group.id);
  const groupCats  = CATS.filter(c => group.cats.includes(c.id));

  /* Sort */
  const { col: sortCol, asc: sortAsc } = sortState;
  const sorted = useMemo(() => {
    return [...groupItems].sort((a, b) => {
      let av, bv;
      if (sortCol === 'name')   { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      if (sortCol === 'amount') { av = parseFloat(a.amount) || 0; bv = parseFloat(b.amount) || 0; }
      if (sortCol === 'due')    { av = a.due || 'zzz'; bv = b.due || 'zzz'; }
      if (sortCol === 'status') { av = a.paid ? 1 : 0; bv = b.paid ? 1 : 0; }
      if (av < bv) return sortAsc ? -1 :  1;
      if (av > bv) return sortAsc ?  1 : -1;
      return 0;
    });
  }, [groupItems, sortCol, sortAsc]);

  /* Allocation math */
  const groupTotal   = groupItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const allocatedAmt = sal > 0 ? (sal * pct) / 100 : 0;
  const overBudget   = allocatedAmt > 0 && groupTotal > allocatedAmt;
  const fillPct      = allocatedAmt > 0 ? Math.min((groupTotal / allocatedAmt) * 100, 100) : 0;
  const leftover     = allocatedAmt - groupTotal;

  const SortIcon = ({ col }) => (
    <span className={styles.sortIcon}>
      {sortCol === col ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className={styles.section}>

      {/* Section header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLeft}>
          <div className={styles.sectionTitle} style={{ color: group.color }}>{group.label}</div>
          <div className={styles.sectionMeta}>
            {groupItems.length} item{groupItems.length !== 1 ? 's' : ''}
            {groupTotal > 0 && <> · <span style={{ color: '#e8edf2' }}>{fmt(groupTotal)}</span> spent</>}
            {allocatedAmt > 0 && (
              <span style={{ color: overBudget ? '#f05a6e' : '#2dd4a0', marginLeft: '0.4rem' }}>
                · {overBudget ? `over by ${fmt(Math.abs(leftover))}` : `${fmt(leftover)} remaining`}
              </span>
            )}
          </div>
        </div>

        <div className={styles.sectionRight}>
          {/* Allocation % */}
          <div className={styles.pctGroup}>
            <label className={styles.ctrlLabel}>Allocation</label>
            <div className={styles.pctWrap}>
              <input
                type="number"
                min="0"
                max="100"
                className={styles.pctInput}
                value={pct}
                onChange={e => onPctChange(+e.target.value)}
              />
              <span className={styles.pctSuffix}>%</span>
              {sal > 0 && <span className={styles.pctAmt}>{fmt(allocatedAmt)}</span>}
            </div>
          </div>

          <button className={styles.addBtn} onClick={onStartAdd}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Budget progress bar */}
      {allocatedAmt > 0 && (
        <div className={styles.budgetTrack}>
          <div
            className={styles.budgetFill}
            style={{ width: `${fillPct}%`, background: overBudget ? '#f05a6e' : group.color }}
          />
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCheck}></th>
              <th className={styles.thLeft} onClick={() => onToggleSort('name')}>
                Item <SortIcon col="name" />
              </th>
              <th>Category</th>
              <th onClick={() => onToggleSort('amount')}>
                Amount <SortIcon col="amount" />
              </th>
              <th onClick={() => onToggleSort('due')}>
                Due <SortIcon col="due" />
              </th>
              <th>Notes</th>
              <th onClick={() => onToggleSort('status')}>
                Status <SortIcon col="status" />
              </th>
              <th className={styles.thActions}></th>
            </tr>
          </thead>

          <tbody>
            {/* Add row */}
            {addingHere && (
              <tr className={styles.addRow}>
                <td></td>
                <td className={styles.tdLeft}>
                  <input
                    autoFocus
                    className={styles.inlineInput}
                    placeholder="Item name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') onSubmitAdd(); if (e.key === 'Escape') onCancelAdd(); }}
                  />
                </td>
                <td>
                  <select className={styles.inlineSelect} value={form.catId}
                    onChange={e => setForm(f => ({ ...f, catId: e.target.value }))}>
                    {groupCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </td>
                <td>
                  <input className={styles.inlineInput} type="number" placeholder="₹ 0"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </td>
                <td>
                  {/* Calendar date picker — only day is shown in display */}
                  <input className={styles.inlineInput} type="date"
                    value={form.due}
                    onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                  />
                </td>
                <td>
                  <input className={styles.inlineInput} placeholder="Optional note"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </td>
                <td></td>
                <td>
                  <div className={styles.rowActions}>
                    <button className={styles.saveRowBtn} onClick={onSubmitAdd}>Save</button>
                    <button className={styles.cancelRowBtn} onClick={onCancelAdd}>✕</button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {sorted.map(item => {
              const cat       = catOf(item.catId);
              const isEditing = editId === item.id;
              const amt       = parseFloat(item.amount) || 0;

              return (
                <tr key={item.id} className={`${styles.row} ${item.paid ? styles.rowPaid : ''}`}>

                  {/* Checkbox */}
                  <td className={styles.tdCheck}>
                    <button
                      className={styles.checkbox}
                      style={item.paid ? { background: cat.color, borderColor: cat.color } : {}}
                      onClick={() => onTogglePaid(item.id)}
                    >
                      {item.paid && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3.5 3.5L10 3" stroke="#040e0e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Name */}
                  <td className={styles.tdLeft}>
                    {isEditing
                      ? <input autoFocus className={styles.inlineInput} value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                        />
                      : <span className={styles.itemName} style={{ textDecoration: item.paid ? 'line-through' : 'none' }}>
                          {item.name}
                        </span>
                    }
                  </td>

                  {/* Category */}
                  <td>
                    {isEditing
                      ? <select className={styles.inlineSelect} value={form.catId}
                          onChange={e => setForm(f => ({ ...f, catId: e.target.value }))}>
                          {groupCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      : <span className={styles.catBadge} style={{ color: cat.color, background: alpha(cat.color, 0.12) }}>
                          {cat.label}
                        </span>
                    }
                  </td>

                  {/* Amount */}
                  <td className={styles.tdMono}>
                    {isEditing
                      ? <input className={styles.inlineInput} type="number" value={form.amount}
                          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                      : <span className={styles.amtCell} style={{ color: item.paid ? 'var(--muted)' : '#e8edf2' }}>
                          {amt > 0 ? fmt(amt) : <span className={styles.dimAmt}>—</span>}
                        </span>
                    }
                  </td>

                  {/* Due — calendar picker in edit; shows only day ordinal in display */}
                  <td className={styles.tdMono}>
                    {isEditing
                      ? <input className={styles.inlineInput} type="date" value={form.due}
                          onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
                      : item.due
                        ? <span className={styles.dueBadge}>{dayOrdinal(item.due)}</span>
                        : <span className={styles.dimAmt}>—</span>
                    }
                  </td>

                  {/* Notes */}
                  <td>
                    {isEditing
                      ? <input className={styles.inlineInput} value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                      : <span className={styles.noteText}>{item.notes || ''}</span>
                    }
                  </td>

                  {/* Status */}
                  <td>
                    <span className={styles.statusPill}
                      style={item.paid
                        ? { color: '#2dd4a0', background: 'rgba(45,212,160,0.12)' }
                        : { color: '#f5c842', background: 'rgba(245,200,66,0.1)' }
                      }
                    >
                      {item.paid ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    {isEditing
                      ? <div className={styles.rowActions}>
                          <button className={styles.saveRowBtn} onClick={onSaveEdit}>Save</button>
                          <button className={styles.cancelRowBtn} onClick={onCancelEdit}>✕</button>
                        </div>
                      : <div className={styles.rowActions}>
                          <button className={styles.editRowBtn} onClick={() => onStartEdit(item)} title="Edit">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                              <path d="M9.5 2.5a1.414 1.414 0 0 1 2 2L4 12H2v-2L9.5 2.5z"
                                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button className={styles.delRowBtn} onClick={() => onRemove(item.id)} title="Remove">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                              <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M11.5 3.5l-.72 8.05A1 1 0 0 1 9.78 12H4.22a1 1 0 0 1-1-.45L2.5 3.5"
                                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                    }
                  </td>

                </tr>
              );
            })}
          </tbody>

          {/* Footer totals */}
          {sorted.length > 0 && (
            <tfoot>
              <tr className={styles.footRow}>
                <td colSpan={3} className={styles.footLabel}>
                  {sorted.length} item{sorted.length !== 1 ? 's' : ''}
                </td>
                <td className={styles.footAmt}>
                  {fmt(sorted.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0))}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Empty state */}
        {sorted.length === 0 && !addingHere && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>—</div>
            <p>No {group.label.toLowerCase()} added yet.</p>
            <button className={styles.addBtn} style={{ marginTop: '0.75rem' }} onClick={onStartAdd}>
              Add your first item
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color }}>{value}</span>
      <span className={styles.statSub}>{sub}</span>
    </div>
  );
}
