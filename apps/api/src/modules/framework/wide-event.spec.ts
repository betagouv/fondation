import {
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  Global,
  type INestApplication,
  type INestApplicationContext,
  Injectable,
  Logger,
  Module,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/node';
import type { Request as ExpressRequest } from 'express';
import {
  Command,
  CommandFactory,
  CommandRunner,
  CommandRunnerService,
  Option,
  SubCommand,
} from 'nest-commander';
import { ClsModule } from 'nestjs-cls';

import { Prisma } from '../../generated/prisma/client';

import { CommandName } from './command-name';
import { API_CONFIG_TOKEN } from './config';
import { ExceptionModule } from './exception';
import { SentryService, WITHOUT_PERSONAL_DATA } from './observability';
import { WideEvent } from './wide-event';

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

// As ApiScopeGuard: the client is known before its call is refused
@Injectable()
class KnownClientForbidden implements CanActivate {
  constructor(private readonly wideEvent: WideEvent) {}

  canActivate(): boolean {
    this.wideEvent.set({ 'api_client.id': 'client-id' });
    return false;
  }
}

const slowRequest = { answer: Promise.withResolvers<string>(), received: Promise.withResolvers<void>() };

@Controller()
class TestController {
  constructor(private readonly wideEvent: WideEvent) {}

  // Two calls to the same service, the first failing
  @Get('pdf')
  async pdf(): Promise<string> {
    await this.wideEvent
      .timeCall('gotenberg', () => Promise.reject(new Error('ECONNREFUSED')))
      .catch(() => undefined);
    return this.wideEvent.timeCall('gotenberg', () => Promise.resolve('pdf'));
  }

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

  @Get('public')
  @UseGuards(KnownClientForbidden)
  public(): never {
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

  // As a PDF the client stops waiting for while Gotenberg renders it
  @Get('slow')
  slow(): Promise<string> {
    slowRequest.received.resolve();
    return this.wideEvent.timeCall('gotenberg', () => slowRequest.answer.promise);
  }

  @Get('_health')
  health(): string {
    return 'ok';
  }
}

// Global, as the FrameworkModule: the exception filter gets the WideEvent and the SentryService from it
@Global()
@Module({
  controllers: [TestController],
  exports: [WideEvent, SentryService],
  imports: [ClsModule.forRoot({ global: true }), ExceptionModule],
  providers: [
    WideEvent,
    SentryService,
    {
      provide: API_CONFIG_TOKEN,
      useValue: { isProduction: true, sentryDsn: 'https://public@sentry.test/1' },
    },
  ],
})
class TestModule {}

@SubCommand({ name: 'register' })
class RegisterCommand extends CommandRunner {
  async run(): Promise<void> {}
}

@Command({ name: 'user', subCommands: [RegisterCommand] })
class UserCommand extends CommandRunner {
  async run(): Promise<void> {}
}

// As the ingestion, which ends with 1 when it fails, without throwing
@Command({ name: 'failed-job' })
class FailedJobCommand extends CommandRunner {
  constructor(private readonly wideEvent: WideEvent) {
    super();
  }

  // As IngestLolfiCommand.parseJobId: commander calls it before the command runs
  @Option({ flags: '--jobId <id>', name: 'jobId' })
  parseJobId(jobId: string): number {
    if (!/^\d+$/.test(jobId)) throw new TypeError('not a job id');
    return Number(jobId);
  }

  async run(): Promise<void> {
    this.wideEvent.set({ 'fondation.ingestion_job.id': '7' });
    process.exitCode = 1;
  }
}

@Command({ name: 'throwing' })
class ThrowingCommand extends CommandRunner {
  async run(): Promise<void> {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed on jean.dupont@example.fr', {
      clientVersion: 'test',
      code: 'P2002',
    });
  }
}

@Module({
  imports: [ClsModule.forRoot({ global: true })],
  providers: [CommandName, FailedJobCommand, RegisterCommand, ThrowingCommand, UserCommand, WideEvent],
})
class TestCliModule {}

