import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { Db } from 'src/modules/framework/database';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import { UserDutyEnum } from 'src/modules/shared/user-duty.enum';
import { UserTitleEnum } from 'src/modules/shared/user-title.enum';

@Injectable()
export class ListSecretariesGeneralQuery {
  constructor(private readonly db: Db) {}

  async handle(): Promise<ListedSecretariesGeneralDto> {
    const secretaries = await this.db.tx.user.findMany({
      select: {
        displayTitle: true,
        duty: true,
        firstName: true,
        gender: true,
        id: true,
        lastName: true,
        title: true,
      } satisfies Prisma.UserSelect,
      where: { deactivatedAt: null, duty: 'SECRETARY' },
    });

    return {
      items: secretaries.filter(ListSecretariesGeneralQuery.isSecretary).map(({ gender, ...s }) => ({
        ...s,
        gender: prismaGenderEnumToGenderEnum(gender),
      })),
    };
  }

  private static isSecretary<
    T extends {
      duty: PrismaUserDutyEnum | null;
      title: PrismaUserTitleEnum | null;
    },
  >(
    this: void,
    value: T,
  ): value is T & {
    duty: 'SECRETARY';
    title: 'FIRST_SECRETARY' | null;
  } {
    return value.duty === 'SECRETARY' && [null, 'FIRST_SECRETARY'].includes(value.title);
  }
}

export class ListedSecretariesGeneralDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        displayTitle: z.string().nullable(),
        title: z.enum(['FIRST_SECRETARY'] satisfies UserTitleEnum[]).nullable(),
        duty: z.enum(['SECRETARY'] satisfies UserDutyEnum[]),
        gender: z.enum(GenderEnum),
      }),
    ),
  }),
) {}
