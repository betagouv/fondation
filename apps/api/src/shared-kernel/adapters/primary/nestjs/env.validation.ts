import typia from 'typia';
import { ApiConfig } from '../nestia/api-config-schema';
import { DeepPartial } from 'typeorm';

export function validate<Prod extends boolean>(
  apiConfig: DeepPartial<ApiConfig<Prod>>,
): ApiConfig<Prod> {
  const validationResult = typia.validate<ApiConfig<Prod>>(apiConfig);

  if (validationResult.success) return validationResult.data;
  else throw new Error(JSON.stringify(validationResult.errors));
}