describe('WideEvent', () => {
  const errors: { contexts?: { trace?: { trace_id?: string } } }[] = [];
  const logs: { attributes: Record<string, { value: unknown }>; level: string; trace_id?: string }[] = [];
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    // Before the server starts, so the HTTP server of Sentry opens the span of each request
    Sentry.init({
      ...WITHOUT_PERSONAL_DATA,
      dsn: 'https://public@sentry.test/1',
      // As in production: without a rate, every request would share one trace
      tracesSampleRate: 1.0,
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
    WideEvent.mount(app);
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

  it('should send the event to Sentry Logs, in the trace of its request', async () => {
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

  it('should keep what the code serving the request set, even when it refuses it', async () => {
    const event = await eventOf('/public');

    expect(event).toMatchObject({ 'api_client.id': 'client-id', 'http.response.status_code': 403 });
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

  it('should count the calls to a service, their total duration and their failures', async () => {
    const event = await eventOf('/pdf');

    expect(event).toMatchObject({
      'fondation.gotenberg.call.count': 2,
      'fondation.gotenberg.call.duration': expect.any(Number),
      'fondation.gotenberg.call.failure.count': 1,
      'http.response.status_code': 200,
    });
    expect(event).not.toHaveProperty('fondation.storage.call.count');
  });

  it('should run a call made outside any request or command', async () => {
    await expect(app.get(WideEvent).timeCall('storage', () => Promise.resolve('bucket'))).resolves.toBe(
      'bucket',
    );
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

  it('should describe a request the client cuts before its answer, without the status it never got, with the call it waited for', async () => {
    const controller = new AbortController();
    const [event] = await linesOf(async () => {
      const response = fetch(`${url}/slow`, { signal: controller.signal }).catch(() => undefined);
      await slowRequest.received.promise;
      controller.abort();
      await response;
    });

    expect(event).toMatchObject({
      'fondation.gotenberg.call.count': 1,
      'fondation.gotenberg.call.duration': expect.any(Number),
      'fondation.request.interrupted': true,
      'http.route': '/slow',
      level: 'warn',
    });
    expect(event).not.toHaveProperty('http.response.status_code');
    expect(event).not.toHaveProperty('fondation.gotenberg.call.failure.count');
  });

  it('should not describe the health checks of Scalingo', async () => {
    const lines = await linesOf(async () => {
      await fetch(`${url}/_health`).then((response) => response.text());
      await fetch(`${url}/forbidden`).then((response) => response.text());
    });

    expect(lines).toEqual([expect.objectContaining({ 'http.route': '/forbidden' })]);
  });

  describe('of a command', () => {
    let cli: INestApplicationContext;

    beforeAll(async () => {
      cli = await CommandFactory.createWithoutRunning(TestCliModule, {
        logger: false,
        // As in cli.ts
        serviceErrorHandler: (error: unknown) => {
          throw error;
        },
      });
    });

    afterAll(() => cli.close());

    afterEach(() => {
      process.exitCode = undefined;
    });

    async function commandEventOf(...args: string[]): Promise<Record<string, unknown>> {
      const [event] = await linesOf(() =>
        cli.get(WideEvent).runCommand(() => cli.get(CommandRunnerService).run(['node', 'cli', ...args])),
      );
      return event!;
    }

    it('should describe a command that succeeds, named with its subcommand', async () => {
      const event = await commandEventOf('user', 'register');

      expect(event).toEqual({
        'job.duration': expect.any(Number),
        'job.name': 'user register',
        level: 'info',
        message: 'user register',
        'process.exit.code': 0,
        timestamp: expect.any(String),
      });
    });

    it('should describe as an error a command that ends with an exit code other than 0', async () => {
      const event = await commandEventOf('failed-job');

      expect(event).toMatchObject({ 'job.name': 'failed-job', level: 'error', 'process.exit.code': 1 });
    });

    it('should name a command whose option commander cannot read', async () => {
      const [event] = await linesOf(() =>
        cli
          .get(WideEvent)
          .runCommand(() =>
            cli.get(CommandRunnerService).run(['node', 'cli', 'failed-job', '--jobId', 'abc']),
          )
          .catch(() => undefined),
      );

      expect(event).toMatchObject({ 'error.type': 'TypeError', 'job.name': 'failed-job', level: 'error' });
    });

    it('should describe a command that throws, without its message, and let its error through to cli.ts', async () => {
      let thrown: unknown;
      const [event] = await linesOf(() =>
        cli
          .get(WideEvent)
          .runCommand(() => cli.get(CommandRunnerService).run(['node', 'cli', 'throwing']))
          .catch((error: unknown) => (thrown = error)),
      );

      expect(thrown).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect(event).toMatchObject({
        'error.type': 'PrismaClientKnownRequestError',
        level: 'error',
        'process.exit.code': 1,
      });
      expect(process.exitCode).toBe(1);
      expect(JSON.stringify(event)).not.toContain('jean.dupont');
    });

    it('should send the event of a command to Sentry Logs', async () => {
      await Sentry.flush();
      logs.length = 0;
      await commandEventOf('failed-job');
      await Sentry.flush();

      expect(logs).toEqual([
        expect.objectContaining({
          attributes: expect.objectContaining({ 'job.name': { type: 'string', value: 'failed-job' } }),
          level: 'error',
        }),
      ]);
    });

    it('should keep what the command set, as the ingestion job it ran', async () => {
      const event = await commandEventOf('failed-job');

      expect(event).toMatchObject({ 'fondation.ingestion_job.id': '7' });
    });
  });
});
