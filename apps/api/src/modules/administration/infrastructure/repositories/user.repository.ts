import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AdminUserRole } from '../../domain/admin-user-role';
import {
  User,
  UserDeactivated,
  UserDemotedFromAdmin,
  UserDisplayTitleUpdated,
  UserEmailUpdated,
  UserEvent,
  UserPasswordUpdated,
  UserPromotedToAdmin,
  UserReactivated,
  UserRoleUpdated,
  UsersUntitled,
} from '../../domain/user';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';
import { userStatusOf } from 'src/modules/shared/user-status.enum';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class UserRepository {
  constructor(private readonly db: Db) {}

  async findById(userId: string): Promise<User> {
    const user = await this.db.tx.user.findUnique({
      select: {
        deactivatedAt: true,
        duty: true,
        id: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { id: userId },
    });
    if (!user) throw new NotFoundException();

    return User.from({
      id: user.id,
      role: AdminUserRole.from({
        duty: user.duty,
        role: prismaRoleEnumToRoleEnum(user.role),
        title: user.title,
      }),
      status: userStatusOf(user),
    });
  }

  async findManyByLastName(lastNames: readonly string[]): Promise<Map<string, User>> {
    const users = await this.db.tx.user.findMany({
      select: {
        deactivatedAt: true,
        duty: true,
        id: true,
        lastName: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { lastName: { in: lastNames as string[], mode: 'insensitive' } },
    });

    return new Map(
      users.map((user) => [
        user.lastName.toUpperCase(),
        User.from({
          id: user.id,
          role: AdminUserRole.from({
            duty: user.duty,
            role: prismaRoleEnumToRoleEnum(user.role),
            title: user.title,
          }),
          status: userStatusOf(user),
        }),
      ]),
    );
  }

  @Transactional()
  async persistMany(users: User[]): Promise<void> {
    for (const user of users) await this.persistUser(user);
  }

  @Transactional()
  async persist(user: User): Promise<void> {
    await this.persistUser(user);
  }

  private async persistUser(user: User): Promise<void> {
    for (const message of user.messages as UserEvent[]) {
      if (message instanceof UserEmailUpdated) await this.persistEmailUpdated(message);
      else if (message instanceof UserPasswordUpdated) await this.persistPasswordUpdated(message);
      else if (message instanceof UserRoleUpdated) await this.persistRoleUpdated(message);
      else if (message instanceof UserDisplayTitleUpdated) await this.persistDisplayTitleUpdated(message);
      else if (message instanceof UsersUntitled) await this.persistUsersUntitled(message);
      else if (message instanceof UserPromotedToAdmin) await this.persistUserPromotedToAdmin(message);
      else if (message instanceof UserDemotedFromAdmin) await this.persistUserDemotedFromAdmin(message);
      else if (message instanceof UserDeactivated) await this.persistUserDeactivated(message);
      else if (message instanceof UserReactivated) await this.persistUserReactivated(message);
      else assertNever(message);
    }
  }

  private persistEmailUpdated(message: UserEmailUpdated) {
    return this.db.tx.user.update({
      data: { email: message.email },
      where: { id: message.userId },
    });
  }

  private persistPasswordUpdated(message: UserPasswordUpdated) {
    return this.db.tx.user.update({
      data: { password: message.hashedPassword },
      where: { id: message.userId },
    });
  }

  private persistRoleUpdated(message: UserRoleUpdated) {
    return this.db.tx.user.update({
      data: {
        duty: message.role.duty,
        role: roleEnumToPrismaRoleEnum(message.role.role),
        title: message.role.title,
      },
      where: { id: message.userId },
    });
  }

  private persistUsersUntitled(message: UsersUntitled) {
    return this.db.tx.user.updateMany({
      data: { duty: message.targetRole.duty, title: message.targetRole.title },
      where: { title: message.sourceTitle },
    });
  }

  private persistDisplayTitleUpdated(message: UserDisplayTitleUpdated) {
    return this.db.tx.user.update({
      data: { displayTitle: message.displayTitle },
      where: { id: message.userId },
    });
  }

  private persistUserPromotedToAdmin(message: UserPromotedToAdmin) {
    return this.db.tx.user.update({
      data: { role: 'ADMIN' },
      where: { id: message.userId },
    });
  }

  private persistUserDemotedFromAdmin(message: UserDemotedFromAdmin) {
    return this.db.tx.user.update({
      data: { role: 'ADJOINT_SECRETAIRE_GENERAL' },
      where: { id: message.userId },
    });
  }

  private persistUserDeactivated(message: UserDeactivated) {
    return this.db.tx.user.update({
      data: { deactivatedAt: message.deactivatedAt, deactivatedBy: message.deactivatedBy },
      where: { id: message.userId },
    });
  }

  private persistUserReactivated(message: UserReactivated) {
    return this.db.tx.user.update({
      data: { deactivatedAt: null, deactivatedBy: null },
      where: { id: message.userId },
    });
  }
}
