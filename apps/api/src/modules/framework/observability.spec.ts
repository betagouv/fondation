import { createServer, request, Server } from 'node:http';
import { AddressInfo } from 'node:net';

import * as Sentry from '@sentry/node';
import { Request as ExpressRequest } from 'express';

import { ApiConfig } from './config';
import { SentryService, WITHOUT_REQUEST_DATA } from './observability';

const SECRET = 'do-not-leak';

describe('Sentry', () => {
  const events: Sentry.Event[] = [];
  let server: Server;

  beforeAll(async () => {
    Sentry.init({
      ...WITHOUT_REQUEST_DATA,
      dsn: 'https://public@sentry.test/1',
      transport: () => ({
        flush: () => Promise.resolve(true),
        send: ([, items]) => {
          for (const [header, payload] of items) {
            if (header.type === 'event') events.push(payload as Sentry.Event);
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
        .on('end', () => {
          Sentry.withIsolationScope(scope, () => Sentry.captureException(new Error('boom')));
          res.end();
        });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  beforeEach(() => {
    events.length = 0;
  });

  afterAll(async () => {
    server.close();
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
