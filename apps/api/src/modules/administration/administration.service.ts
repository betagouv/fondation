import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Clock } from '../framework/clock';
import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';
import { AdminUserRoleEnum } from '../shared/admin-user-role.enum';
import { GenderEnum } from '../shared/gender.enum';
import type { RoleEnum } from '../shared/role.enum';
import { UserStatus } from '../shared/user-status.enum';
import { SimpleAuthService } from '../simple-auth';

import { AdminUserRole } from './domain/admin-user-role';
import { User } from './domain/user';
import {
  ListedAdminUserRolesDto,
  listedAdminUserRoles,
  ListUsersQueryDto,
} from './infrastructure/dto/administration.dto';
import { DetailedAdminUserDto, DetailsUserQuery } from './infrastructure/queries/details-user.query';
import {
  ListTitleHoldersQuery,
  ListedTitleHoldersDto,
} from './infrastructure/queries/list-title-holders.query';
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
    private readonly listTitleHoldersQuery: ListTitleHoldersQuery,
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

  listRoles(query: { gender?: GenderEnum }): ListedAdminUserRolesDto {
    return listedAdminUserRoles(query.gender);
  }

  listTitleHolders(): Promise<ListedTitleHoldersDto> {
    return this.listTitleHoldersQuery.handle();
  }

  async createUser(command: {
    actorId: string;
    email: string;
    firstName: string;
    gender: GenderEnum;
    lastName: string;
    password: string;
    role: AdminUserRoleEnum;
  }): Promise<{ id: string }> {
    return this.register({
      ...command,
      hashedPassword: await this.auth.internalHashPassword(command.password),
      isAdmin: false,
      registeredBy: command.actorId,
      role: AdminUserRole.ofNewAccount(command.role),
    });
  }

  /** for the CLI and the development route, which register an account outside the administration */
  async registerUser(command: {
    email: string;
    firstName: string;
    gender: GenderEnum;
    isAdmin: boolean;
    lastName: string;
    password: string;
    role: RoleEnum;
  }): Promise<{ id: string }> {
    return this.register({
      ...command,
      hashedPassword: await this.auth.internalHashPassword(command.password),
      registeredBy: null,
      role: AdminUserRole.from({ duty: null, role: command.role, title: null }),
    });
  }

  // the password is hashed before, for the slow hash not to hold a connection of the pool
  @Transactional()
  private async register(command: {
    email: string;
    firstName: string;
    gender: GenderEnum;
    hashedPassword: string;
    isAdmin: boolean;
    lastName: string;
    registeredBy: string | null;
    role: AdminUserRole;
  }): Promise<{ id: string }> {
    User.assertEmailFree(await this.userRepository.isEmailTaken(command.email));

    const user = User.register({ ...command, now: this.clock.now() });
    await this.userRepository.persist(user);
    return { id: user.id };
  }

  @Transactional()
  async updateName(command: { firstName: string; lastName: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateName(command);
    await this.userRepository.persist(user);
  }

  @Transactional()
  async updateEmail(command: { userId: string; email: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateEmail({
      email: command.email,
      isTakenByAnotherUser: await this.userRepository.isEmailTakenByAnotherUser(command),
    });
    await this.userRepository.persist(user);
  }

  async updatePassword(command: { actorSessionId: string; password: string; userId: string }): Promise<void> {
    await this.updateHashedPassword({
      ...command,
      hashedPassword: await this.auth.internalHashPassword(command.password),
    });
  }

  // the password is hashed before, for the slow hash not to hold a connection of the pool
  @Transactional()
  private async updateHashedPassword(command: {
    actorSessionId: string;
    hashedPassword: string;
    userId: string;
  }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updatePassword(command.hashedPassword);
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

  @Transactional()
  async promoteToAdmin(command: { actorId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.promoteAdmin({ actorId: command.actorId, now: this.clock.now() });
    await this.userRepository.persist(user);
  }

  @Transactional()
  async deactivate(command: { actorId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.deactivate({ actorId: command.actorId, now: this.clock.now() });
    await this.userRepository.persist(user);
    await this.auth.internalRevokeSessions({ keptSessionId: undefined, userId: command.userId });
  }

  @Transactional()
  async reactivate(command: { actorId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.reactivate({ actorId: command.actorId, now: this.clock.now() });
    await this.userRepository.persist(user);
  }

  @Transactional()
  async demoteFromAdmin(command: { actorId: string; userId: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.demoteAdmin({ actorId: command.actorId, now: this.clock.now() });
    await this.userRepository.persist(user);
  }
}
