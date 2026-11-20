import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';

import * as time from '../../../utils/time';
import { Clock } from '../../framework/clock';
import { RateWindow } from '../domain/rate-window';

import { ApiClientRepository } from './api-client.repository';

/**
 * The counts of the refused calls hold IPs: they go once their minute is over, with the expired tokens, even when no
 * client calls. Each container purges, harmlessly
 */
// TODO: see LoginAttemptPurge, the same timer for the login attempts
@Injectable()
export class ApiClientPurge implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ApiClientPurge.name);
  #timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly clock: Clock,
    private readonly repository: ApiClientRepository,
  ) {}

  onApplicationBootstrap(): void {
    this.#timer = setInterval(() => {
      const window = new RateWindow(this.clock.now());

      this.repository
        .purge({ countedSince: window.start, now: window.now })
        .catch((error: unknown) => this.logger.error(error));
    }, time.MINUTES).unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.#timer);
  }
}
