# Folio — Personal Investment Tracker

A cinematic, dark-mode investment tracker built with React + Vite, inspired by the Scope media player's aesthetic.

![Folio Preview](https://placeholder.com/folio-preview)

## Tech Stack

| Layer      | Technology                         |
|------------|-------------------------------------|
| Framework  | React 18 + Vite 5                  |
| Charts     | Chart.js 4 + react-chartjs-2       |
| Styling    | CSS Modules + CSS custom properties |
| Storage    | localStorage (no backend needed)   |
| Fonts      | Sora (display) + DM Mono (numeric) |

## Features

- **Portfolio hero** — total value, day P&L, invested amount, returns %
- **Interactive area chart** — 1W / 1M / 3M / 1Y / ALL time ranges
- **Holdings table** — per-asset P&L, return %, mini sparklines, remove button
- **Allocation donut** — grouped by asset type (Stock, MF, ETF, Crypto, Bond, Gold)
- **Performance card** — best/worst performer, total returns, beta, Sharpe ratio
- **Activity feed** — BUY / SELL / DIV entries
- **Add Position modal** — live P&L preview as you type, form validation
- **Persistent storage** — portfolio saved to `localStorage`, survives refresh
- **Responsive** — adapts to tablet and mobile

## Getting Started

```bash
# 1. Install dependencies
npm install        # or: bun install / pnpm install

# 2. Start dev server
npm run dev        # → http://localhost:5173

# 3. Build for production
npm run build
npm run preview
```

## Project Structure

```
folio/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx               # React entry
    ├── App.jsx                # Root layout + modal state
    ├── App.module.css
    ├── utils.js               # fmt, fmtPct, sparkPath, generateChartData
    ├── data/
    │   └── defaults.js        # Sample holdings, TYPE_META, DEFAULT_ACTIVITY
    ├── hooks/
    │   ├── usePortfolio.js    # State, localStorage, derived stats
    │   └── useClock.js        # Live clock
    └── components/
        ├── Navbar             # Sticky nav + Add button
        ├── HeroSection        # Portfolio value + time range picker
        ├── PortfolioChart     # Line chart (react-chartjs-2)
        ├── HoldingsTable      # Asset rows with sparklines
        ├── AllocationCard     # Donut chart + legend
        ├── PerformanceCard    # Stats panel
        ├── ActivityCard       # BUY/SELL/DIV feed
        └── AddPositionModal   # Form modal with live preview
```

## Adding Real Price Data

To hook up live prices, replace the `current` field updates in `usePortfolio.js`. 
Options for Indian markets:
- **Yahoo Finance** — `https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS`
- **NSE India** unofficial endpoints
- **Groww / Zerodha Kite API** for brokerage-linked data

## Customisation

All design tokens live in `src/styles/global.css` as CSS custom properties:
```css
--accent:  #3ecfcf;   /* teal highlight */
--green:   #2dd4a0;   /* positive P&L */
--red:     #f05a6e;   /* negative P&L */
--gold:    #f5c842;   /* dividends */
```

## License
MIT
