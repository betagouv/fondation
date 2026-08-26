import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    // Without this override vitest inherits the dev server cacheDir and two Vite
    // processes sharing a cache corrupt each other's optimized deps
    cacheDir: 'node_modules/.vitest',
    test: {
      globals: true,
      environment: 'jsdom',
      // Pins the suite to one zone, as the api does: without it TZ is unset, so a spec restoring
      // it writes the string "undefined" and leaves the rest of the worker in a broken zone
      env: { TZ: 'Etc/UTC' },
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: false,
    },
  }),
);
