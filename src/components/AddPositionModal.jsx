import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMutualFund, searchStock, fetchSpotPrice } from '../hooks/usePortfolio';
import styles from './AddPositionModal.module.css';

const TYPES = [
  { value: 'stock',       label: 'Stock' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'bond',        label: 'Bond / FD' },
  { value: 'gold',        label: 'Gold / SGB' },
];

const EMPTY = {
  ticker: '', name: '', qty: '', avg: '', current: '', type: 'stock', schemeCode: '',
};

// Types that show a live search bar
const USES_STOCK_SEARCH = new Set(['stock', 'etf']);

export default function AddPositionModal({ open, onClose, onAdd }) {
  const [form,       setForm]       = useState(EMPTY);
  const [errors,     setErrors]     = useState({});

  // ── Shared search state ────────────────────────────────────────────────────
  const [query,      setQuery]      = useState('');        // text in search box
  const [results,    setResults]    = useState([]);        // dropdown items
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState(null);      // chosen result
  const [fetchingPx, setFetchingPx] = useState(false);     // fetching spot price

  const dropdownRef = useRef(null);

  const isMF         = form.type === 'mutual_fund';
  const isStockType  = USES_STOCK_SEARCH.has(form.type);
  const showSearch   = isMF || isStockType;

  // ── Reset when modal opens ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
      setQuery('');
      setResults([]);
      setSelected(null);
      setFetchingPx(false);
    }
  }, [open]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // ── Click outside dropdown → close it ─────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Reset search when type changes ────────────────────────────────────────
  const handleTypeChange = (newType) => {
    setForm({ ...EMPTY, type: newType });
    setQuery('');
    setResults([]);
    setSelected(null);
    setFetchingPx(false);
    setErrors({});
  };

  // ── Debounced search (stock or MF) ─────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();
    if (!showSearch || q.length < 2) { setResults([]); return; }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = isMF
          ? await searchMutualFund(q)
          : await searchStock(q);
        setResults((res || []).slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, isMF, showSearch]);

  // ── Auto-fetch NAV when MF schemeCode set ─────────────────────────────────
  useEffect(() => {
    if (!isMF || !form.schemeCode || form.schemeCode.length < 4) return;
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`https://api.mfapi.in/mf/${form.schemeCode}/latest`);
        const json = await res.json();
        const nav  = json?.data?.[0]?.nav;
        if (nav) setForm(f => ({ ...f, current: nav }));
      } catch { /* silent */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.schemeCode, isMF]);

  // ── Generic field setter ───────────────────────────────────────────────────
  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: false }));
  };

  // ── Pick a STOCK from dropdown ─────────────────────────────────────────────
  const selectStock = useCallback(async (result) => {
    setSelected(result);
    setQuery(result.name);   // show name in search box
    setResults([]);

    setForm(f => ({ ...f, ticker: result.ticker, name: result.name }));
    setErrors(er => ({ ...er, ticker: false, current: false }));

    // Fetch live price immediately
    setFetchingPx(true);
    try {
      const price = await fetchSpotPrice(result.ticker);
      if (price && price > 0) {
        setForm(f => ({ ...f, current: String(price) }));
      }
    } catch { /* silent */ }
    finally { setFetchingPx(false); }
  }, []);

  // ── Pick a MUTUAL FUND from dropdown ──────────────────────────────────────
  const selectMF = useCallback((result) => {
    const shortTicker = result.schemeName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(' ')[0]
      .toUpperCase()
      .slice(0, 8);

    setSelected(result);
    setQuery(result.schemeName);
    setResults([]);

    setForm(f => ({
      ...f,
      ticker:     shortTicker,
      name:       result.schemeName,
      schemeCode: String(result.schemeCode),
    }));
    setErrors(er => ({ ...er, schemeCode: false, ticker: false }));
  }, []);

  // ── Clear search selection ─────────────────────────────────────────────────
  const clearSearch = () => {
    setQuery('');
    setSelected(null);
    setResults([]);
    setForm(f => ({ ...f, ticker: '', name: '', schemeCode: '', current: '' }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.ticker.trim())                          errs.ticker     = true;
    if (!form.qty || +form.qty <= 0)                  errs.qty        = true;
    if (!form.avg || +form.avg <= 0)                  errs.avg        = true;
    if (!isMF && (!form.current || +form.current <= 0)) errs.current  = true;
    if (isMF && !form.schemeCode)                     errs.schemeCode = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;
    const currentPrice = form.current
      ? parseFloat(form.current)
      : (isMF ? parseFloat(form.avg) : 0);

    onAdd({
      ticker:     form.ticker.trim().toUpperCase(),
      name:       form.name.trim() || form.ticker.trim().toUpperCase(),
      qty:        parseFloat(form.qty),
      avg:        parseFloat(form.avg),
      current:    currentPrice,
      type:       form.type,
      ...(isMF && form.schemeCode ? { schemeCode: Number(form.schemeCode) } : {}),
    });
    onClose();
  };

  if (!open) return null;

  const previewVal = form.qty && form.current ? +form.qty * +form.current : null;
  const previewPnl = form.qty && form.avg && form.current
    ? +form.qty * (+form.current - +form.avg) : null;
  const previewPct = form.avg && form.current && +form.avg > 0
    ? ((+form.current - +form.avg) / +form.avg) * 100 : null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`${styles.modal} anim-scale-in`}>

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Position</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.formGrid}>

          {/* ── Asset Type ── */}
          <Field label="Asset Type" fullWidth>
            <div className={styles.typeGrid}>
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.typeBtn} ${form.type === t.value ? styles.typeBtnActive : ''}`}
                  onClick={() => handleTypeChange(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          {/* ══════════════════════════════════════════════════════════════════
              LIVE SEARCH — shown for Stock AND Mutual Fund
          ══════════════════════════════════════════════════════════════════ */}
          {showSearch && (
            <Field
              label={isMF ? 'Search Fund Name' : 'Search Stock'}
              fullWidth
              error={isMF ? errors.schemeCode : errors.ticker}
            >
              <div className={styles.searchWrap} ref={dropdownRef}>

                {/* Input row */}
                <div className={styles.searchRow}>
                  {/* Magnifier icon */}
                  <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>

                  <input
                    className={`${styles.searchInput} ${(isMF ? errors.schemeCode : errors.ticker) ? styles.inputErr : ''}`}
                    type="text"
                    placeholder={
                      isMF
                        ? 'e.g. Parag Parikh Flexi Cap…'
                        : 'e.g. Reliance, HDFC Bank, Infosys…'
                    }
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                  />

                  {/* Spinner while searching */}
                  {searching && (
                    <svg className={`${styles.inputSideIcon} ${styles.spinSvg}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 7A6 6 0 0 1 12.5 4M13 1v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}

                  {/* Clear button (shown when something is typed and not currently searching) */}
                  {!searching && query.length > 0 && (
                    <button type="button" className={`${styles.inputSideIcon} ${styles.clearBtn}`} onClick={clearSearch}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* ── Dropdown results ── */}
                {results.length > 0 && (
                  <ul className={styles.dropdown}>
                    {isMF
                      ? /* ── MF results ── */
                        results.map(r => (
                          <li key={r.schemeCode}>
                            <button type="button" className={styles.dropOption} onClick={() => selectMF(r)}>
                              <span className={styles.dropName}>{r.schemeName}</span>
                              <span className={styles.dropBadge}>#{r.schemeCode}</span>
                            </button>
                          </li>
                        ))
                      : /* ── Stock results ── */
                        results.map(r => (
                          <li key={r.symbol}>
                            <button type="button" className={styles.dropOption} onClick={() => selectStock(r)}>
                              <span className={styles.stockLeft}>
                                <span className={styles.dropTicker}>{r.ticker}</span>
                                <span className={styles.dropName}>{r.name}</span>
                              </span>
                              <span className={styles.dropBadge}>
                                {r.exchange === 'NSI' ? 'NSE' : r.exchange === 'BOM' ? 'BSE' : r.exchange}
                              </span>
                            </button>
                          </li>
                        ))
                    }
                  </ul>
                )}

                {/* ── No results message ── */}
                {!searching && query.trim().length >= 2 && results.length === 0 && !selected && (
                  <div className={styles.noResults}>
                    No results for "{query.trim()}"
                    {isStockType && <span> — try the full company name</span>}
                  </div>
                )}

                {/* ── Selected confirmation ── */}
                {selected && results.length === 0 && (
                  <div className={styles.selectedBadge}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isMF
                      ? `Scheme #${selected.schemeCode} selected`
                      : `${selected.ticker} · ${selected.exchange === 'NSI' ? 'NSE' : 'BSE'} selected`
                    }
                  </div>
                )}
              </div>
            </Field>
          )}

          {/* ── MF: Scheme Code (auto-filled, editable) ── */}
          {isMF && (
            <Field label="Scheme Code" error={errors.schemeCode}>
              <div className={styles.schemeCodeWrap}>
                <input
                  type="number"
                  placeholder="e.g. 122639"
                  value={form.schemeCode}
                  onChange={e => {
                    setForm(f => ({ ...f, schemeCode: e.target.value }));
                    setErrors(er => ({ ...er, schemeCode: false }));
                    if (selected && String(selected.schemeCode) !== e.target.value) setSelected(null);
                  }}
                  className={errors.schemeCode ? styles.inputErr : ''}
                />
                <a
                  href={`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query || form.name)}`}
                  target="_blank" rel="noreferrer"
                  className={styles.lookupLink}
                >
                  Look up ↗
                </a>
              </div>
              {errors.schemeCode && (
                <span className={styles.errMsg}>Required — used to fetch live NAV</span>
              )}
            </Field>
          )}

          {/* ── Ticker / Symbol ── */}
          <Field label={isMF ? 'Short Label' : 'Ticker Symbol'} error={errors.ticker}>
            <input
              type="text"
              placeholder={
                isMF         ? 'e.g. PPFAS (auto-filled)' :
                isStockType  ? 'Auto-filled when you pick from search' :
                               'e.g. SGOLD, FD-SBI'
              }
              value={form.ticker}
              onChange={set('ticker')}
              className={errors.ticker ? styles.inputErr : ''}
              readOnly={isStockType && !!selected}
              autoFocus={!showSearch}
            />
          </Field>

          {/* ── Full Name ── */}
          <Field label="Full Name">
            <input
              type="text"
              placeholder={showSearch ? 'Auto-filled from search' : 'e.g. Reliance Industries'}
              value={form.name}
              onChange={set('name')}
              readOnly={showSearch && !!selected}
            />
          </Field>

          {/* ── Quantity ── */}
          <Field label={isMF ? 'Units' : 'Quantity'} error={errors.qty}>
            <input
              type="number"
              placeholder="0"
              min="0.001"
              step="0.001"
              value={form.qty}
              onChange={set('qty')}
              className={errors.qty ? styles.inputErr : ''}
            />
          </Field>

          {/* ── Avg buy price ── */}
          <Field label={isMF ? 'Avg Buy NAV (₹)' : 'Avg Buy Price (₹)'} error={errors.avg}>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.avg}
              onChange={set('avg')}
              className={errors.avg ? styles.inputErr : ''}
            />
          </Field>

          {/* ── Current Price ── */}
          <Field
            label={isMF ? 'Current NAV (₹)' : 'Current Price (₹)'}
            error={!isMF && errors.current}
          >
            <div className={styles.priceRow}>
              <input
                type="number"
                placeholder={fetchingPx ? 'Fetching live price…' : '0.00'}
                min="0"
                step="0.01"
                value={form.current}
                onChange={set('current')}
                className={`${!isMF && errors.current ? styles.inputErr : ''} ${fetchingPx ? styles.dimmed : ''}`}
                readOnly={fetchingPx}
              />

              {/* Spinning "Fetching" indicator */}
              {fetchingPx && (
                <span className={styles.priceBadge}>
                  <svg className={styles.spinSvg} width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7A6 6 0 0 1 12.5 4M13 1v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Live
                </span>
              )}

              {/* Pulsing green dot after price fetched */}
              {!fetchingPx && selected && !isMF && form.current && (
                <span className={styles.priceBadgeLive}>
                  <span className={styles.liveDot} />
                  Live
                </span>
              )}
            </div>

            {isMF && (
              <span className={styles.hint}>Auto-fetched from MFAPI once scheme is selected</span>
            )}
            {isStockType && !selected && (
              <span className={styles.hint}>Select a stock above — price fills automatically</span>
            )}
          </Field>

        </div>{/* end formGrid */}

        {/* ── Live preview ── */}
        {previewVal !== null && (
          <div className={styles.preview}>
            <PreviewStat label="Market Value"
              value={`₹${Math.round(previewVal).toLocaleString('en-IN')}`}
            />
            <PreviewStat
              label="Unrealised P&L"
              value={`${previewPnl >= 0 ? '+' : ''}₹${Math.abs(Math.round(previewPnl)).toLocaleString('en-IN')}`}
              color={previewPnl >= 0 ? 'var(--green)' : 'var(--red)'}
            />
            <PreviewStat
              label="Return"
              value={`${previewPct >= 0 ? '+' : ''}${previewPct?.toFixed(2)}%`}
              color={previewPct >= 0 ? 'var(--green)' : 'var(--red)'}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Add to Portfolio
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function Field({ label, error, fullWidth, children }) {
  return (
    <div className={[styles.field, error ? styles.fieldErr : '', fullWidth ? styles.fullWidth : ''].filter(Boolean).join(' ')}>
      <label>{label}{error && <span className={styles.errDot}> *</span>}</label>
      {children}
    </div>
  );
}

function PreviewStat({ label, value, color }) {
  return (
    <div className={styles.previewStat}>
      <span className={styles.previewLabel}>{label}</span>
      <span className={styles.previewVal} style={{ color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}
