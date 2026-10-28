import { Transactional } from '@nestjs-cls/transactional';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { Db } from '../../../framework/database';
import { prismaRoleEnumToRoleEnum, roleEnumToPrismaRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { userStatusOf } from '../../../shared/user-status.enum';
import { AdminUserRole } from '../../domain/admin-user-role';
import {
  EmailAlreadyTaken,
  User,
  UserDeactivated,
  UserDemotedFromAdmin,
  UserDisplayTitleUpdated,
  UserEmailUpdated,
  UserEvent,
  UserPasswordUpdated,
  UserPromotedToAdmin,
  UserReactivated,
  UserRegistered,
  UserRoleUpdated,
  UsersUntitled,
} from '../../domain/user';

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

@Injectable()
export class UserRepository {
  constructor(private readonly db: Db) {}

  async findById(userId: string): Promise<User> {
    const user = await this.db.tx.user.findUnique({
      select: {
        deactivatedAt: true,
        duty: true,
        id: true,
        isAdmin: true,
        role: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { id: userId },
    });
    if (!user) throw new NotFoundException();

    return User.from({
      id: user.id,
      isAdmin: user.isAdmin,
      role: AdminUserRole.from({
        duty: user.duty,
        role: prismaRoleEnumToRoleEnum(user.role),
        title: user.title,
      }),
      status: userStatusOf(user),
    });
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.db.tx.user.findFirst({
      select: { id: true } satisfies Prisma.UserSelect,
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    return !!user;
  }

  async isEmailTakenByAnotherUser(predicate: { email: string; userId: string }): Promise<boolean> {
    const user = await this.db.tx.user.findFirst({
      select: { id: true } satisfies Prisma.UserSelect,
      where: { email: { equals: predicate.email, mode: 'insensitive' }, id: { not: predicate.userId } },
    });

    return !!user;
  }

  async findManyByLastName(lastNames: readonly string[]): Promise<Map<string, User>> {
    const users = await this.db.tx.user.findMany({
      select: {
        deactivatedAt: true,
        duty: true,
        id: true,
        isAdmin: true,
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
          isAdmin: user.isAdmin,
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
      if (message instanceof UserRegistered) await this.persistUserRegistered(message);
      else if (message instanceof UserEmailUpdated) await this.persistEmailUpdated(message);
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

  /** the title is given by the role update that follows, to tell a concurrent request taking the email from one taking the title */
  private async persistUserRegistered(message: UserRegistered) {
    await this.db.tx.user
      .create({
        data: {
          createdAt: message.registeredAt,
          email: message.email,
          firstName: message.firstName,
          gender: message.gender,
          id: message.userId,
          isAdmin: message.isAdmin,
          lastName: message.lastName,
          password: message.hashedPassword,
          role: roleEnumToPrismaRoleEnum(message.role.role),
        },
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err)) throw new EmailAlreadyTaken();
        throw err;
      });
    await this.db.tx.userStatusChange.create({
      data: {
        changedAt: message.registeredAt,
        changedBy: message.registeredBy,
        status: 'ACTIVE',
        userId: message.userId,
      },
    });
    if (!message.isAdmin) return;

    await this.db.tx.adminRightChange.create({
      data: {
        change: 'GRANTED',
        changedAt: message.registeredAt,
        changedBy: message.registeredBy,
        userId: message.userId,
      },
    });
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

  // a concurrent request gave the same title to another account, which a retry takes back
  private persistRoleUpdated(message: UserRoleUpdated) {
    return this.db.tx.user
      .update({
        data: {
          duty: message.role.duty,
          role: roleEnumToPrismaRoleEnum(message.role.role),
          title: message.role.title,
        },
        where: { id: message.userId },
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err)) throw new ConflictException();
        throw err;
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

  /** the conditions on the current state keep a concurrent request from recording the same change twice */
  private async persistUserPromotedToAdmin(message: UserPromotedToAdmin) {
    const { count } = await this.db.tx.user.updateMany({
      data: { isAdmin: true },
      where: { id: message.userId, isAdmin: false },
    });
    if (count === 0) return;

    await this.db.tx.adminRightChange.create({
      data: {
        change: 'GRANTED',
        changedAt: message.promotedAt,
        changedBy: message.promotedBy,
        userId: message.userId,
      },
    });
  }

  private async persistUserDemotedFromAdmin(message: UserDemotedFromAdmin) {
    const { count } = await this.db.tx.user.updateMany({
      data: { isAdmin: false },
      where: { id: message.userId, isAdmin: true },
    });
    if (count === 0) return;

    await this.db.tx.adminRightChange.create({
      data: {
        change: 'REVOKED',
        changedAt: message.demotedAt,
        changedBy: message.demotedBy,
        userId: message.userId,
      },
    });
  }

  private async persistUserDeactivated(message: UserDeactivated) {
    const { count } = await this.db.tx.user.updateMany({
      data: { deactivatedAt: message.deactivatedAt },
      where: { deactivatedAt: null, id: message.userId },
    });
    if (count === 0) return;

    await this.db.tx.userStatusChange.create({
      data: {
        changedAt: message.deactivatedAt,
        changedBy: message.deactivatedBy,
        status: 'DEACTIVATED',
        userId: message.userId,
      },
    });
  }

  private async persistUserReactivated(message: UserReactivated) {
    const { count } = await this.db.tx.user.updateMany({
      data: { deactivatedAt: null },
      where: { deactivatedAt: { not: null }, id: message.userId },
    });
    if (count === 0) return;

    await this.db.tx.userStatusChange.create({
      data: {
        changedAt: message.reactivatedAt,
        changedBy: message.reactivatedBy,
        status: 'ACTIVE',
        userId: message.userId,
      },
    });
  }
}
