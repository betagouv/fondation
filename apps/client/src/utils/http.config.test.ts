import { describe, expect, it } from 'vitest';

import sdk from '../generated/api/sdk.ts?raw';

import { LONG_RUNNING_ROUTES, routeToPattern, timeoutFor, UPLOAD_ROUTES } from './http.config';

describe('timeoutFor', () => {
  it('gives a reading ten seconds, a writing a minute and an upload five minutes', () => {
    expect(timeoutFor(new Request('https://api.dev/api/sessions/v2/s1/files'))).toBe(10_000);
    expect(timeoutFor(new Request('https://api.dev/api/files/v1/f1'))).toBe(60_000);
    expect(
      timeoutFor(new Request('https://api.dev/api/help/v1/pages/MEMBRE/content', { method: 'PUT' })),
    ).toBe(60_000);
    expect(
      timeoutFor(new Request('https://api.dev/api/help/v1/pages/MEMBRE/screenshots', { method: 'POST' })),
    ).toBe(300_000);
  });

  it('gives five minutes to the upload of an attachment, not to its listing nor its removal', () => {
    const attachments = 'https://api.dev/api/sessions/v2/s1/files/f1/summary/attachments';
    expect(timeoutFor(new Request(attachments, { method: 'POST' }))).toBe(300_000);
    expect(
      timeoutFor(
        new Request('https://api.dev/api/sessions/v2/s1/files/f1/observations/o1', { method: 'PATCH' }),
      ),
    ).toBe(300_000);
    expect(timeoutFor(new Request('https://api.dev/api/sessions/v2/s1/files/f1/observations'))).toBe(10_000);
    expect(timeoutFor(new Request(`${attachments}?fileIds=a`, { method: 'DELETE' }))).toBe(60_000);
  });
});

describe('UPLOAD_ROUTES', () => {
  it.each(UPLOAD_ROUTES)('%s still exists in the generated sdk', (route) => {
    expect(sdk).toContain(`url: '${route}'`);
  });

  it.each([
    ['/api/help/v1/pages/MEMBRE/screenshots', true],
    ['https://api.dev/api/help/v1/pages/SECRETARIAT_GENERAL/screenshots', true],
    ['/api/help/v1/pages/MEMBRE/content', false],
  ])('matches %s: %s', (url, expected) => {
    const patterns = UPLOAD_ROUTES.map(routeToPattern);
    expect(patterns.some((pattern) => pattern.test(url))).toBe(expected);
  });
});

describe('LONG_RUNNING_ROUTES', () => {
  it.each(LONG_RUNNING_ROUTES)('%s still exists in the generated sdk', (route) => {
    expect(sdk).toContain(`url: '${route}'`);
  });

  it.each([
    ['/api/docs/v1/agendas/abc.pdf', true],
    ['https://api.dev/api/docs/v1/sessions/s1/official-reports/o1', true],
    ['/api/docs/v1/presentation-plans/p1/url', true],
    ['/api/docs/v1/sessions/s1/agendas/a1/blocks', false],
    ['/api/docs/v1/sessions/s1/new-official-reports/agendas', false],
    ['/api/docs/v1/agendas/a1', false],
    ['/api/docs/v1/presentation-plans/p1/html', false],
    ['/api/files/v1/f1', true],
    ['https://api.dev/api/files/v1/f1?download=', true],
    ['/api/sessions/v2/s1/files.xlsx', true],
    ['/api/sessions/v2/s1/files/missing-evaluations.xlsx', true],
    ['/api/sessions/v2/s1/files', false],
  ])('matches %s: %s', (url, expected) => {
    const patterns = LONG_RUNNING_ROUTES.map(routeToPattern);
    expect(patterns.some((pattern) => pattern.test(url))).toBe(expected);
  });
});
