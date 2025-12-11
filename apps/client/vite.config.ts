import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

process.env.VITE_FAVICON = process.env.VITE_DEPLOY_ENV === 'production' ? 'favicon' : 'favicon.staging';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['shared-models']
  },
  build: {
    commonjsOptions: {
      include: [/shared-models/, /node_modules/]
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
