import type { CreateClientConfig } from '../generated/api/client/types';

import { httpAssert } from './http-exception';

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
    const url = typeof init === 'string' ? init : init instanceof URL ? init.toString() : init.url;
    const isPdfGenerationUrl = /\/api\/docs\/v1\/.+\.pdf/.test(url);

    const isQuery =
      init instanceof URL || (typeof init !== 'string' && [undefined, 'GET'].includes(init.method));
    const timeout = isQuery && !isPdfGenerationUrl ? 10_000 : 60_000;

    const response = await globalThis.fetch(init, { signal: AbortSignal.timeout(timeout) });
    return httpAssert(response);
  },
});
