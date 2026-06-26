import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { decorator: { emitDecoratorMetadata: true, legacy: true } },
  test: {
    globals: true,
    environment: 'node',
    env: { TZ: 'Etc/UTC' },
    fileParallelism: false,
    globalSetup: ['./vitest.globalSetup.ts'],
    coverage: {
      reportsDirectory: './coverage',
    },
  },
});
