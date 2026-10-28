import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Clock } from '../framework/clock';
import type { RoleEnum } from '../shared/role.enum';

import { AuthImpersonation } from './domain/auth-impersonation';
import { AuthSession } from './domain/auth-session';
import { AuthUserNotAuthentifiable } from './domain/auth-user';
import { PasswordHasher } from './infrastructure/password-hasher';
import { DetailsUserFromImpersonationQuery } from './infrastructure/queries/details-user-from-impesronation-id.query';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import { DetailedUserResponseDto, DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { FindMachineQuery } from './infrastructure/queries/find-machine.query';
import { ListedUsersDto, ListUsersQuery } from './infrastructure/queries/list-users.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { OpenIdAuthService } from './openid-auth.service';

@Injectable()
export class SimpleAuthService {
  constructor(
    readonly openId: OpenIdAuthService,
    private readonly detailsUserQuery: DetailsUserQuery,
    private readonly detailsUserFromSessionQuery: DetailsUserFromSessionIdQuery,
    private readonly detailsUserFromImpersonationQuery: DetailsUserFromImpersonationQuery,
    private readonly listUsersQuery: ListUsersQuery,
    private readonly userRepository: AuthUserRepository,
    private readonly findMachineQuery: FindMachineQuery,
    private readonly clock: Clock,
    private readonly passwordHasher: PasswordHasher,
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

  async login(command: { email: string; password: string }): Promise<AuthSession> {
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

  listUsers(query: {
    activeOnly?: true;
    excludeIds?: readonly string[];
    includeIds?: readonly string[];
    includeIdsOnly?: true;
    limit?: number;
    roles?: readonly RoleEnum[];
    search?: string;
  }): Promise<ListedUsersDto> {
    return this.listUsersQuery.handle(query);
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
