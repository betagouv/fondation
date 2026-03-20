import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUserDutyEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import {
  prismaRoleEnumToRoleEnum,
  roleEnumToPrismaRoleEnum,
} from 'src/modules/shared/mappers/role-enum.mapper';
import { assertNever } from 'src/utils/assert-never';
import {
  User,
  UserDisplayTitleUpdated,
  UserDutyUpdated,
  UserEmailUpdated,
  UserEvent,
  UserPasswordUpdated,
  UserRoleUpdated,
  UserTitleUpdated,
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
      title: user.title,
      duty: user.duty,
      role: prismaRoleEnumToRoleEnum(user.role),
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
          title: user.title,
          duty: user.duty,
          role: prismaRoleEnumToRoleEnum(user.role),
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
    return user.messages.flatMap((message: UserEvent) => {
      if (message instanceof UserEmailUpdated)
        return this.persistEmailUpdated(message);
      if (message instanceof UserPasswordUpdated)
        return this.persistPasswordUpdated(message);
      if (message instanceof UserRoleUpdated)
        return this.persistRoleUpdated(message);
      if (message instanceof UserDutyUpdated)
        return this.persistDutyUpdated(message);
      if (message instanceof UserDisplayTitleUpdated)
        return this.persistDisplayTitleUpdated(message);
      if (message instanceof UserTitleUpdated)
        return this.persistTitleUpdated(message);

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
      data: { role: roleEnumToPrismaRoleEnum(message.role) },
    });
  }

  private persistDutyUpdated(message: UserDutyUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { duty: message.duty as PrismaUserDutyEnum | null },
    });
  }

  private persistDisplayTitleUpdated(message: UserDisplayTitleUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { displayTitle: message.displayTitle },
    });
  }

  private persistTitleUpdated(message: UserTitleUpdated) {
    if (message.title === null) {
      return [
        this.prisma.user.update({
          where: { id: message.userId },
          data: { title: null },
        }),
      ];
    }

    return [
      this.prisma.user.update({
        where: { title: message.title },
        data: { title: null, duty: null },
      }),
      this.prisma.user.update({
        where: { id: message.userId },
        data: { title: message.title },
      }),
    ];
  }
}
