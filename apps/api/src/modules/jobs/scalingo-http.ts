import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { addMilliseconds } from 'date-fns';
import { lastValueFrom } from 'rxjs';
import z from 'zod';

import * as time from 'src/utils/time';
import { Clock } from '../framework/clock';

class ScalingoBearer {
  private static readonly EXPIRATION_TIME_MS = 50 * time.MINUTES;

  constructor(
    readonly token: string,
    readonly createdAt: Date,
    private readonly clock: Clock,
  ) {}

  isExpired(): boolean {
    const expiresAt =
      this.createdAt.getTime() + ScalingoBearer.EXPIRATION_TIME_MS;

    return expiresAt < this.clock.now().getTime();
  }
}

class ScalingoHttpService {
  private readonly logger = new Logger(ScalingoHttpService.name);

  private static readonly BASE_URL = 'https://api.osc-secnum-fr1.scalingo.com';
  constructor(
    private readonly http: HttpService,
    private readonly appName: string,
    private bearer: ScalingoBearer,
    private readonly auth: ScalingoHttpContainer,
  ) {}

  private async withValidBearer(): Promise<void> {
    if (this.bearer.isExpired()) {
      const bearer = await this.auth.getBearer();
      this.bearer = bearer;
    }
  }

  async runOneOffContainer(options: {
    command: string;
    env?: Record<string, string | number>;
    size?: 'S' | 'M' | 'L' | 'XL';
    detached?: boolean;
  }): Promise<void> {
    await this.withValidBearer();

    const url = new URL(
      `/v1/apps/${this.appName}/run`,
      ScalingoHttpService.BASE_URL,
    ).toString();

    if (options.detached === false) {
      this.logger.warn(
        `Will run the command "${options.command}" as attached one-off`,
      );
    }

    await lastValueFrom(
      this.http.post(
        url,
        { detached: true, ...options },
        {
          headers: { Authorization: `Bearer ${this.bearer.token}` },
          signal: this.auth.abortController.signal,
        },
      ),
    );
  }
}

export class ScalingoHttpContainer {
  private static readonly AUTH_BASE_URL = 'https://auth.scalingo.com';
  private static readonly EXPIRATION_TIME_MS = 50 * time.MINUTES;
  private bearer: ScalingoBearer | undefined;

  constructor(
    private readonly http: HttpService,
    private readonly apiToken: string,
    private readonly appName: string,
    private readonly clock: Clock,
    readonly abortController: AbortController,
  ) {}

  async withAuthentication<T>(
    factory: (x: ScalingoHttpService) => Promise<T>,
  ): Promise<T> {
    let bearer = this.bearer;
    if (!bearer || bearer.isExpired()) {
      bearer = await this.getBearer();
    }

    const service = new ScalingoHttpService(
      this.http,
      this.appName,
      bearer,
      this,
    );

    return factory(service);
  }

  async getBearer(): Promise<ScalingoBearer> {
    const url = new URL(
      '/v1/tokens/exchange',
      ScalingoHttpContainer.AUTH_BASE_URL,
    ).toString();

    const { data } = await lastValueFrom(
      this.http.post(
        url,
        {},
        {
          auth: { username: '', password: this.apiToken },
          signal: this.abortController.signal,
        },
      ),
    );

    const { token } = await z.object({ token: z.string() }).parseAsync(data);
    return new ScalingoBearer(
      token,
      addMilliseconds(
        this.clock.now(),
        ScalingoHttpContainer.EXPIRATION_TIME_MS,
      ),
      this.clock,
    );
  }
}
