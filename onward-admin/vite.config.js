import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin talks to the SAME backend API as the customer frontend, so changes
// made here (banners, KYC, wallet, games…) are reflected on the frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_API_PROXY || 'http://localhost:4000', changeOrigin: true },
    },
  },
});
