import typia from 'typia';
import { ApiConfig } from '../nestia/api-config-schema';
import { DeepPartial } from 'typeorm';

export function validate(apiConfig: DeepPartial<ApiConfig>): ApiConfig {
  const validationResult = typia.validate<ApiConfig>(apiConfig);

  if (validationResult.success) return validationResult.data;
  else throw new Error(JSON.stringify(validationResult.errors));
}
