import * as Sentry from '@sentry/node';

import { ApiConfig } from '../../framework/config';

import { ApiClientAlerts } from './api-client-alerts';

vi.mock('@sentry/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/node')>()),
  captureMessage: vi.fn(),
}));

describe('ApiClientAlerts', () => {
  const alerts = new ApiClientAlerts({ cookieSecret: 'a'.repeat(32) } as ApiConfig);

  const sent = () => vi.mocked(Sentry.captureMessage).mock.calls.map(([, hint]) => JSON.stringify(hint));
  const fingerprints = () =>
    vi
      .mocked(Sentry.captureMessage)
      .mock.calls.map(([, hint]) => (hint as { fingerprint: string[] }).fingerprint);

  beforeEach(() => {
    vi.mocked(Sentry.captureMessage).mockClear();
  });

  it('should keep one issue per IP turned away, without the IP in clear', () => {
    alerts.refusalsLimited({ ip: '198.51.100.1', limit: 10 });
    alerts.refusalsLimited({ ip: '198.51.100.2', limit: 10 });

    const [first, second] = fingerprints();
    expect(sent().join()).not.toContain('198.51.100');
    expect(first).not.toEqual(second);
  });

  it('should open an issue for each IP a client is forbidden from, without the IP in clear', () => {
    const forbidden = { clientId: 'client-1', reason: 'ip', route: 'auth' } as const;
    alerts.forbidden({ ...forbidden, ip: '198.51.100.1' });
    alerts.forbidden({ ...forbidden, ip: '::ffff:198.51.100.1' });
    alerts.forbidden({ ...forbidden, ip: '198.51.100.2' });

    const [first, sameIp, otherIp] = fingerprints();
    expect(sent().join()).not.toContain('198.51.100');
    expect(sameIp).toEqual(first);
    expect(otherIp).not.toEqual(first);
  });

  it('should open an issue for each route a client is forbidden on', () => {
    const forbidden = { clientId: 'client-1', ip: '203.0.113.7', reason: 'scope' } as const;
    alerts.forbidden({ ...forbidden, route: 'magistrats:status' });
    alerts.forbidden({ ...forbidden, route: 'magistrats:identification' });

    const [first, second] = fingerprints();
    expect(first).not.toEqual(second);
  });
});
