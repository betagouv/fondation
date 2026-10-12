import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PrismaUserDutyEnum, PrismaUserTitleEnum } from 'src/generated/prisma/enums';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';

export class CreateOfficialReportJusticeContactDto extends createZodDto(
  z
    .object({
      name: z.string().trim().nonempty(),
    })
    .meta({ deprecated: true }),
) {}

export class CreateJusticeContactDto extends createZodDto(
  z.object({
    name: z.string().trim().nonempty(),
  }),
) {}

export class CreatedOfficialReportJusticeContactDto extends createZodDto(
  z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .meta({ deprecated: true }),
) {}

export class CreatedJusticeContactDto extends createZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
) {}

export class SearchJusticeContactsQueryDto extends createZodDto(
  z.object({ search: z.string().default('') }),
) {}

export class FindDocsMembersQueryDto extends createZodDto(z.object({ formation: z.enum(FormationEnum) })) {}

export class FoundDocsMembersDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        gender: z.enum(GenderEnum),
        title: z.enum(PrismaUserTitleEnum).nullable(),
        displayTitle: z.string().nullable(),
        duty: z.enum(PrismaUserDutyEnum).nullable(),
      }),
    ),
  }),
) {}
