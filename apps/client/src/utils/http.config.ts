import type { CreateClientConfig } from '../generated/api/client/types';

import { appVersion } from './app-version';
import { httpAssert } from './http-exception';

export function getBaseUrl() {
  if (!import.meta.env.PROD) return '';
  return import.meta.env.VITE_API_URL;
}

export const LONG_RUNNING_ROUTES = [
  '/api/docs/v1/agendas/{agendaId}.pdf',
  '/api/docs/v1/official-reports/{officialReportId}.pdf',
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

/** an upload lasts as long as the line is slow, whatever the server does: a video takes minutes */
export const UPLOAD_ROUTES = ['/api/help/v1/pages/{page}/screenshots'] as const;

const LONG_RUNNING_PATTERNS = LONG_RUNNING_ROUTES.map(routeToPattern);
const UPLOAD_PATTERNS = UPLOAD_ROUTES.map(routeToPattern);
// Node drops a request still arriving after 5 minutes (requestTimeout, left to its default by the API): to raise one, raise both
const UPLOAD_TIMEOUT_MS = 5 * 60_000;

export function timeoutFor(init: string | URL | Request): number {
  const url = typeof init === 'string' ? init : init instanceof URL ? init.toString() : init.url;
  if (UPLOAD_PATTERNS.some((pattern) => pattern.test(url))) return UPLOAD_TIMEOUT_MS;

  const isLongRunningUrl = LONG_RUNNING_PATTERNS.some((pattern) => pattern.test(url));
  const isQuery =
    init instanceof URL || (typeof init !== 'string' && [undefined, 'GET'].includes(init.method));

  return isQuery && !isLongRunningUrl ? 10_000 : 60_000;
}

/** @see https://heyapi.dev/openapi-ts/clients/fetch#runtime-api */
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: getBaseUrl(),
  credentials: 'include',
  fetch: async (init) => {
    const response = await globalThis.fetch(init, { signal: AbortSignal.timeout(timeoutFor(init)) });
    appVersion.observe(response);
    return httpAssert(response);
  },
  throwOnError: true,
});
