import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_HOLDINGS, DEFAULT_ACTIVITY } from "../data/defaults";

// ─── Storage keys ────────────────────────────────────────────────────────────
const STORAGE_KEY = "folio_holdings";
const ACTIVITY_KEY = "folio_activity";
const LAST_FETCH_KEY = "folio_last_fetch";

// ─── Config ──────────────────────────────────────────────────────────────────
const PROXY_BASE = "http://localhost:3001"; // set to '' if using direct fetch
const USE_PROXY = false; // flip to true when proxy is running
const REFRESH_MS = 60_000; // refresh every 60 seconds
const MARKET_OPEN_H = 9; // NSE opens at 09:15 IST
const MARKET_OPEN_M = 15;
const MARKET_CLOSE_H = 15; // NSE closes at 15:30 IST
const MARKET_CLOSE_M = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded */
  }
}

/**
 * Returns true if current IST time is within NSE market hours (Mon–Fri).
 */
function isMarketHours() {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const day = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;
  const open = MARKET_OPEN_H * 60 + MARKET_OPEN_M;
  const close = MARKET_CLOSE_H * 60 + MARKET_CLOSE_M;
  return mins >= open && mins <= close;
}

// ─── Price Fetchers ───────────────────────────────────────────────────────────

/**
 * Fetch a single NSE stock / ETF price via Yahoo Finance.
 *
 * Yahoo Finance appends exchange suffixes:
 *   .NS  → NSE (National Stock Exchange)
 *   .BO  → BSE (Bombay Stock Exchange)
 *
 * We try NSE first; on failure we fall back to BSE.
 *
 * When USE_PROXY = true  → hits your Express proxy at PROXY_BASE/api/price/:symbol
 * When USE_PROXY = false → calls Yahoo Finance directly (may have CORS issues in
 *                          some browsers; works fine in dev with Vite proxy or Node)
 */
async function fetchYahooPrice(ticker) {
  // Suffixes to try in order: NSE first, then BSE, then bare (for crypto/global)
  const suffixes = [".NS", ".BO", ""];
  for (const suffix of suffixes) {
    try {
      const symbol = `${ticker}${suffix}`;

      // In development Vite proxies /api/yf/chart → query1.finance.yahoo.com/v8/finance/chart
      // In production with USE_PROXY=true it hits your Express server
      // Otherwise it tries the direct URL (will fail in browser due to CORS — use proxy in prod)
      let url;
      if (USE_PROXY) {
        url = `${PROXY_BASE}/api/price/${encodeURIComponent(symbol)}`;
      } else {
        // Use the Vite dev-proxy path — works in `npm run dev`, no CORS
        url = `/api/yf/chart/${symbol}?interval=1d&range=1d&includePrePost=false`;
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const json = await res.json();

      if (USE_PROXY) {
        if (json.price != null) return json.price;
        continue;
      }

      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) continue;

      const price = meta.regularMarketPrice ?? meta.previousClose;
      if (price && price > 0) return price;
    } catch {
      // Try next suffix
    }
  }
  return null;
}

/**
 * Fetch the latest NAV for a mutual fund using MFAPI.in (free, no key needed).
 *
 * Each MF holding must have a `schemeCode` field, e.g.:
 *   PPFAS Flexi Cap  → 122639
 *   Nippon Nifty 50  → 118834
 *   HDFC Top 100     → 100013
 *
 * Find scheme codes at: https://api.mfapi.in/mf/search?q=<fund+name>
 *
 * MFAPI does NOT have CORS issues — it can be called directly from the browser.
 */
async function fetchMFNavPrice(schemeCode) {
  try {
    // MFAPI is CORS-friendly — no proxy needed for MF data
    const url = USE_PROXY
      ? `${PROXY_BASE}/api/mf/${schemeCode}`
      : `https://api.mfapi.in/mf/${schemeCode}/latest`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const json = await res.json();
    if (USE_PROXY) return json.nav ?? null;

    const nav = parseFloat(json?.data?.[0]?.nav);
    return isNaN(nav) ? null : nav;
  } catch {
    return null;
  }
}

/**
 * Fetch NAV history for a mutual fund (used to generate the portfolio chart).
 * Returns an array of { date: 'DD-MM-YYYY', nav: '123.45' } sorted newest first.
 */
