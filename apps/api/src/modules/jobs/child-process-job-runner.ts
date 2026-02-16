import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

import { spawn } from 'node:child_process';
import { FailedToStartCommand } from './job-errors';

/** @warning prefer using {@link JobRunner} */
@Injectable()
export class ChildProcessJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(ChildProcessJobRunner.name);
  readonly isAvailable = true;

  private readonly controller = new AbortController();

  async runDetached(command: string): Promise<void> {
    this.logger.debug(`Starting "${command} with node:child_process"`);
    try {
      spawn(command, {
        detached: true,
        stdio: 'ignore',
        signal: this.controller.signal,
      }).unref();
    } catch (error) {
      this.logger.error(
        `Failed running "${command}" with node:child_process`,
        error instanceof Error ? error.stack : undefined,
        { error },
      );

      throw new FailedToStartCommand(command, error);
    }
  }

  onApplicationShutdown(signal?: string) {
    this.controller.abort(signal ? `Signal: ${signal}` : undefined);
  }
}
