import { createServer, request, Server } from 'node:http';
import { AddressInfo } from 'node:net';

import * as Sentry from '@sentry/node';
import { Request as ExpressRequest } from 'express';

import { ApiConfig } from './config';
import { SentryService, WITHOUT_PERSONAL_DATA } from './observability';

const SECRET = 'do-not-leak';

describe('Sentry', () => {
  const events: Sentry.Event[] = [];
  const transactions: Sentry.Event[] = [];
  let server: Server;
  let upstream: Server;

  beforeAll(async () => {
    Sentry.init({
      ...WITHOUT_PERSONAL_DATA,
      dsn: 'https://public@sentry.test/1',
      tracesSampleRate: 1,
      transport: () => ({
        flush: () => Promise.resolve(true),
        send: ([, items]) => {
          for (const [header, payload] of items) {
            if (header.type === 'event') events.push(payload as Sentry.Event);
            if (header.type === 'transaction') transactions.push(payload as Sentry.Event);
          }
          return Promise.resolve({});
        },
      }),
    });

    server = createServer((req, res) => {
      // The SDK reads the body through the "data" listeners, and the scope of the request is lost on "end"
      const scope = Sentry.getIsolationScope();
      req
        .on('data', () => {})
        .on('end', async () => {
          if (req.url?.startsWith('/magistrats')) await get(upstream, `/jurisdictions?nom=${SECRET}`);
          Sentry.withIsolationScope(scope, () => Sentry.captureException(new Error('boom')));
          res.end();
        });
    });
    upstream = createServer((_, res) => res.end());
    await Promise.all([server, upstream].map((s) => new Promise<void>((resolve) => s.listen(0, resolve))));
  });

  beforeEach(() => {
    events.length = 0;
    transactions.length = 0;
  });

  afterAll(async () => {
    server.close();
    upstream.close();
    await Sentry.close();
  });

  it('should send neither the body, the cookies nor the query string of the request', async () => {
    await new Promise<void>((resolve, reject) => {
      const { port } = server.address() as AddressInfo;
      request(
        {
          headers: { 'content-type': 'application/json', cookie: `sid=${SECRET}` },
          method: 'POST',
          path: `/login?token=${SECRET}`,
          port,
        },
        (res) => res.resume().on('end', resolve),
      )
        .on('error', reject)
        .end(JSON.stringify({ password: SECRET }));
    });
    await Sentry.flush();

    expect(events).toHaveLength(1);
    expect(JSON.stringify(events[0])).not.toContain(SECRET);
  });

  it('should send the path of the incoming and outgoing requests but never their query string', async () => {
    await get(server, `/magistrats?nom=${SECRET}`);
    await Sentry.flush();

    const sent = JSON.stringify([...events, ...transactions]);
    expect(sent).toContain('/magistrats');
    expect(sent).toContain('/jurisdictions');
    expect(sent).not.toContain(SECRET);
  });

  it('should only send the method, the route, the status and the user of a failed request', async () => {
    const sentry = new SentryService({ isProduction: true, sentryDsn: 'dsn' } as ApiConfig);

    sentry.captureException(
      new Error('boom'),
      {
        body: { password: SECRET },
        headers: { cookie: `sid=${SECRET}` },
        method: 'POST',
        route: { path: '/login' },
        userId: 'user-id',
      } as unknown as ExpressRequest,
      500,
    );
    await Sentry.flush();

    expect(events[0]).toMatchObject({
      extra: { method: 'POST', status: 500 },
      tags: { url: '/login' },
      user: { id: 'user-id' },
    });
    expect(JSON.stringify(events[0])).not.toContain(SECRET);
  });
});

function get(server: Server, path: string): Promise<void> {
  const { port } = server.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    request({ path, port }, (res) => res.resume().on('end', resolve))
      .on('error', reject)
      .end();
  });
}
