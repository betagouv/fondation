import {
  apiConfig,
  defaultApiConfig,
} from 'src/shared-kernel/adapters/primary/nestjs/env';
import {
  DevApiConfig,
  DevApiConfigSchema,
  ProdApiConfig,
  ProdApiConfigSchema,
} from '../zod/api-config-schema';

export const validateConfig = (): DevApiConfig | ProdApiConfig => {
  return process.env.NODE_ENV === 'production'
    ? validateProdConfig()
    : validateDevConfig();
};

const validateProdConfig = (): ProdApiConfig =>
  ProdApiConfigSchema.parse(apiConfig);

const validateDevConfig = (): DevApiConfig =>
  DevApiConfigSchema.parse(defaultApiConfig);
