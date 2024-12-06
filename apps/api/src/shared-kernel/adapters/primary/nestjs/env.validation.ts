import {
  DevApiConfig,
  DevApiConfigSchema,
  ProdApiConfig,
  ProdApiConfigSchema,
} from '../zod/api-config-schema';

export const validateProdConfig = (apiConfig: ProdApiConfig): ProdApiConfig =>
  ProdApiConfigSchema.parse(apiConfig);

export const validateDevConfig = (apiConfig: DevApiConfig): DevApiConfig =>
  DevApiConfigSchema.parse(apiConfig);
