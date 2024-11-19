import { ApiConfig } from '../nestia/api-config-schema';

export const apiConfig: ApiConfig<true> = {
  port: 3000,
  database: {
    connectionString: process.env.DATABASE_URL!,
  },
  contextServices: {
    filesContext: {
      baseUrl: 'http://localhost',
      port: 3000,
    },
  },
};

export const defaultApiConfig = {
  port: 3000,
  database: {
    // env variable used by docker compose
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5440,
    user: 'fondation',
    password: 'secret',
    name: 'fondation',
  },
  contextServices: {
    filesContext: {
      baseUrl: 'http://localhost',
      port: 3000,
    },
  },
} satisfies ApiConfig<false>;
