import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, Pagination } from 'src/modules/framework/pagination';
import { NominationFileOutcome } from 'src/modules/session/shared/types/nomination-file-outcome';
import { SESSION_STATUSES } from 'src/modules/session/transparence/infrastructure/finders/hydrated-nomination-files.finder';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class ListMagistratNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: TransparenceService,
  ) {}

  async handle(query: {
    magistratId: string;
    pagination: Pagination;
  }): Promise<ListedMagistratNominationFilesDto> {
    return this.prisma.$transaction(async (tx) => {
      const magistrat = await tx.magistrat.findUnique({
        where: { id: query.magistratId },
        select: { id: true },
      });
      if (!magistrat) throw new NotFoundException();

      return this.sessions.internalListMagistratNominationFiles({
        magistratId: query.magistratId,
        pagination: query.pagination,
      });
    });
  }
}

export const MagistratNominationFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number().int().nullable(),
  reporters: z.array(z.object({ id: z.string(), firstName: z.string(), lastName: z.string() })),
  session: z.object({
    id: z.string(),
    name: z.string(),
    formation: z.enum(FormationEnum),
    date: dateOnlyJsonSchema,
    status: z.enum(SESSION_STATUSES),
  }),
  auditionDate: dateOnlyJsonSchema.nullable(),
  auditionTime: timeOnlySchema.nullable(),
  targetedGrade: z.string().nullable(),
  targetedPosition: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      comment: z.string().nullable(),
    })
    .nullable(),
});

export class ListedMagistratNominationFilesDto extends createPaginatedZodDto(MagistratNominationFileSchema) {}
