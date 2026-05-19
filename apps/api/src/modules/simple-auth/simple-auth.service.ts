import { Injectable } from '@nestjs/common';

import { Gender, Role } from 'shared-models';

import { Clock } from '../framework/clock';

import { AuthImpersonation } from './domain/auth-impersonation';
import { AuthSession } from './domain/auth-session';
import { AuthUser } from './domain/auth-user';
import { DetailsUserFromImpersonationQuery } from './infrastructure/queries/details-user-from-impesronation-id.query';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import { DetailedUserResponseDto, DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { FindMachineQuery } from './infrastructure/queries/find-machine.query';
import { ListedUsersDto, ListUsersQuery } from './infrastructure/queries/list-users.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class SimpleAuthService {
  constructor(
    private readonly detailsUserQuery: DetailsUserQuery,
    private readonly detailsUserFromSessionQuery: DetailsUserFromSessionIdQuery,
    private readonly detailsUserFromImpersonationQuery: DetailsUserFromImpersonationQuery,
    private readonly listUsersQuery: ListUsersQuery,
    private readonly userRepository: AuthUserRepository,
    private readonly findMachineQuery: FindMachineQuery,
    private readonly clock: Clock,
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
    const user = await this.userRepository.findByEmail(command.email.toLowerCase());
    const session = await user.authenticate({
      plainPassword: command.password,
      now: this.clock.now(),
    });
    await this.userRepository.persist(user);
    return session;
  }

  detailsUser(query: {
    tx?: Prisma.TransactionClient;
    userId: string;
    impersonationId: string | undefined;
  }): Promise<DetailedUserResponseDto> {
    return this.detailsUserQuery.handle(query);
  }

  listUsers(query: {
    search?: string;
    roles?: readonly Role[];
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
    role: Role;
    gender: Gender;
  }): Promise<{ id: string }> {
    const user = await AuthUser.register(command);
    await this.userRepository.persist(user);
    return { id: user.id };
  }

  async impersonate(command: {
    userId: string;
    authSessionId: string;
    targetUserId: string;
  }): Promise<AuthImpersonation> {
    const user = await this.userRepository.find(command.userId);
    const impersonation = user.impersonate({
      authSessionId: command.authSessionId,
      userId: command.targetUserId,
      now: this.clock.now(),
    });

    await this.userRepository.persist(user);
    return impersonation;
  }
}
