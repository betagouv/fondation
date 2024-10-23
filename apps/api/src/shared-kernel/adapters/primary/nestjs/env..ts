import { DeepPartial } from 'typeorm';
import { ApiConfig } from '../nestia/api-config-schema';

export const apiConfig: DeepPartial<ApiConfig<true>> = {
  database: {
    url: process.env.DATABASE_URL,
  },
};

export const defaultApiConfig = {
  database: {
    host: 'localhost',
    port: 5440,
    user: 'fondation',
    password: 'secret',
    name: 'fondation',
  },
} satisfies ApiConfig<false>;
