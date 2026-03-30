export const TYPE_META = {
  stock:       { label: 'Stock',       color: '#3ecfcf', bg: 'rgba(62,207,207,0.14)' },
  mutual_fund: { label: 'Mutual Fund', color: '#9b6dff', bg: 'rgba(155,109,255,0.14)' },
  etf:         { label: 'ETF',         color: '#f5c842', bg: 'rgba(245,200,66,0.14)' },
  crypto:      { label: 'Crypto',      color: '#ff8c50', bg: 'rgba(255,140,80,0.14)' },
  bond:        { label: 'Bond / FD',   color: '#2dd4a0', bg: 'rgba(45,212,160,0.14)' },
  gold:        { label: 'Gold / SGB',  color: '#f05a6e', bg: 'rgba(240,90,110,0.14)' },
};

export const DEFAULT_HOLDINGS = [
  {
    id: 1, ticker: 'RELIANCE', name: 'Reliance Industries Ltd',
    qty: 25, avg: 2410, current: 2698, prevClose: 2671,
    type: 'stock', addedAt: '2024-01-15',
  },
  {
    id: 2, ticker: 'INFY', name: 'Infosys Ltd',
    qty: 50, avg: 1425, current: 1534, prevClose: 1518,
    type: 'stock', addedAt: '2024-02-03',
  },
  {
    id: 3, ticker: 'HDFCBANK', name: 'HDFC Bank Ltd',
    qty: 30, avg: 1580, current: 1612, prevClose: 1599,
    type: 'stock', addedAt: '2024-03-01',
  },
  {
    id: 4, ticker: 'NIFTY50', name: 'Nippon India Nifty 50 ETF',
    qty: 200, avg: 225, current: 248, prevClose: 245,
    type: 'etf', addedAt: '2024-03-10',
    // No schemeCode — ETFs use Yahoo Finance (.NS)
  },
  {
    id: 5, ticker: 'PPFAS', name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    qty: 100, avg: 68.5, current: 79.2, prevClose: 78.8,
    type: 'mutual_fund', addedAt: '2024-01-28',
    schemeCode: 122639,   // ← MFAPI scheme code — this is what drives live NAV fetch
  },
  {
    id: 6, ticker: 'SGOLD', name: 'Sovereign Gold Bond 2028',
    qty: 8, avg: 6200, current: 7140, prevClose: 7090,
    type: 'gold', addedAt: '2023-11-20',
  },
];

export const DEFAULT_ACTIVITY = [
  { id: 1, kind: 'buy',  ticker: 'RELIANCE', qty: 5,   price: 2698, amount: null, date: 'Today, 10:32 AM' },
  { id: 2, kind: 'div',  ticker: 'INFY',     qty: null, price: null, amount: 1250, date: 'Yesterday' },
  { id: 3, kind: 'sell', ticker: 'HDFCBANK', qty: 10,  price: 1612, amount: null, date: 'Mar 24' },
  { id: 4, kind: 'buy',  ticker: 'NIFTY50',  qty: 20,  price: 248,  amount: null, date: 'Mar 22' },
];

/*
  Common Indian MF scheme codes (MFAPI.in):
  ─────────────────────────────────────────────────────────────
  Parag Parikh Flexi Cap - Direct Growth          122639
  Mirae Asset Large Cap - Direct Growth           118834
  Axis Bluechip Fund - Direct Growth              120503
  HDFC Top 100 Fund - Direct Growth               100013
  SBI Small Cap Fund - Direct Growth              125497
  Quant Small Cap Fund - Direct Growth            120828
  Canara Robeco Emerging Equities - Direct        120594
  UTI Nifty 50 Index Fund - Direct Growth         120716
  Nippon India Index Fund Nifty 50 - Direct       118825
  DSP Nifty 50 Equal Weight Index - Direct        145552
  ICICI Pru Nifty Next 50 Index - Direct          120684
  Motilal Oswal Nasdaq 100 FOF - Direct           145255
  ─────────────────────────────────────────────────────────────
  Search any fund: https://api.mfapi.in/mf/search?q=<fund+name>
*/
