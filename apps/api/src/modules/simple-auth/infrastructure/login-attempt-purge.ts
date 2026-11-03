import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';

import * as time from '../../../utils/time';
import { Clock } from '../../framework/clock';

import { LoginAttemptRepository } from './repositories/login-attempt.repository';

/** The attempts hold addresses and IPs: they go once out of the window, even when nobody logs in. Each container purges, harmlessly */
@Injectable()
export class LoginAttemptPurge implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(LoginAttemptPurge.name);
  #timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly clock: Clock,
    private readonly repository: LoginAttemptRepository,
  ) {}

  onApplicationBootstrap(): void {
    this.#timer = setInterval(() => {
      this.repository.purge(this.clock.now()).catch((error: unknown) => this.logger.error(error));
    }, time.MINUTES).unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.#timer);
  }
}