export async function fetchMFHistory(schemeCode) {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Search mutual funds by name.
 * Returns: [{ schemeCode: number, schemeName: string }]
 *
 * Usage:
 *   const results = await searchMutualFund('parag parikh');
 *   // → [{ schemeCode: 122639, schemeName: 'Parag Parikh Flexi Cap Fund ...' }]
 */
export async function searchMutualFund(query) {
  try {
    const res = await fetch(
      `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Search NSE/BSE stocks, ETFs, and indices via Yahoo Finance symbol search.
 *
 * Returns an array of:
 * {
 *   symbol:    'RELIANCE.NS',        // full Yahoo symbol (strip .NS/.BO for display)
 *   ticker:    'RELIANCE',           // clean ticker without exchange suffix
 *   name:      'Reliance Industries Limited',
 *   exchange:  'NSI',                // NSI = NSE, BOM = BSE
 *   type:      'EQUITY' | 'ETF' | 'INDEX' | 'MUTUALFUND' etc.
 * }
 *
 * NOTE: Yahoo Finance search has CORS headers that allow browser requests,
 * but if you hit issues in production, route through your proxy:
 *   GET /api/search?q=RELIANCE → proxy to Yahoo
 */
export async function searchStock(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    // Vite dev-proxy: /api/yf/search → query1.finance.yahoo.com/v1/finance/search
    // This sidesteps CORS entirely during development.
    // In production, route through your Express proxy (USE_PROXY=true).
    const params = new URLSearchParams({
      q: query,
      quotesCount: "10",
      newsCount: "0",
      listsCount: "0",
      enableFuzzyQuery: "false",
      region: "IN",
      lang: "en-IN",
    });

    const url = USE_PROXY
      ? `${PROXY_BASE}/api/search?q=${encodeURIComponent(query)}`
      : `/api/yf/search?${params}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();

    const quotes = json?.quotes ?? [];

    // Yahoo exchange codes for India:
    //   NSI  = NSE equities/ETFs
    //   BOM  = BSE equities
    //   NSE  = NSE indices (NIFTY 50 etc.)
    const INDIAN_EXCHANGES = new Set(["NSI", "BOM", "NSE"]);
    // Quote types we care about (exclude MUTUALFUND — use MF tab for those)
    const VALID_TYPES = new Set(["EQUITY", "ETF", "INDEX", "FUTURE", "OPTION"]);

    return (
      quotes
        .filter(
          (q) =>
            INDIAN_EXCHANGES.has(q.exchange) && VALID_TYPES.has(q.quoteType),
        )
        .map((q) => {
          const cleanTicker = (q.symbol || "")
            .replace(/\.NS$|\.BO$/, "")
            .toUpperCase();
          return {
            symbol: q.symbol,
            ticker: cleanTicker,
            name: q.longname || q.shortname || cleanTicker,
            exchange: q.exchange,
            type: q.quoteType,
            sector: q.sector ?? null,
            industry: q.industry ?? null,
          };
        })
        // Deduplicate by clean ticker — NSE preferred over BSE
        .reduce((acc, cur) => {
          const existing = acc.find((a) => a.ticker === cur.ticker);
          if (!existing) {
            acc.push(cur);
          } else if (cur.exchange === "NSI" && existing.exchange !== "NSI") {
            // Replace BSE entry with NSE entry
            acc[acc.indexOf(existing)] = cur;
          }
          return acc;
        }, [])
        .slice(0, 8)
    );
  } catch (err) {
    console.error("[searchStock] failed:", err);
    return [];
  }
}

/**
 * Fetch the current price for a single stock ticker immediately.
 * Used to auto-fill the "Current Price" field when user picks from search results.
 *
 * Returns: number | null
 */
export async function fetchSpotPrice(ticker) {
  return fetchYahooPrice(ticker);
}

/**
 * Master price fetcher — dispatches to the right API based on asset type.
 *
 *  stock / etf / gold / bond / crypto  →  Yahoo Finance  (ticker field)
 *  mutual_fund                          →  MFAPI.in       (schemeCode field)
 *
 * Returns null on any error so callers can keep the last known price.
 */
async function fetchPriceForHolding(holding) {
  if (holding.type === "mutual_fund") {
    if (!holding.schemeCode) return null;
    return fetchMFNavPrice(holding.schemeCode);
  }
  return fetchYahooPrice(holding.ticker);
}

/**
 * Fetch live prices for all holdings concurrently.
 * Returns a map: { holdingId → price | null }
 *
 * Uses Promise.allSettled so one failure doesn't block the rest.
 */
async function fetchAllPrices(holdings) {
  const results = await Promise.allSettled(
    holdings.map((h) => fetchPriceForHolding(h)),
  );
  return Object.fromEntries(
    holdings.map((h, i) => [
      h.id,
      results[i].status === "fulfilled" ? results[i].value : null,
    ]),
  );
}

// ─── Derived statistics ───────────────────────────────────────────────────────

function computeStats(holdings) {
  const totalValue = holdings.reduce((s, h) => s + h.qty * h.current, 0);
  const totalCost = holdings.reduce((s, h) => s + h.qty * h.avg, 0);
  const totalPnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Day P&L: use prevClose if available (set after first live fetch), else seed-based estimate
  const dayPnl = holdings.reduce((s, h) => {
    if (h.prevClose && h.prevClose !== h.current) {
      return s + h.qty * (h.current - h.prevClose);
    }
    // Fallback: seeded deterministic value so UI doesn't flicker before first fetch
    const seed = (h.id * 9301 + 49297) % 233280;
    const factor = (seed / 233280 - 0.45) * 0.018;
    return s + h.qty * h.current * factor;
  }, 0);

  const dayPct = totalValue > 0 ? (dayPnl / totalValue) * 100 : 0;

  const sorted = [...holdings]
    .map((h) => ({
      ...h,
      _pct: h.avg > 0 ? ((h.current - h.avg) / h.avg) * 100 : 0,
    }))
    .sort((a, b) => b._pct - a._pct);

  return {
    totalValue,
    totalCost,
    totalPnl,
    pnlPct,
    dayPnl,
    dayPct,
    best: sorted[0] ?? null,
    worst: sorted[sorted.length - 1] ?? null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * usePortfolio
 *
 * Central state hook for the Folio investment tracker.
 *
 * Exposes:
 *   holdings       – array of holding objects
 *   activity       – array of activity events (buy/sell/div)
 *   stats          – computed portfolio statistics
 *   priceStatus    – 'idle' | 'loading' | 'success' | 'error'
 *   lastUpdated    – Date | null
 *   isMarket       – boolean, true during NSE market hours
 *   addHolding     – (holdingData) => void
 *   removeHolding  – (id) => void
 *   updateHolding  – (id, patch) => void
 *   overridePrice  – (id, price) => void
 *   addDividend    – (ticker, amount) => void
 *   refreshPrices  – () => Promise<void>  (manual refresh trigger)
 */
export function usePortfolio() {
  const [holdings, setHoldings] = useState(() =>
    load(STORAGE_KEY, DEFAULT_HOLDINGS),
  );
  const [activity, setActivity] = useState(() =>
    load(ACTIVITY_KEY, DEFAULT_ACTIVITY),
  );
  const [priceStatus, setPriceStatus] = useState("idle");
  const [lastUpdated, setLastUpdated] = useState(() => {
    const ts = localStorage.getItem(LAST_FETCH_KEY);
    return ts ? new Date(ts) : null;
  });
  const [isMarket, setIsMarket] = useState(isMarketHours);

  // Keep a ref to the latest holdings so the interval callback is always fresh
  const holdingsRef = useRef(holdings);
  holdingsRef.current = holdings;

  // ── Persist helpers ──────────────────────────────────────────────────────
  const persistHoldings = useCallback((next) => {
    setHoldings(next);
    save(STORAGE_KEY, next);
  }, []);

  const persistActivity = useCallback((next) => {
    setActivity(next);
    save(ACTIVITY_KEY, next);
  }, []);

  // ── Price refresh ────────────────────────────────────────────────────────
  const refreshPrices = useCallback(async () => {
    const current = holdingsRef.current;
    if (current.length === 0) return;

    setPriceStatus("loading");
    try {
      const priceMap = await fetchAllPrices(current);

      // Only update holdings where we got a valid new price
      const updated = current.map((h) => {
        const newPrice = priceMap[h.id];
        if (newPrice != null && newPrice > 0 && newPrice !== h.current) {
          return {
            ...h,
            current: newPrice,
            prevClose: h.current, // store previous value as prevClose for day P&L
          };
        }
        return h;
      });

      persistHoldings(updated);
      setPriceStatus("success");

      const now = new Date();
      setLastUpdated(now);
      save(LAST_FETCH_KEY, now.toISOString());
    } catch (err) {
      console.error("[usePortfolio] refreshPrices failed:", err);
      setPriceStatus("error");
    }
  }, [persistHoldings]);

  // ── Auto-refresh on mount + interval ────────────────────────────────────
  useEffect(() => {
    refreshPrices();

    const interval = setInterval(() => {
      if (isMarketHours()) refreshPrices();
    }, REFRESH_MS);

    const marketCheck = setInterval(() => {
      setIsMarket(isMarketHours());
    }, 60_000);

    return () => {
      clearInterval(interval);
      clearInterval(marketCheck);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const addHolding = useCallback(
    (holdingData) => {
      const newHolding = {
        ...holdingData,
        id: Date.now(),
        addedAt: new Date().toISOString().split("T")[0],
        prevClose: holdingData.current,
      };

      const newActivity = {
        id: Date.now() + 1,
        kind: "buy",
        ticker: holdingData.ticker,
        qty: holdingData.qty,
        price: holdingData.current,
        amount: null,
        date: "Just now",
      };

      const nextHoldings = [...holdingsRef.current, newHolding];
      persistHoldings(nextHoldings);
      persistActivity([newActivity, ...activity]);

      // Immediately fetch a live price for the new holding
      fetchPriceForHolding(newHolding).then((price) => {
        if (price && price > 0) {
          setHoldings((prev) => {
            const updated = prev.map((h) =>
              h.id === newHolding.id
                ? { ...h, current: price, prevClose: price }
                : h,
            );
            save(STORAGE_KEY, updated);
            return updated;
          });
        }
      });
    },
    [activity, persistHoldings, persistActivity],
  );

  function editHolding(id, updates) {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  }

  function addTransaction(tx, holdingId, updates) {
    // Prepend to activity feed
    setActivity((prev) => [tx, ...prev]);
    // Apply the position update (same as editHolding)
    setHoldings((prev) =>
      prev.map((h) => (h.id === holdingId ? { ...h, ...updates } : h)),
    );
  }

  const removeHolding = useCallback(
    (id) => {
      const holding = holdingsRef.current.find((h) => h.id === id);
      persistHoldings(holdingsRef.current.filter((h) => h.id !== id));

      if (holding) {
        const sellActivity = {
          id: Date.now(),
          kind: "sell",
          ticker: holding.ticker,
          qty: holding.qty,
          price: holding.current,
          amount: null,
          date: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
        };
        persistActivity([sellActivity, ...activity]);
      }
    },
    [activity, persistHoldings, persistActivity],
  );

  const updateHolding = useCallback(
    (id, patch) => {
      persistHoldings(
        holdingsRef.current.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      );
    },
    [persistHoldings],
  );

  /**
   * Manually override the current price for a holding.
   * Useful when live fetch fails and user wants to enter a price manually.
   */
  const overridePrice = useCallback(
    (id, price) => {
      updateHolding(id, { current: price, manualPrice: true });
    },
    [updateHolding],
  );

  /**
   * Add a dividend activity entry without changing holdings.
   */
  const addDividend = useCallback(
    (ticker, amount) => {
      const divActivity = {
        id: Date.now(),
        kind: "div",
        ticker,
        qty: null,
        price: null,
        amount,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      };
      persistActivity([divActivity, ...activity]);
    },
    [activity, persistActivity],
  );

  return {
    holdings,
    activity,
    stats: computeStats(holdings),
    priceStatus,
    lastUpdated,
    isMarket,
    addHolding,
    removeHolding,
    updateHolding,
    overridePrice,
    addDividend,
    refreshPrices,
    editHolding,
    addTransaction,
  };
}
