import * as Sentry from '@sentry/node';

import { ApiConfig } from '../../framework/config';

import { ApiClientAlerts } from './api-client-alerts';

vi.mock('@sentry/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/node')>()),
  captureMessage: vi.fn(),
}));

describe('ApiClientAlerts', () => {
  const alerts = new ApiClientAlerts({ cookieSecret: 'a'.repeat(32) } as ApiConfig);

  beforeEach(() => {
    vi.mocked(Sentry.captureMessage).mockClear();
  });

  it('should keep one issue per IP turned away, without the IP in clear', () => {
    alerts.refusalsLimited({ ip: '198.51.100.1', limit: 10 });
    alerts.refusalsLimited({ ip: '198.51.100.2', limit: 10 });

    const [first, second] = vi
      .mocked(Sentry.captureMessage)
      .mock.calls.map(([, hint]) => JSON.stringify(hint));
    expect(first).not.toContain('198.51.100');
    expect(first).not.toEqual(second);
  });
});
