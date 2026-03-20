import { Injectable } from '@nestjs/common';
import { Role } from 'shared-models';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { User } from './domain/user';
import { UserDuty, UserTitle } from './domain/user-enum';
import { ListUsersQueryDto } from './infrastructure/dto/administration.dto';
import {
  DetailedAdminUserDto,
  DetailsUserQuery,
} from './infrastructure/queries/details-user.query';
import {
  ListUsersQuery,
  PaginatedAdminUserListItemDto,
} from './infrastructure/queries/list-users.query';
import { UserRepository } from './infrastructure/repositories/user.repository';

@Injectable()
export class AdministrationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly listUsersQuery: ListUsersQuery,
    private readonly detailsUserQuery: DetailsUserQuery,
  ) {}

  listUsers(query: {
    search?: string;
    roles?: Role[];
    sorting: Sortable<ListUsersQueryDto>;
    pagination: Pagination;
  }): Promise<PaginatedAdminUserListItemDto> {
    return this.listUsersQuery.handle(query);
  }

  detailsUser(query: { userId: string }): Promise<DetailedAdminUserDto> {
    return this.detailsUserQuery.handle(query);
  }

  async updateEmail(command: { userId: string; email: string }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateEmail(command.email);
    await this.userRepository.persist(user);
  }

  async updatePassword(command: {
    userId: string;
    password: string;
  }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    await user.updatePassword(command.password);
    await this.userRepository.persist(user);
  }

  async updateRole(command: { userId: string; role: Role }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateRole(command.role);
    await this.userRepository.persist(user);
  }

  async updateTitle(command: {
    userId: string;
    title: UserTitle | null;
  }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateTitle(command.title);
    await this.userRepository.persist(user);
  }

  async updateDuty(command: {
    userId: string;
    duty: UserDuty | null;
  }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateDuty(command.duty);
    await this.userRepository.persist(user);
  }

  async updateDisplayTitle(command: {
    userId: string;
    displayTitle: string | null;
  }): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    user.updateDisplayTitle(command.displayTitle);
    await this.userRepository.persist(user);
  }

  async batchUpdateDisplayTitles(
    entries: readonly { lastName: string; displayTitle: string | null }[],
  ): Promise<{ notFound: string[]; updatedCount: number }> {
    const lastNames = entries.map(({ lastName }) => lastName);
    const usersByLastName =
      await this.userRepository.findManyByLastName(lastNames);

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
}
