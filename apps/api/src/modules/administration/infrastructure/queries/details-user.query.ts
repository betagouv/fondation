import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { Role } from 'shared-models';
import z from 'zod';
import { PrismaService } from 'src/modules/framework/database';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { USER_DUTIES, USER_TITLES, UserDuty, UserTitle } from '../../domain/user';

@Injectable()
export class DetailsUserQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { userId: string }): Promise<DetailedAdminUserDto> {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        title: true,
        duty: true,
        displayTitle: true,
      },
      where: { id: query.userId },
    });
    if (!user) throw new NotFoundException();

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: prismaRoleEnumToRoleEnum(user.role),
      title: (user.title ?? null) as UserTitle | null,
      duty: (user.duty ?? null) as UserDuty | null,
      displayTitle: user.displayTitle ?? null,
    };
  }
}

export class DetailedAdminUserDto extends createZodDto(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.enum(Role),
    title: z.enum(USER_TITLES).nullable(),
    duty: z.enum(USER_DUTIES).nullable(),
    displayTitle: z.string().nullable(),
  }),
) {}
