import { describe, expect, it } from 'vitest';

import sdk from '../generated/api/sdk.ts?raw';

import { PDF_GENERATION_ROUTES, routeToPattern } from './http.config';

describe('PDF_GENERATION_ROUTES', () => {
  it.each(PDF_GENERATION_ROUTES)('%s still exists in the generated sdk', (route) => {
    expect(sdk).toContain(`url: '${route}'`);
  });

  it.each([
    ['/api/docs/v1/agendas/abc.pdf', true],
    ['/api/docs/v1/agendas/abc.pdf?force=true', true],
    ['https://api.dev/api/docs/v1/sessions/s1/official-reports/o1', true],
    ['/api/docs/v1/presentation-plans/p1/url', true],
    ['/api/docs/v1/sessions/s1/agendas/a1/blocks', false],
    ['/api/docs/v1/sessions/s1/new-official-reports/agendas', false],
    ['/api/docs/v1/agendas/a1', false],
    ['/api/docs/v1/presentation-plans/p1/html', false],
  ])('matches %s: %s', (url, expected) => {
    const patterns = PDF_GENERATION_ROUTES.map(routeToPattern);
    expect(patterns.some((pattern) => pattern.test(url))).toBe(expected);
  });
});
