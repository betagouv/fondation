import type { CreateClientConfig } from '../generated/api/client/types';
import { HttpException } from './http-exception';

export function getBaseUrl() {
  if (!import.meta.env.PROD) return '';
  return import.meta.env.VITE_API_URL;
}

/** @see https://heyapi.dev/openapi-ts/clients/fetch#runtime-api */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: getBaseUrl(),
  credentials: 'include',
  throwOnError: true,
  fetch: async (init) => {
    const timeout =
      init instanceof URL || (typeof init !== 'string' && [undefined, 'GET'].includes(init.method))
        ? 10_000
        : 60_000;

    const response = await globalThis.fetch(init, {
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new HttpException({ response });

    return response;
  }
});
