import { ApiConfig } from '../nestia/api-config-schema';
import { PartialDeep } from 'type-fest';

export const apiConfig: PartialDeep<ApiConfig<true>> = {
  database: {
    connectionString: process.env.DATABASE_URL,
  },
};

export const defaultApiConfig = {
  database: {
    // env variable used by docker compose
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5440,
    user: 'fondation',
    password: 'secret',
    name: 'fondation',
  },
} satisfies ApiConfig<false>;
