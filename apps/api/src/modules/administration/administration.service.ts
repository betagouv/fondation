import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Clock } from 'src/modules/framework/clock';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { UserStatus } from 'src/modules/shared/user-status.enum';
import { SimpleAuthService } from 'src/modules/simple-auth';

import { User } from './domain/user';
import { AdminUserRoleEnum } from './domain/user-enum';
import { ListUsersQueryDto } from './infrastructure/dto/administration.dto';
import { DetailedAdminUserDto, DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { ListUsersQuery, PaginatedAdminUserListItemDto } from './infrastructure/queries/list-users.query';
import { UserRepository } from './infrastructure/repositories/user.repository';

@Injectable()
export class AdministrationService {
  constructor(
    private readonly auth: SimpleAuthService,
    private readonly clock: Clock,
    private readonly userRepository: UserRepository,
    private readonly listUsersQuery: ListUsersQuery,
    private readonly detailsUserQuery: DetailsUserQuery,
  ) {}

  listUsers(query: {
    search?: string;
    roles?: AdminUserRoleEnum[];
    statuses?: UserStatus[];
    sorting: Sortable<ListUsersQueryDto>;
    pagination: Pagination;
  }): Promise<PaginatedAdminUserListItemDto> {
    return this.listUsersQuery.handle(query);
  }

  detailsUser(query: { actorId: string; userId: string }): Promise<DetailedAdminUserDto> {
    return this.detailsUserQuery.handle(query);
  }

  async updateEmail(command: { userId: string; email: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateEmail(command.email);
    await this.userRepository.persist(user);
  }

  @Transactional()
  async updatePassword(command: { actorSessionId: string; password: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    await user.updatePassword(command.password);
    await this.userRepository.persist(user);
    // an admin changing their own password stays logged in
    await this.auth.internalRevokeSessions({ keptSessionId: command.actorSessionId, userId: command.userId });
  }

  async updateRole(command: { userId: string; role: AdminUserRoleEnum }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateRole(command.role);
    await this.userRepository.persist(user);
  }

  async updateDisplayTitle(command: { userId: string; displayTitle: string | null }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateDisplayTitle(command.displayTitle);
    await this.userRepository.persist(user);
  }

  async batchUpdateDisplayTitles(
    entries: readonly { lastName: string; displayTitle: string | null }[],
  ): Promise<{ notFound: string[]; updatedCount: number }> {
    const lastNames = entries.map(({ lastName }) => lastName);
    const usersByLastName = await this.userRepository.findManyByLastName(lastNames);

    const toUpdate: User[] = [];
    const notFound: string[] = [];

    for (const { lastName, displayTitle } of entries) {
      const user = usersByLastName.get(lastName.toUpperCase());
      if (!user) {
        notFound.push(lastName);
        continue;
      }

      user.updateDisplayTitle(displayTitle);
      toUpdate.push(user);
    }

    if (toUpdate.length > 0) await this.userRepository.persistMany(toUpdate);

    return { notFound, updatedCount: toUpdate.length };
  }

  async promoteToAdmin(command: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.promoteAdmin();
    await this.userRepository.persist(user);
  }

  @Transactional()
  async deactivate(command: { actorId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.deactivate({ actorId: command.actorId, now: this.clock.now() });
    await this.userRepository.persist(user);
    await this.auth.internalRevokeSessions({ keptSessionId: undefined, userId: command.userId });
  }

  async reactivate(command: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.reactivate();
    await this.userRepository.persist(user);
  }

  async demoteFromAdmin(command: { userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.demoteAdmin();
    await this.userRepository.persist(user);
  }
}
