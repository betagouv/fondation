import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: { TZ: 'Etc/UTC' },
    fileParallelism: false,
    globalSetup: ['./vitest.globalSetup.ts'],
    setupFiles: [],
    include: ['src/specs/*.e2e-spec.ts'],
    coverage: { reportsDirectory: './coverage' },
  },
});
