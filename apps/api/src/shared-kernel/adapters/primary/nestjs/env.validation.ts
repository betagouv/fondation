import typia from 'typia';
import { ApiConfig } from '../nestia/api-config-schema';
import { PartialDeep } from 'type-fest';

export function validate<Prod extends boolean>(
  apiConfig: PartialDeep<ApiConfig<Prod>>,
) {
  if (process.env.NODE_ENV === 'production') {
    const validationResult = typia.validate<{ database: { url: string } }>(
      apiConfig,
    );

    if (validationResult.success) return validationResult.data;
    else throw new Error(JSON.stringify(validationResult.errors));
  } else {
    const validationResult = typia.validate<{
      database: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
      };
    }>(apiConfig);

    if (validationResult.success) return validationResult.data;
    else throw new Error(JSON.stringify(validationResult.errors));
  }
}
