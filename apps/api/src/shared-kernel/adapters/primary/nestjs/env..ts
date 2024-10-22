import { DeepPartial } from 'typeorm';
import { ApiConfig } from '../nestia/api-config-schema';

export const apiConfig: DeepPartial<ApiConfig> = {
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
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
} satisfies ApiConfig;
