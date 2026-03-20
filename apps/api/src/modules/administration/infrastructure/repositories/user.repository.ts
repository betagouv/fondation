import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { prismaRoleEnumToRoleEnum, roleEnumToPrismaRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { assertNever } from 'src/utils/assert-never';
import {
  User,
  UserDutyUpdated,
  UserDisplayTitleUpdated,
  UserEmailUpdated,
  UserEvent,
  UserPasswordUpdated,
  UserRoleUpdated,
  UserTitleUpdated,
  toUserTitle,
  toUserDuty,
} from '../../domain/user';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        role: true,
        title: true,
        duty: true,
        displayTitle: true,
      },
      where: { id: userId },
    });
    if (!user) throw new NotFoundException();

    return User.from({
      id: user.id,
      email: user.email,
      role: prismaRoleEnumToRoleEnum(user.role),
      title: toUserTitle(user.title ?? null),
      duty: toUserDuty(user.duty ?? null),
      displayTitle: user.displayTitle ?? null,
    });
  }

  async persist(user: User): Promise<void> {
    await this.prisma.$transaction(
      user.messages.flatMap((message: UserEvent) => {
        if (message instanceof UserEmailUpdated) return this.persistEmailUpdated(message);
        if (message instanceof UserPasswordUpdated) return this.persistPasswordUpdated(message);
        if (message instanceof UserRoleUpdated) return this.persistRoleUpdated(message);
        if (message instanceof UserDutyUpdated) return this.persistDutyUpdated(message);
        if (message instanceof UserDisplayTitleUpdated) return this.persistDisplayTitleUpdated(message);
        if (message instanceof UserTitleUpdated) return this.persistTitleUpdated(message);
        return assertNever(message);
      }),
    );
  }

  private persistEmailUpdated(message: UserEmailUpdated) {
    return this.prisma.user.update({ where: { id: message.userId }, data: { email: message.email } });
  }

  private persistPasswordUpdated(message: UserPasswordUpdated) {
    return this.prisma.user.update({ where: { id: message.userId }, data: { password: message.hashedPassword } });
  }

  private persistRoleUpdated(message: UserRoleUpdated) {
    return this.prisma.user.update({ where: { id: message.userId }, data: { role: roleEnumToPrismaRoleEnum(message.role) } });
  }

  private persistDutyUpdated(message: UserDutyUpdated) {
    return this.prisma.user.update({ where: { id: message.userId }, data: { duty: message.duty as PrismaUserDutyEnum | null } });
  }

  private persistDisplayTitleUpdated(message: UserDisplayTitleUpdated) {
    return this.prisma.user.update({ where: { id: message.userId }, data: { displayTitle: message.displayTitle } });
  }

  private persistTitleUpdated(message: UserTitleUpdated) {
    if (message.title === null) {
      return [this.prisma.user.update({ where: { id: message.userId }, data: { title: null } })];
    }
    return [
      this.prisma.user.updateMany({
        where: { title: message.title as PrismaUserTitleEnum },
        data: { title: null, duty: null },
      }),
      this.prisma.user.update({
        where: { id: message.userId },
        data: { title: message.title as PrismaUserTitleEnum, duty: message.duty as PrismaUserDutyEnum },
      }),
    ];
  }
}
