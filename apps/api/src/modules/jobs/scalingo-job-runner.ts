import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';

import { Clock } from '../framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from '../framework/config';
import { FailedToStartCommand } from './job-errors';
import { ScalingoHttpContainer } from './scalingo-http';

/** @warning prefer using {@link JobRunner} */
@Injectable()
export class ScalingoJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(ScalingoJobRunner.name);
  private readonly scalingo: ScalingoHttpContainer | undefined;
  private readonly abortController = new AbortController();

  get isAvailable(): boolean {
    return !!this.scalingo;
  }

  constructor(
    http: HttpService,
    clock: Clock,
    @Inject(API_CONFIG_TOKEN) config: ApiConfig,
  ) {
    const { appName, apiKey } = config.scalingo;
    if (appName && apiKey) {
      this.scalingo = new ScalingoHttpContainer(
        http,
        apiKey,
        appName,
        clock,
        this.abortController,
      );
    }
  }

  /** starts the command in a "worker" scope, without creating any tunnel between this process and the other one */
  async runDetached(command: string): Promise<void> {
    if (!this.scalingo) {
      this.logger.error(
        `Tried running "${command}" with scalingo, when this runner is not available`,
      );
      throw new FailedToStartCommand(command);
    }

    this.logger.debug(`Starting "${command}" with scalingo job runner`);
    try {
      await this.scalingo.withAuthentication((http) =>
        http.runOneOffContainer({ command }),
      );
    } catch (error) {
      this.logger.error(
        `Failed running "${command}" with scalingo`,
        error instanceof Error ? error.stack : undefined,
        { error },
      );

      throw new FailedToStartCommand(command, error);
    }
  }

  onApplicationShutdown() {
    this.abortController.abort();
  }
}
