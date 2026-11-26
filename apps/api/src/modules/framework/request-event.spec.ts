import {
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  Global,
  type INestApplication,
  Logger,
  Module,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/node';
import type { Request as ExpressRequest } from 'express';
import { ClsModule } from 'nestjs-cls';

import { Prisma } from '../../generated/prisma/client';

import { API_CONFIG_TOKEN } from './config';
import { ExceptionModule } from './exception';
import { SentryService, WITHOUT_PERSONAL_DATA } from './observability';
import { RequestEvent } from './request-event';

class Authenticated implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<ExpressRequest>().user = {
      id: 'user-id',
      impersonation: { id: 'impersonation-id', impersonatorId: 'impersonator-id' },
      isAdmin: true,
      role: 'ADMIN',
      sessionId: 'browser-session-id',
      type: 'human',
    };
    return true;
  }
}

class Forbidden implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

const slowRequest = { answer: Promise.withResolvers<string>(), received: Promise.withResolvers<void>() };

@Controller()
class TestController {
  @Get('sessions/:sessionId/nomination-files/:nominationFileId')
  @UseGuards(Authenticated)
  read(): string {
    return 'ok';
  }

  @Get('forbidden')
  @UseGuards(Forbidden)
  forbidden(): never {
    throw new Error('unreachable');
  }

  @Get('prisma')
  fail(): never {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed on jean.dupont@example.fr', {
      clientVersion: 'test',
      code: 'P2002',
    });
  }

  @Post('echo')
  echo(@Body() body: unknown): unknown {
    return body;
  }

  @Get('slow')
  slow(): Promise<string> {
    slowRequest.received.resolve();
    return slowRequest.answer.promise;
  }

  @Get('_health')
  health(): string {
    return 'ok';
  }
}

// Global, as the FrameworkModule: the exception filter gets the RequestEvent and the SentryService from it
@Global()
@Module({
  controllers: [TestController],
  exports: [RequestEvent, SentryService],
  imports: [ClsModule.forRoot({ global: true }), ExceptionModule],
  providers: [
    RequestEvent,
    SentryService,
    {
      provide: API_CONFIG_TOKEN,
      useValue: { isProduction: true, sentryDsn: 'https://public@sentry.test/1' },
    },
  ],
})
class TestModule {}

