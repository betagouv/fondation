import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    // Two Vite processes sharing node_modules/.vite corrupt each other's optimized deps
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
