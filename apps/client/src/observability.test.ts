import * as Sentry from '@sentry/react';

import { WITHOUT_PERSONAL_DATA } from './observability';

const SECRET = 'DUPONT';

describe('Sentry', () => {
  const envelopes: unknown[] = [];

  beforeAll(() => {
    Object.defineProperty(document, 'referrer', { value: `https://lolfi.test/magistrats?q=${SECRET}` });
    window.history.pushState(null, '', `/magistrats?recherche=${SECRET}`);
    globalThis.fetch = () => Promise.resolve(new Response());
    Sentry.init({
      ...WITHOUT_PERSONAL_DATA,
      dsn: 'https://public@sentry.test/1',
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 1,
      transport: () => ({
        flush: () => Promise.resolve(true),
        send: (envelope) => {
          envelopes.push(envelope);
          return Promise.resolve({});
        },
      }),
    });
  });

  beforeEach(() => {
    Sentry.getIsolationScope().clearBreadcrumbs();
    envelopes.length = 0;
  });

  afterAll(() => Sentry.close());

  it('should send the path of the pages and of the API calls but never their query string', async () => {
    await fetch(`/api/magistrats/v1?recherche=${SECRET}`);
    window.history.pushState(null, '', `/sessions/1?filters=${SECRET}`);
    Sentry.captureException(new Error('boom'));
    Sentry.getActiveSpan()?.end();
    await Sentry.flush();

    const sent = JSON.stringify(envelopes);
    expect(sent).toContain('/api/magistrats/v1');
    expect(sent).toContain('/sessions/1');
    expect(sent).toContain('lolfi.test/magistrats');
    expect(sent).not.toContain(SECRET);
  });

  it('should send the address of the screenshots but never their signature', async () => {
    Sentry.startSpan({ name: '/sessions/1' }, () => {
      Sentry.startSpan(
        { name: `https://s3.test/screenshot.png?X-Amz-Signature=${SECRET}`, op: 'resource.img' },
        () => {},
      );
    });
    await Sentry.flush();

    const sent = JSON.stringify(envelopes);
    expect(sent).toContain('https://s3.test/screenshot.png');
    expect(sent).not.toContain(SECRET);
  });
});
