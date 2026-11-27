import { ConsoleLogger, type ConsoleLoggerOptions } from '@nestjs/common';

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

  protected override stringifyJsonLogObject(line: Record<string, unknown>): string {
    return super.stringifyJsonLogObject({
      // The id first: past a million characters, Nest truncates every value after, in the order of the keys
      'request.id': WideEvent.currentId(),
      ...line,
      // The level and the time of the event, so that one filter reads both
      level: line['level'] === 'log' ? 'info' : line['level'],
      timestamp: new Date().toISOString(),
    });
  }
}
