import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El backend Express corre en el puerto 3000 (ver backend/src/server.js).
// En desarrollo proxeamos /api hacia el backend para evitar problemas de CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