describe('RequestEvent', () => {
  const errors: { contexts?: { trace?: { trace_id?: string } } }[] = [];
  const logs: { attributes: Record<string, { value: unknown }>; level: string; trace_id?: string }[] = [];
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    // Before the server starts, so the HTTP server of Sentry opens the span of each request
    Sentry.init({
      ...WITHOUT_PERSONAL_DATA,
      dsn: 'https://public@sentry.test/1',
      // As most requests in production (0.2): without a rate, every request would share one trace
      tracesSampleRate: 0,
      transport: () => ({
        flush: () => Promise.resolve(true),
        send: ([, items]) => {
          for (const [header, payload] of items) {
            if (header.type === 'event') errors.push(payload as (typeof errors)[number]);
            if (header.type === 'log') logs.push(...(payload as { items: (typeof logs)[number][] }).items);
          }
          return Promise.resolve({});
        },
      }),
    });
    const module = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = module.createNestApplication({ logger: false });
    RequestEvent.mount(app);
    await app.listen(0);
    url = await app.getUrl();
  });

  afterAll(async () => {
    slowRequest.answer.resolve('late');
    await app.close();
    await Sentry.close();
  });

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  async function linesOf(send: () => Promise<unknown>): Promise<Record<string, unknown>[]> {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await send();
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    const lines = write.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);
    write.mockRestore();
    return lines;
  }

  async function eventOf(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
    const [event] = await linesOf(() => fetch(`${url}${path}`, init).then((response) => response.text()));
    return event!;
  }

  it('should describe a successful request with the identifiers of its route and its user', async () => {
    const event = await eventOf(
      '/sessions/12/nomination-files/5c1e9f3a-8b2d-4c6e-a7f0-3d9b1e4a2c8f?search=Dupont',
      {
        headers: { 'x-request-id': '0b9e6a4c-2f1d-4e8a-9c3b-7d5f1a2e4b6c' },
      },
    );

    expect(event).toEqual({
      'fondation.impersonator.id': 'impersonator-id',
      'fondation.nomination_file.id': '5c1e9f3a-8b2d-4c6e-a7f0-3d9b1e4a2c8f',
      'fondation.session.id': '12',
      'fondation.user.role': 'ADMIN',
      'http.request.method': 'GET',
      'http.response.status_code': 200,
      'http.route': '/sessions/:sessionId/nomination-files/:nominationFileId',
      'http.server.request.duration': expect.any(Number),
      level: 'info',
      message: 'GET /sessions/:sessionId/nomination-files/:nominationFileId',
      'request.id': '0b9e6a4c-2f1d-4e8a-9c3b-7d5f1a2e4b6c',
      timestamp: expect.any(String),
      'trace.id': expect.stringMatching(/^[\da-f]{32}$/),
      'user.id': 'user-id',
    });
  });

  it('should drop a route parameter that is not an identifier', async () => {
    const event = await eventOf('/sessions/jean.dupont@example.fr/nomination-files/12');

    expect(event).toMatchObject({ 'fondation.nomination_file.id': '12' });
    expect(event).not.toHaveProperty('fondation.session.id');
    expect(JSON.stringify(event)).not.toContain('jean.dupont');
  });

  it('should send the event to Sentry Logs, in the trace of its request even when it is not sampled', async () => {
    await Sentry.flush();
    logs.length = 0;
    const event = await eventOf('/forbidden');
    const next = await eventOf('/forbidden');
    await Sentry.flush();

    expect(next['trace.id']).not.toBe(event['trace.id']);
    expect(logs[0]).toMatchObject({
      attributes: {
        'http.response.status_code': { value: 403 },
        'request.id': { value: event['request.id'] },
      },
      level: 'warn',
      trace_id: event['trace.id'],
    });
  });

  it('should share the trace of its request with the error sent to Sentry', async () => {
    await Sentry.flush();
    errors.length = 0;
    const event = await eventOf('/prisma');
    await Sentry.flush();

    expect(errors.map((error) => error.contexts?.trace?.trace_id)).toEqual([event['trace.id']]);
  });

  it('should not send to Sentry Logs an attribute the event leaves unset', async () => {
    await Sentry.flush();
    logs.length = 0;
    await eventOf('/unknown');
    await Sentry.flush();

    expect(logs[0]?.attributes).toMatchObject({ 'http.response.status_code': { value: 404 } });
    expect(logs[0]?.attributes).not.toHaveProperty('http.route');
  });

  it('should replace a request id other than the UUID of the Scalingo router', async () => {
    const event = await eventOf('/forbidden', { headers: { 'x-request-id': 'jean.dupont@example.fr' } });

    expect(event['request.id']).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  });

  it('should describe a request refused by a guard', async () => {
    const event = await eventOf('/forbidden');

    expect(event).toMatchObject({
      'error.message': 'Forbidden resource',
      'error.type': 'ForbiddenException',
      'http.response.status_code': 403,
      'http.route': '/forbidden',
      level: 'warn',
    });
  });

  it('should drop the message of the router, which quotes the URL', async () => {
    const event = await eventOf('/unknown?email=jean.dupont@example.fr');

    expect(event).toMatchObject({ 'error.type': 'NotFoundException', 'http.response.status_code': 404 });
    expect(event).not.toHaveProperty('error.message');
    expect(JSON.stringify(event)).not.toContain('jean.dupont');
  });

  it('should drop the message of a Prisma error, which can quote personal data', async () => {
    const event = await eventOf('/prisma');

    expect(event).toMatchObject({
      'error.type': 'PrismaClientKnownRequestError',
      'http.response.status_code': 500,
      level: 'error',
    });
    expect(JSON.stringify(event)).not.toContain('jean.dupont');
  });

  it('should describe a request whose body cannot be read, refused before the router', async () => {
    const event = await eventOf('/echo', {
      body: '{"email": "jean.dupont@example.fr"',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(event).toMatchObject({
      'error.type': 'BadRequestException',
      'http.request.method': 'POST',
      'http.response.status_code': 400,
    });
    expect(JSON.stringify(event)).not.toContain('jean.dupont');
  });

  it('should describe a request the client cuts before its answer, without the status it never got', async () => {
    const controller = new AbortController();
    const [event] = await linesOf(async () => {
      const response = fetch(`${url}/slow`, { signal: controller.signal }).catch(() => undefined);
      await slowRequest.received.promise;
      controller.abort();
      await response;
    });

    expect(event).toMatchObject({
      'fondation.request.interrupted': true,
      'http.route': '/slow',
      level: 'warn',
    });
    expect(event).not.toHaveProperty('http.response.status_code');
  });

  it('should not describe the health checks of Scalingo', async () => {
    const lines = await linesOf(async () => {
      await fetch(`${url}/_health`).then((response) => response.text());
      await fetch(`${url}/forbidden`).then((response) => response.text());
    });

    expect(lines).toEqual([expect.objectContaining({ 'http.route': '/forbidden' })]);
  });
});
