import { defineConfig, TestProjectConfiguration } from 'vitest/config';

const srcDir = new URL('./src/', import.meta.url).pathname;

const shared: TestProjectConfiguration = {
  oxc: { decorator: { emitDecoratorMetadata: true, legacy: true } },
  resolve: { alias: [{ find: /^src\//, replacement: srcDir }] },
  test: { globals: true, environment: 'node', env: { TZ: 'Etc/UTC' } },
};

export default defineConfig({
  ...shared,
  test: {
    ...shared.test,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{spec,e2e-spec}.ts'],
      reportsDirectory: './coverage',
    },
    projects: [
      {
        ...shared,
        test: {
          ...shared.test,
          name: 'unit',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/**/*.e2e-spec.ts'],
        },
      },
      {
        ...shared,
        test: {
          ...shared.test,
          name: 'e2e',
          include: ['{src,cli}/**/*.e2e-spec.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});
