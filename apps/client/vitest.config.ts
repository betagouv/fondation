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
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: false,
    },
  }),
);
