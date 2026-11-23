import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { Clock } from '../framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from '../framework/config';
import { pseudonymize } from '../framework/observability';

import { AuthImpersonation } from './domain/auth-impersonation';
import { AuthSession } from './domain/auth-session';
import { AuthUserNotAuthentifiable } from './domain/auth-user';
import { KnownBrowser } from './domain/known-browser';
import { LoginAttempt } from './domain/login-attempt';
import { PasswordHasher } from './infrastructure/password-hasher';
import { DetailsUserFromImpersonationQuery } from './infrastructure/queries/details-user-from-impesronation-id.query';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import { DetailedUserResponseDto, DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { FindMachineQuery } from './infrastructure/queries/find-machine.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { LoginAttemptRepository } from './infrastructure/repositories/login-attempt.repository';
import { OpenIdAuthService } from './openid-auth.service';

@Injectable()
export class SimpleAuthService {
  constructor(
    readonly openId: OpenIdAuthService,
    private readonly detailsUserQuery: DetailsUserQuery,
    private readonly detailsUserFromSessionQuery: DetailsUserFromSessionIdQuery,
    private readonly detailsUserFromImpersonationQuery: DetailsUserFromImpersonationQuery,
    private readonly userRepository: AuthUserRepository,
    private readonly loginAttemptRepository: LoginAttemptRepository,
    private readonly findMachineQuery: FindMachineQuery,
    private readonly clock: Clock,
    private readonly passwordHasher: PasswordHasher,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {}

  findMachine(query: { bearer: string }): Promise<{ token: string } | null> {
    return this.findMachineQuery.handle(query);
  }

  findUserFromValidSession(
    sessionId: string,
  ): Promise<{ id: string; isAdmin: boolean; role: string } | null> {
    return this.detailsUserFromSessionQuery.handle({ sessionId });
  }

  findImpersonatedUser(impersonation: {
    authSessionId: string;
    id: string;
  }): Promise<{ id: string; impersonatorId: string; isAdmin: boolean; role: string } | null> {
    return this.detailsUserFromImpersonationQuery.handle(impersonation);
  }

  /** The known browser is reissued at each success: a new cookie, for the address typed, for another year */
  async login(command: {
    email: string;
    ip: string;
    knownBrowserCookie: unknown;
    password: string;
  }): Promise<{ knownBrowser: { cookie: string; expiresAt: Date }; session: AuthSession }> {
    const now = this.clock.now();
    const knownBrowser = KnownBrowser.recognize(
      command.knownBrowserCookie,
      { ...command, now },
      this.config.cookieSecret,
    );
    const attempt = await this.loginAttemptRepository.start({
      ...command,
      knownBrowserId: knownBrowser?.id ?? null,
      now,
    });
    // A suspended login fails like a wrong password, the right one included, so that nothing reveals whether the account exists
    if (attempt.isSuspended) {
      await this.loginAttemptRepository.forget(attempt);
      throw new AuthUserNotAuthentifiable();
    }

    try {
      const session = await this.authenticate(command);
      await this.loginAttemptRepository.forgetFailuresOnSuccess(attempt);
      const issued = KnownBrowser.issue({ ...command, now });
      return {
        knownBrowser: { cookie: issued.cookie(this.config.cookieSecret), expiresAt: issued.expiresAt },
        session,
      };
    } catch (error) {
      if (error instanceof AuthUserNotAuthentifiable) await this.reportCrossedThresholds(attempt);
      throw error;
    }
  }

  private async reportCrossedThresholds(attempt: LoginAttempt): Promise<void> {
    for (const { limit, target, throttle } of attempt.crossedThresholds) {
      // One issue per address, IP or known browser: under a single one, an alert rule on new issues would only notify the
      // first suspension
      const targetHash = pseudonymize(target, this.config.cookieSecret);
      // The account attacked goes by its id, as in every Sentry event: neither the address nor the IP leave in clear
      const user = throttle === 'ip' ? null : await this.userRepository.findByEmail(attempt.email);
      Sentry.captureMessage('Password logins suspended', {
        extra: { limit, throttle },
        fingerprint: ['password-logins-suspended', throttle, targetHash],
        level: 'warning',
        user: user ? { id: user.id } : undefined,
      });
    }
  }

  private async authenticate(command: { email: string; password: string }): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      // An unknown email fails like a wrong password, as late and with the same status, so that nothing reveals who has an account
      await this.passwordHasher.decoy.equals(command.password);
      throw new AuthUserNotAuthentifiable();
    }

    const session = await user.authenticate({
      now: this.clock.now(),
      plainPassword: command.password,
      type: 'password',
    });
    // The decoy takes the configured cost: a password hashed at another one would tell by its duration that the account exists
    if (this.passwordHasher.isOutdated(user.password)) {
      user.rehashPassword(await this.passwordHasher.hash(command.password));
    }
    await this.userRepository.persist(user);
    return session;
  }

  detailsUser(query: {
    impersonationId: string | undefined;
    userId: string;
  }): Promise<DetailedUserResponseDto> {
    return this.detailsUserQuery.handle(query);
  }

  async changePassword(command: {
    currentPassword: string;
    isImpersonated: boolean;
    newPassword: string;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const user = await this.userRepository.find(command.userId);
    await user.changePassword({
      currentPassword: command.currentPassword,
      hash: (plain) => this.passwordHasher.hash(plain),
      isImpersonated: command.isImpersonated,
      keptSessionId: command.sessionId,
      newPassword: command.newPassword,
    });
    await this.userRepository.persist(user);
  }

  async unAuthenticate(command: { sessionId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.find(command.userId);
    user.unAuthenticate(command.sessionId);
    await this.userRepository.persist(user);
  }

  @Transactional(Propagation.Mandatory)
  async internalRevokeSessions(command: {
    keptSessionId: string | undefined;
    userId: string;
  }): Promise<void> {
    const user = await this.userRepository.find(command.userId);
    user.revokeSessions(command);
    await this.userRepository.persist(user);
  }

  async unImpersonate(command: { impersonationId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.find(command.userId);
    user.unImpersonate({ impersonationId: command.impersonationId });
    await this.userRepository.persist(user);
  }

  async internalHashPassword(plain: string): Promise<string> {
    const password = await this.passwordHasher.hash(plain);
    return password.toString();
  }

  async impersonate(command: {
    authSessionId: string;
    targetUserId: string;
    userId: string;
  }): Promise<AuthImpersonation> {
    const user = await this.userRepository.find(command.userId);
    const target = await this.userRepository.find(command.targetUserId);
    const impersonation = user.impersonate({
      authSessionId: command.authSessionId,
      now: this.clock.now(),
      target,
    });

    await this.userRepository.persist(user);
    return impersonation;
  }
}
