import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { Gender } from 'shared-models';
import {
  PrismaUserDutyEnum,
  PrismaUserTitleEnum,
} from 'src/generated/prisma/enums';
import {
  UserDutyEnum,
  UserTitleEnum,
} from 'src/modules/administration/domain/user-enum';
import { PrismaService } from 'src/modules/framework/database';
import { prismaGenderEnumToGenderEnum } from 'src/modules/shared/mappers/gender-enum.mapper';
import z from 'zod';

@Injectable()
export class ListSecretariesGeneralQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(): Promise<ListedSecretariesGeneralDto> {
    const secretaries = await this.prisma.user.findMany({
      where: { duty: 'SECRETARY' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayTitle: true,
        duty: true,
        title: true,
        gender: true,
      },
    });

    return {
      items: secretaries
        .filter(ListSecretariesGeneralQuery.isSecretary)
        .map(({ gender, ...s }) => ({
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
    return (
      value.duty === 'SECRETARY' &&
      [null, 'FIRST_SECRETARY'].includes(value.title)
    );
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
        gender: z.enum(Gender),
      }),
    ),
  }),
) {}
