import { defineConfig } from 'vitest/config';

const srcDir = new URL('./src/', import.meta.url).pathname;

export default defineConfig({
  oxc: { decorator: { emitDecoratorMetadata: true, legacy: true } },
  resolve: { alias: [{ find: /^src\//, replacement: srcDir }] },
  test: {
    name: 'unit',
    globals: true,
    environment: 'node',
    env: { TZ: 'Etc/UTC' },
    include: ['src/**/*.spec.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{spec,e2e-spec}.ts'],
      reportsDirectory: './coverage',
    },
  },
});
