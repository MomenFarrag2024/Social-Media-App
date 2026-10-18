import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Optional dev proxy. If the browser blocks direct calls to the API (CORS),
    // set VITE_API_BASE_URL=/api-proxy in .env.local and restart `npm run dev`.
    proxy: {
      '/api-proxy': {
        target: 'https://route-posts.routemisr.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
    },
  },
});
