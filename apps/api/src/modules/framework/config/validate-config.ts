import { apiConfig, defaultApiConfig } from './config.constants';
import {
  DevApiConfig,
  DevApiConfigSchema,
  ProdApiConfig,
  ProdApiConfigSchema,
} from './config.schema';

export const validateConfig = (): DevApiConfig | ProdApiConfig => {
  return process.env.NODE_ENV === 'production'
    ? validateProdConfig()
    : validateDevConfig();
};

const validateProdConfig = (): ProdApiConfig =>
  ProdApiConfigSchema.parse(apiConfig);

const validateDevConfig = (): DevApiConfig =>
  DevApiConfigSchema.parse(defaultApiConfig);
