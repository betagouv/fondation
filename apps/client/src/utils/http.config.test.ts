import { describe, expect, it } from 'vitest';

import sdk from '../generated/api/sdk.ts?raw';

import { LONG_RUNNING_ROUTES, routeToPattern } from './http.config';

describe('LONG_RUNNING_ROUTES', () => {
  it.each(LONG_RUNNING_ROUTES)('%s still exists in the generated sdk', (route) => {
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
    ['/api/sessions/v2/s1/files.xlsx', true],
    ['/api/sessions/v2/s1/files/missing-evaluations.xlsx', true],
    ['/api/sessions/v2/s1/files', false],
  ])('matches %s: %s', (url, expected) => {
    const patterns = LONG_RUNNING_ROUTES.map(routeToPattern);
    expect(patterns.some((pattern) => pattern.test(url))).toBe(expected);
  });
});
