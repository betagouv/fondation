import { ConsoleLogger, type ConsoleLoggerOptions, type LogLevel } from '@nestjs/common';

import { loadConfig } from './config';
import { WideEvent } from './wide-event';

/**
 * The lines of `this.logger`: in JSON on Scalingo, whose staging runs as production, so that `scalingo logs` can filter
 * them, with the id of their request or command so they are found from its event; plain text in a terminal, without it
 */
export class ApiLogger extends ConsoleLogger {
  constructor(options: ConsoleLoggerOptions = {}) {
    super({ ...options, json: options.json ?? loadConfig().isProduction });
  }

  protected override getJsonLogObject(
    message: unknown,
    options: {
      context: string;
      errorStack?: unknown;
      logLevel: LogLevel;
      writeStreamType?: 'stderr' | 'stdout';
    },
  ) {
    return { ...super.getJsonLogObject(message, options), 'request.id': WideEvent.currentId() };
  }
}
