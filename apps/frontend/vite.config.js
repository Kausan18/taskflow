import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    // Ensure PostCSS (Tailwind) processes all CSS files
    postcss: './postcss.config.js',
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy /api requests to the backend so CORS isn't an issue in dev
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});