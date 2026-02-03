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
    const response = await globalThis.fetch(init);
    if (!response.ok) throw new HttpException({ response });

    return response;
  }
});
