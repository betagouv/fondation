import { randomUUID } from 'node:crypto';

import { HttpException, Injectable, type INestApplication } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request as ExpressRequest, Response as ExpressResponse, IRoute } from 'express';
import { ClsMiddleware, ClsService } from 'nestjs-cls';

import * as time from '../../utils/time';

// Identifiers only: never a name, an email, a body, a query string or free text, the event is kept a year by Scalingo
/** @see https://opentelemetry.io/docs/specs/semconv/ for the technical attributes */
type WideEventAttributes = {
  // The client of the public API, as in the tags of its Sentry issues (see ApiClientAlerts)
  'api_client.id'?: string;
  'error.message'?: string;
  'error.type'?: string;
  'fondation.impersonator.id'?: string;
  // The answer of the public API about a magistrat (ACTIVE, INACTIVE or UNKNOWN), which its status code does not tell
  'fondation.magistrat.status'?: string;
  'fondation.request.interrupted'?: true;
  'fondation.user.role'?: string;
  'http.request.method'?: string;
  // None when the request is cut before its answer: res.statusCode would still be its default 200
  'http.response.status_code'?: number;
  'http.route'?: string;
  'http.server.request.duration'?: number;
  // In seconds, as http.server.request.duration
  'job.duration'?: number;
  // The command of the CLI, with its subcommand as `user register`: never its arguments
  'job.name'?: string;
  'process.exit.code'?: number;
  // No path: the route and its identifiers say it, and the Scalingo router line of the same id has it
  'request.id'?: string;
  // The Sentry trace of the request, kept even when it is not sampled: its errors carry the same
  'trace.id'?: string;
  'user.id'?: string;
  // The identifiers of the route, as `fondation.nomination_file.id` for `:nominationFileId`, or of the record found (see set)
  [routeIdentifier: `fondation.${string}.id`]: string | undefined;
};

const WIDE_EVENT = 'wideEvent';
const UNLOGGED_PATHS = ['/_health'];
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function requestId(req: ExpressRequest): string {
  // The Scalingo router sets a UUID, to match its own log lines, but keeps the one a client sends: nothing else is kept
  const header = req.get('x-request-id');
  return header && UUID.test(header) ? header : randomUUID();
}

function openEvent(cls: ClsService, req: ExpressRequest, res: ExpressResponse): void {
  const [path = '/'] = req.originalUrl.split('?');
  if (UNLOGGED_PATHS.includes(path)) return;

  const startedAt = performance.now();
  const event: WideEventAttributes = {
    'http.request.method': req.method,
    'request.id': cls.getId(),
    // Opened by the HTTP server of Sentry before any middleware, absent when Sentry is off
    'trace.id': Sentry.getActiveSpan()?.spanContext().traceId,
  };
  cls.set(WIDE_EVENT, event);

  // Unlike 'finish', 'close' also fires when the client goes away before the response is sent
  res.on('close', () => {
    if (res.headersSent) event['http.response.status_code'] = res.statusCode;
    event['http.server.request.duration'] = (performance.now() - startedAt) / time.SECONDS;
    if (!res.writableFinished) event['fondation.request.interrupted'] = true;

    event['http.route'] = (req.route as IRoute | undefined)?.path;
    for (const [name, value] of Object.entries(req.params ?? {})) {
      const entity = /^(\w+)Id$/.exec(name)?.[1];
      // A UUID or a number only, as for the request id: the router matches any text, an email in :sessionId too.
      // A wildcard parameter is an array, never an identifier
      if (entity && typeof value === 'string' && (UUID.test(value) || /^\d+$/.test(value)))
        event[`fondation.${entity.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}.id`] = value;
    }

    if (req.user?.type === 'human') {
      event['user.id'] = req.user.id;
      event['fondation.user.role'] = req.user.role;
      event['fondation.impersonator.id'] = req.user.impersonation?.impersonatorId;
    }

    writeRequestEvent(event);
  });
}

function errorType(exception: unknown): string {
  return exception instanceof Error ? exception.constructor.name : typeof exception;
}

function writeRequestEvent(event: WideEventAttributes): void {
  const status = event['http.response.status_code'] ?? 0;
  // A failure answered by a redirection, as the OpenID login, keeps a status below 400
  const failed = status >= 400 || event['error.type'] || event['fondation.request.interrupted'];
  const level = status >= 500 ? 'error' : failed ? 'warn' : 'info';

  writeEvent(level, `${event['http.request.method']} ${event['http.route'] ?? '(no route)'}`, event);
}

function writeEvent(level: 'error' | 'info' | 'warn', message: string, event: WideEventAttributes): void {
  process.stdout.write(
    `${JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...event })}\n`,
  );
  // Buffered and sent in the background: an unreachable Sentry neither slows nor fails the request.
  // Without the unset attributes, which Sentry would turn into "" where stdout drops them
  Sentry.logger[level](
    message,
    Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined)),
  );
}

@Injectable()
export class WideEvent {
  constructor(private readonly cls: ClsService) {}

  // Before the body parser, which Nest adds at init, so a malformed or oversized body is described too.
  // Unlike an interceptor, it runs before the guards, so it sees the 401 and 403
  static mount(app: INestApplication): void {
    app.use(new ClsMiddleware({ generateId: true, idGenerator: requestId, setup: openEvent }).use);
  }

  /** Runs a command of the CLI in its own event, named by CommandName once commander has found it */
  runCommand(run: () => Promise<unknown>): Promise<void> {
    return this.cls.run(async () => {
      const startedAt = performance.now();
      const event: WideEventAttributes = {};
      this.cls.set(WIDE_EVENT, event);

      try {
        await run();
      } catch (error) {
        // No message: those of Prisma or pg can quote personal data
        event['error.type'] = errorType(error);
        throw error;
      } finally {
        event['job.duration'] = (performance.now() - startedAt) / time.SECONDS;
        // cli.ts ends with 1 a command that throws. The ingestion tells its failure by its exit code, without throwing
        event['process.exit.code'] = event['error.type'] ? 1 : Number(process.exitCode ?? 0);
        const level = event['process.exit.code'] === 0 ? 'info' : 'error';
        writeEvent(level, event['job.name'] ?? '(no command)', event);
      }
    });
  }

  /**
   * What only the code serving the request or running the command knows, as the client of the public API, the magistrat
   * it answered about or the ingestion job a command runs
   */
  set(
    attributes: Pick<
      WideEventAttributes,
      'api_client.id' | 'fondation.magistrat.status' | 'job.name' | `fondation.${string}.id`
    >,
  ): void {
    const event = this.cls.get<WideEventAttributes | undefined>(WIDE_EVENT);
    if (event) Object.assign(event, attributes);
  }

  failWith(exception: unknown, request: ExpressRequest): void {
    const event = this.cls.get<WideEventAttributes | undefined>(WIDE_EVENT);
    if (!event) return;

    event['error.type'] = errorType(exception);
    // Our own messages only: those of Prisma or pg, and the 404 of the router (no route), can quote personal data
    if (exception instanceof HttpException && request.route) event['error.message'] = exception.message;
  }
}
