import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth':      { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/issues':    { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/admin':     { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/dept':      { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/meta':      { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/lostfound': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads':   { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios:  ['axios'],
        },
      },
    },
  },
});
