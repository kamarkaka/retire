import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { publicMarketDataPlugin } from './scripts/market-data-gateway.ts';

export default defineConfig({
  plugins: [react(), publicMarketDataPlugin()],
  base: process.env.RETIRE_BASE_PATH || './',
  server: { port: 5173, strictPort: true },
  build: { target: 'es2022' },
  worker: { format: 'es' },
});
