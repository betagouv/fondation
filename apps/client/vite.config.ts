import { resolve } from 'node:path';

import formatjs from '@formatjs/unplugin/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

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
      disable: !process.env.CI,
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
  css: { lightningcss: { errorRecovery: true } },
  // react-dsfr update-icons (predev / prestorybook hook) deletes node_modules/.vite:
  // keep the dev server cache out of its reach so launching storybook does not
  // corrupt a running dev server (predev clears this cache instead)
  cacheDir: 'node_modules/.vite-app',
  // TipTap is only reached through lazy routes: pre-bundling it avoids a mid-session
  // re-optimization (504 "Outdated Optimize Dep" on navigation). @tiptap/pm is
  // excluded because it only has subpath exports
  optimizeDeps: {
    include: Object.keys(pkg.dependencies).filter(
      (dep) => dep.startsWith('@tiptap/') && dep !== '@tiptap/pm',
    ),
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
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
      '@queries': resolve(import.meta.dirname, 'src/queries'),
      '@api': resolve(import.meta.dirname, 'src/generated/api'),
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
});
