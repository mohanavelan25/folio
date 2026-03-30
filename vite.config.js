import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // ── Yahoo Finance search  (GET /api/yf/search?q=reliance)
      '/api/yf/search': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/yf\/search/, '/v1/finance/search'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Yahoo requires a browser-like User-Agent
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            proxyReq.setHeader('Accept', 'application/json');
          });
        },
      },

      // ── Yahoo Finance chart / price  (GET /api/yf/chart/RELIANCE.NS)
      '/api/yf/chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/yf\/chart/, '/v8/finance/chart'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            proxyReq.setHeader('Accept', 'application/json');
          });
        },
      },
    },
  },
})
