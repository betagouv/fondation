import { Injectable } from '@nestjs/common';

import { Clock } from '../framework/clock';

import { Gender, Role } from 'shared-models';
import { AuthSession } from './domain/auth-session';
import { AuthUser } from './domain/auth-user';
import { DetailsUserFromSessionIdQuery } from './infrastructure/queries/details-user-from-session-id.query';
import {
  DetailedUserResponseDto,
  DetailsUserQuery,
} from './infrastructure/queries/details-user.query';
import {
  ListedUsersDto,
  ListUsersQuery,
} from './infrastructure/queries/list-users.query';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';

@Injectable()
export class SimpleAuthService {
  constructor(
    private readonly detailsUserQuery: DetailsUserQuery,
    private readonly detailsUserFromSessionQuery: DetailsUserFromSessionIdQuery,
    private readonly listUsersQuery: ListUsersQuery,
    private readonly userRepository: AuthUserRepository,
    private readonly clock: Clock,
  ) {}

  async findUserFromValidSession(
    sessionId: string,
  ): Promise<{ id: string; role: string } | null> {
    return this.detailsUserFromSessionQuery.handle({ sessionId });
  }

  async login(command: {
    email: string;
    password: string;
  }): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(
      command.email.toLowerCase(),
    );
    const session = await user.authenticate({
      plainPassword: command.password,
      now: this.clock.now(),
    });
    await this.userRepository.persist(user);
    return session;
  }

  detailsUser(query: { userId: string }): Promise<DetailedUserResponseDto> {
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

  async unAuthenticate(command: {
    userId: string;
    sessionId: string;
  }): Promise<void> {
    const user = await this.userRepository.find(command.userId);
    user.unAuthenticate(command.sessionId);
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
}
