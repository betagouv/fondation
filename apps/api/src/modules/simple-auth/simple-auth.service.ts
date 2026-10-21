import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Clock } from '../framework/clock';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';

import { AuthImpersonation } from './domain/auth-impersonation';
import { AuthSession } from './domain/auth-session';
import { AuthUser, AuthUserNotAuthentifiable } from './domain/auth-user';
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

  findUserFromValidSession(sessionId: string): Promise<{ id: string; role: string } | null> {
    return this.detailsUserFromSessionQuery.handle({ sessionId });
  }

  findImpersonatedUser(impersonation: {
    id: string;
    authSessionId: string;
  }): Promise<{ id: string; role: string; impersonatorId: string } | null> {
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
    userId: string;
    impersonationId: string | undefined;
  }): Promise<DetailedUserResponseDto> {
    return this.detailsUserQuery.handle(query);
  }

  listUsers(query: {
    activeOnly?: true;
    search?: string;
    roles?: readonly RoleEnum[];
    includeIds?: readonly string[];
    excludeIds?: readonly string[];
    includeIdsOnly?: true;
    limit?: number;
  }): Promise<ListedUsersDto> {
    return this.listUsersQuery.handle(query);
  }

  async unAuthenticate(command: { userId: string; sessionId: string }): Promise<void> {
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

  async unImpersonate(command: { userId: string; impersonationId: string }): Promise<void> {
    const user = await this.userRepository.find(command.userId);
    user.unImpersonate({ impersonationId: command.impersonationId });
    await this.userRepository.persist(user);
  }

  async registerUser(command: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: RoleEnum;
    gender: GenderEnum;
  }): Promise<{ id: string }> {
    const user = await AuthUser.register({
      ...command,
      password: await this.passwordHasher.hash(command.password),
    });
    await this.userRepository.persist(user);
    return { id: user.id };
  }

  async internalHashPassword(plain: string): Promise<string> {
    const password = await this.passwordHasher.hash(plain);
    return password.toString();
  }

  async impersonate(command: {
    userId: string;
    authSessionId: string;
    targetUserId: string;
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
