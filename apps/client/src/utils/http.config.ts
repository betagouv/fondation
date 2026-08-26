import type { CreateClientConfig } from '../generated/api/client/types';

import { httpAssert } from './http-exception';

export function getBaseUrl() {
  if (!import.meta.env.PROD) return '';
  return import.meta.env.VITE_API_URL;
}

export const LONG_RUNNING_ROUTES = [
  '/api/docs/v1/agendas/{agendaId}.pdf',
  '/api/docs/v1/official-reports/{officialReportId}.pdf',
  '/api/docs/v1/presentation-plans/{planId}.pdf',
  '/api/docs/v1/presentation-plans/{planId}/url',
  '/api/docs/v1/sessions/{sessionId}/agendas/{agendaId}',
  '/api/docs/v1/sessions/{sessionId}/official-reports/{officialReportId}',
  '/api/files/v1/{fileUrlId}',
  '/api/sessions/v2/{sessionId}/files.xlsx',
  '/api/sessions/v2/{sessionId}/files/missing-evaluations.xlsx',
] as const;

export function routeToPattern(route: string): RegExp {
  const source = route
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{[^}]+\\\}/g, '[^/?#]+')
    .replace(/\{[^}]+\}/g, '[^/?#]+');

  return new RegExp(`${source}(\\?|#|$)`);
}

const LONG_RUNNING_PATTERNS = LONG_RUNNING_ROUTES.map(routeToPattern);

/** @see https://heyapi.dev/openapi-ts/clients/fetch#runtime-api */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: getBaseUrl(),
  credentials: 'include',
  fetch: async (init) => {
    const url = typeof init === 'string' ? init : init instanceof URL ? init.toString() : init.url;
    const isLongRunningUrl = LONG_RUNNING_PATTERNS.some((pattern) => pattern.test(url));

    const isQuery =
      init instanceof URL || (typeof init !== 'string' && [undefined, 'GET'].includes(init.method));
    const timeout = isQuery && !isLongRunningUrl ? 10_000 : 60_000;

    const response = await globalThis.fetch(init, { signal: AbortSignal.timeout(timeout) });
    return httpAssert(response);
  },
  throwOnError: true,
});
