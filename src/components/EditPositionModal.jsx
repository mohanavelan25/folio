import { useState, useEffect } from 'react';
import { TYPE_META } from '../data/defaults';
import { fmt } from '../utils';
import styles from './EditPositionModal.module.css';

const TX_TYPES = [
  { key: 'buy',  label: 'BUY',  cls: 'buy' },
  { key: 'sell', label: 'SELL', cls: 'sell' },
  { key: 'div',  label: 'DIV',  cls: 'div' },
];

export default function EditPositionModal({ open, holding, onClose, onSave, onRemove, onAddTransaction }) {
  const [tab, setTab] = useState('edit'); // 'edit' | 'transaction'

  /* ── Edit fields ── */
  const [qty,     setQty]     = useState('');
  const [avg,     setAvg]     = useState('');
  const [current, setCurrent] = useState('');

  /* ── Transaction fields ── */
  const [txType,  setTxType]  = useState('buy');
  const [txQty,   setTxQty]   = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txAmt,   setTxAmt]   = useState('');
  const [txDate,  setTxDate]  = useState('');

  /* ── Sync when holding changes ── */
  useEffect(() => {
    if (holding) {
      setQty(String(holding.qty));
      setAvg(String(holding.avg));
      setCurrent(String(holding.current));
      setTab('edit');
      setTxType('buy');
      setTxQty('');
      setTxPrice('');
      setTxAmt('');
      setTxDate('');
    }
  }, [holding]);

  if (!open || !holding) return null;

  const tc       = TYPE_META[holding.type] || TYPE_META.stock;
  const val      = holding.qty * holding.current;
  const cost     = holding.qty * holding.avg;
  const pnl      = val - cost;
  const pnlPct   = cost > 0 ? (pnl / cost) * 100 : 0;
  const pos      = pnl >= 0;

  /* ── Preview for edit tab ── */
  const previewQty  = parseFloat(qty)     || 0;
  const previewAvg  = parseFloat(avg)     || 0;
  const previewCur  = parseFloat(current) || 0;
  const previewVal  = previewQty * previewCur;
  const previewCost = previewQty * previewAvg;
  const previewPnl  = previewVal - previewCost;
  const previewPos  = previewPnl >= 0;

  /* ── Preview for transaction tab ── */
  const parsedTxQty   = parseFloat(txQty)   || 0;
  const parsedTxPrice = parseFloat(txPrice) || 0;
  const parsedTxAmt   = parseFloat(txAmt)   || 0;
  const txTotal       = txType === 'div' ? parsedTxAmt : parsedTxQty * parsedTxPrice;

  let newQty = holding.qty;
  let newAvg = holding.avg;
  if (txType === 'buy' && parsedTxQty > 0 && parsedTxPrice > 0) {
    newQty = holding.qty + parsedTxQty;
    newAvg = (holding.qty * holding.avg + parsedTxQty * parsedTxPrice) / newQty;
  } else if (txType === 'sell' && parsedTxQty > 0) {
    newQty = Math.max(0, holding.qty - parsedTxQty);
  }

  /* ── Handlers ── */
  function handleSave() {
    const updates = {
      qty:     parseFloat(qty)     || holding.qty,
      avg:     parseFloat(avg)     || holding.avg,
      current: parseFloat(current) || holding.current,
    };
    onSave(holding.id, updates);
    onClose();
  }

  function handleAddTx() {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const dateStr = txDate || `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const tx = {
      id:     Date.now(),
      kind:   txType,
      ticker: holding.ticker,
      qty:    txType !== 'div' ? parsedTxQty   : null,
      price:  txType !== 'div' ? parsedTxPrice : null,
      amount: txType === 'div' ? parsedTxAmt   : null,
      date:   dateStr,
    };

    // Update the holding too
    const updates = {
      qty:     newQty,
      avg:     parseFloat(newAvg.toFixed(2)),
      current: holding.current,
    };

    onAddTransaction(tx, holding.id, updates);
    onClose();
  }

  const canSave = parseFloat(qty) > 0 && parseFloat(avg) > 0 && parseFloat(current) > 0;
  const canAddTx = txType === 'div'
    ? parsedTxAmt > 0
    : parsedTxQty > 0 && parsedTxPrice > 0 && (txType !== 'sell' || parsedTxQty <= holding.qty);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.icon} style={{ background: tc.bg, color: tc.color }}>
              {holding.ticker.slice(0, 3)}
            </div>
            <div>
              <div className={styles.modalTitle}>{holding.ticker}</div>
              <div className={styles.modalSub}>{holding.name}</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Current snapshot ── */}
        <div className={styles.snapshot}>
          <div className={styles.snapItem}>
            <span className={styles.snapLabel}>Value</span>
            <span className={styles.snapVal}>{fmt(val)}</span>
          </div>
          <div className={styles.snapItem}>
            <span className={styles.snapLabel}>Invested</span>
            <span className={styles.snapVal}>{fmt(cost)}</span>
          </div>
          <div className={styles.snapItem}>
            <span className={styles.snapLabel}>P&amp;L</span>
            <span className={styles.snapVal} style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>
              {pos ? '+' : '-'}{fmt(Math.abs(pnl))}
            </span>
          </div>
          <div className={styles.snapItem}>
            <span className={styles.snapLabel}>Return</span>
            <span className={styles.snapVal} style={{ color: pos ? 'var(--green)' : 'var(--red)' }}>
              {pos ? '+' : ''}{pnlPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div className={styles.tabs}>
          <button
            className={tab === 'edit' ? styles.tabActive : styles.tab}
            onClick={() => setTab('edit')}
          >
            Edit Position
          </button>
          <button
            className={tab === 'transaction' ? styles.tabActive : styles.tab}
            onClick={() => setTab('transaction')}
          >
            Add Transaction
          </button>
        </div>

        {/* ══════════════════════════════ EDIT TAB ══════════════════════════════ */}
        {tab === 'edit' && (
          <>
            <div className={styles.formGrid}>
              <Field label="Quantity">
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder={String(holding.qty)}
                />
              </Field>
              <Field label="Avg Cost (₹)">
                <input
                  type="number"
                  value={avg}
                  onChange={e => setAvg(e.target.value)}
                  placeholder={String(holding.avg)}
                />
              </Field>
              <Field label="Current Price (₹)" full>
                <input
                  type="number"
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  placeholder={String(holding.current)}
                />
              </Field>
            </div>

            {/* Preview */}
            <div className={styles.preview}>
              <div className={styles.prevItem}>
                <span className={styles.prevLabel}>New Value</span>
                <span className={styles.prevVal}>{fmt(previewVal)}</span>
              </div>
              <div className={styles.prevItem}>
                <span className={styles.prevLabel}>New P&amp;L</span>
                <span className={styles.prevVal} style={{ color: previewPos ? 'var(--green)' : 'var(--red)' }}>
                  {previewPos ? '+' : '-'}{fmt(Math.abs(previewPnl))}
                </span>
              </div>
              <div className={styles.prevItem}>
                <span className={styles.prevLabel}>New Cost</span>
                <span className={styles.prevVal}>{fmt(previewCost)}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.deleteBtn} onClick={() => { onRemove(holding.id); onClose(); }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M11.5 3.5l-.72 8.05A1 1 0 0 1 9.78 12H4.22a1 1 0 0 1-1-.45L2.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Remove
              </button>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.saveBtn} disabled={!canSave} onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════ TRANSACTION TAB ══════════════════════════════ */}
        {tab === 'transaction' && (
          <>
            {/* Type pills */}
            <div className={styles.txTypeRow}>
              {TX_TYPES.map(t => (
                <button
                  key={t.key}
                  className={`${styles.txPill} ${styles[t.cls]} ${txType === t.key ? styles.txPillActive : ''}`}
                  onClick={() => setTxType(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className={styles.formGrid}>
              {txType === 'div' ? (
                <Field label="Dividend Amount (₹)" full>
                  <input
                    type="number"
                    value={txAmt}
                    onChange={e => setTxAmt(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
              ) : (
                <>
                  <Field label="Quantity">
                    <input
                      type="number"
                      value={txQty}
                      onChange={e => setTxQty(e.target.value)}
                      placeholder="0"
                    />
                    {txType === 'sell' && parsedTxQty > holding.qty && (
                      <span className={styles.errMsg}>Exceeds held qty ({holding.qty})</span>
                    )}
                  </Field>
                  <Field label="Price per unit (₹)">
                    <input
                      type="number"
                      value={txPrice}
                      onChange={e => setTxPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </Field>
                </>
              )}
              <Field label="Date (optional)" full>
                <input
                  type="text"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  placeholder={`Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                />
              </Field>
            </div>

            {/* Transaction preview */}
            {txType !== 'div' && (
              <div className={styles.preview}>
                <div className={styles.prevItem}>
                  <span className={styles.prevLabel}>Total</span>
                  <span className={styles.prevVal}>{fmt(txTotal)}</span>
                </div>
                <div className={styles.prevItem}>
                  <span className={styles.prevLabel}>New Qty</span>
                  <span className={styles.prevVal}>{newQty}</span>
                </div>
                {txType === 'buy' && (
                  <div className={styles.prevItem}>
                    <span className={styles.prevLabel}>New Avg</span>
                    <span className={styles.prevVal}>{fmt(newAvg)}</span>
                  </div>
                )}
              </div>
            )}
            {txType === 'div' && parsedTxAmt > 0 && (
              <div className={styles.divPreview}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="var(--gold)" strokeWidth="1.4"/>
                  <path d="M7 4v3l2 1.5" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                Dividend of {fmt(parsedTxAmt)} will be logged to activity
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.saveBtn} disabled={!canAddTx} onClick={handleAddTx}>
                Record Transaction
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

/* ── Tiny helper ── */
function Field({ label, children, full }) {
  return (
    <div className={`${styles.field} ${full ? styles.fullWidth : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
