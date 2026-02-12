import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { Clock } from '../framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from '../framework/config';
import { ScalingoHttpContainer } from './scalingo-http';

@Injectable()
export class ScalingoJobRunner {
  private readonly logger = new Logger(ScalingoJobRunner.name);
  private readonly scalingo: ScalingoHttpContainer;

  constructor(
    http: HttpService,
    clock: Clock,
    @Inject(API_CONFIG_TOKEN) config: ApiConfig,
  ) {
    const { appName, apiKey } = config.scalingo;
    if (!appName || !apiKey) {
      this.logger.fatal(`Unknown APP_NAME or API_KEY`);
      throw new Error(`Unknown SCALINGO appName / apiKey`);
    }

    this.scalingo = new ScalingoHttpContainer(http, apiKey, appName, clock);
  }

  /** starts the command in a "worker" scope, without creating any tunnel between this process and the other one */
  async runDetached(command: string): Promise<void> {
    try {
      await this.scalingo.withAuthentication((http) =>
        http.runOneOffContainer({ command }),
      );
    } catch (e) {
      throw new FailedToStartCommand(command, e);
    }
  }
}

export class FailedToStartCommand extends Error {
  constructor(
    readonly command: string,
    cause: unknown,
  ) {
    super(undefined, { cause });
  }
}
