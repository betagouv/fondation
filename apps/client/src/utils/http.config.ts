import type { CreateClientConfig } from '../generated/api/client/types';
import { HttpException } from './http-exception';

const baseUrl = 'http://localhost:3000'; // import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';

/** @see https://heyapi.dev/openapi-ts/clients/fetch#runtime-api */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl,
  credentials: 'include',
  throwOnError: true,
  fetch: async (init) => {
    const response = await globalThis.fetch(init);
    if (!response.ok) throw new HttpException({ response });

    return response;
  }
});
