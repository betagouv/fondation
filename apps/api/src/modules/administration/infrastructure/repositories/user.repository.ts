import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';
import { assertNever } from 'src/utils/assert-never';
import { AdminUserRole } from '../../domain/admin-user-role';
import {
  User,
  UserDemotedFromAdmin,
  UserDisplayTitleUpdated,
  UserEmailUpdated,
  UserEvent,
  UserPasswordUpdated,
  UserPromotedToAdmin,
  UserRoleUpdated,
  UsersUntitled,
} from '../../domain/user';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        title: true,
        duty: true,
      },
    });
    if (!user) throw new NotFoundException();

    return User.from({
      id: user.id,
      role: AdminUserRole.from({
        role: prismaRoleEnumToRoleEnum(user.role),
        title: user.title,
        duty: user.duty,
      }),
    });
  }

  async findManyByLastName(
    lastNames: readonly string[],
  ): Promise<Map<string, User>> {
    const users = await this.prisma.user.findMany({
      where: { lastName: { in: lastNames as string[], mode: 'insensitive' } },
      select: { id: true, lastName: true, role: true, title: true, duty: true },
    });

    return new Map(
      users.map((user) => [
        user.lastName.toUpperCase(),
        User.from({
          id: user.id,
          role: AdminUserRole.from({
            role: prismaRoleEnumToRoleEnum(user.role),
            title: user.title,
            duty: user.duty,
          }),
        }),
      ]),
    );
  }

  async persistMany(users: User[]): Promise<void> {
    await this.prisma.$transaction(
      users.flatMap((user) => this.persistUser(user)),
    );
  }

  async persist(user: User): Promise<void> {
    await this.prisma.$transaction(this.persistUser(user));
  }

  private persistUser(user: User) {
    return user.messages.map((message: UserEvent) => {
      if (message instanceof UserEmailUpdated)
        return this.persistEmailUpdated(message);
      if (message instanceof UserPasswordUpdated)
        return this.persistPasswordUpdated(message);
      if (message instanceof UserRoleUpdated)
        return this.persistRoleUpdated(message);
      if (message instanceof UserDisplayTitleUpdated)
        return this.persistDisplayTitleUpdated(message);
      if (message instanceof UsersUntitled)
        return this.persistUsersUntitled(message);
      if (message instanceof UserPromotedToAdmin)
        return this.persistUserPromotedToAdmin(message);
      if (message instanceof UserDemotedFromAdmin)
        return this.persistUserDemotedFromAdmin(message);

      return assertNever(message);
    });
  }

  private persistEmailUpdated(message: UserEmailUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { email: message.email },
    });
  }

  private persistPasswordUpdated(message: UserPasswordUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { password: message.hashedPassword },
    });
  }

  private persistRoleUpdated(message: UserRoleUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: {
        role: roleEnumToPrismaRoleEnum(message.role.role),
        duty: message.role.duty,
        title: message.role.title,
      },
    });
  }

  private persistUsersUntitled(message: UsersUntitled) {
    return this.prisma.user.updateMany({
      where: { title: message.sourceTitle },
      data: { title: message.targetRole.title, duty: message.targetRole.duty },
    });
  }

  private persistDisplayTitleUpdated(message: UserDisplayTitleUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { displayTitle: message.displayTitle },
    });
  }

  private persistUserPromotedToAdmin(message: UserPromotedToAdmin) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { role: 'ADMIN' },
    });
  }

  private persistUserDemotedFromAdmin(message: UserDemotedFromAdmin) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { role: 'ADJOINT_SECRETAIRE_GENERAL' },
    });
  }
}
