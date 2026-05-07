import { resolve } from 'node:path';

import formatjs from '@formatjs/unplugin/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

process.env.VITE_FAVICON = process.env.VITE_DEPLOY_ENV === 'production' ? 'favicon' : 'favicon.staging';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: 'betagouv',
      project: 'fondation-client',
      url: 'https://sentry.incubateur.net/',
      release: {
        name: [`fondation-client`, process.env.VITE_TAGGED_VERSION].filter((x) => !!x?.trim()).join('@'),
        inject: true,
      },
      sourcemaps: {
        disable: !process.env.CI,
        filesToDeleteAfterUpload: ['./**/*.map', './dist/**/*.d.ts'],
      },
    }),
    formatjs({ ast: true }),
  ],
  optimizeDeps: {
    include: ['shared-models'],
  },
  build: {
    commonjsOptions: {
      include: [/shared-models/, /node_modules/],
    },

    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@queries': resolve(__dirname, 'src/queries'),
      '@api': resolve(__dirname, 'src/generated/api'),
      '@': resolve(__dirname, 'src'),
    },
  },
});
