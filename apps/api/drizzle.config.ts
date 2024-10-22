import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema:
    './src/**/adapters/secondary/gateways/repositories/drizzle/schema/*.ts',
  out: './drizzle',
  breakpoints: false,
  strict: true,
});
