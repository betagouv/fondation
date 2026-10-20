import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { dateOnlyJsonSchema } from '../../../../utils/date-only';
import { timeOnlySchema } from '../../../../utils/time-only';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, Pagination } from '../../../framework/pagination';
import { SESSION_STATUSES } from '../../../session/transparence/infrastructure/finders/hydrated-nomination-files.finder';
import { TransparenceService } from '../../../session/transparence/infrastructure/transparence.service';
import { FormationEnum } from '../../../shared/formation.enum';
import { NominationFileOutcome } from '../../../shared/nomination-file-outcome.enum';
import type { RoleEnum } from '../../../shared/role.enum';

@Injectable()
export class ListMagistratNominationFilesQuery {
  constructor(
    private readonly db: Db,
    private readonly sessions: TransparenceService,
  ) {}

  async handle(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }): Promise<ListedMagistratNominationFilesDto> {
    return this.db.withTransaction(async () => {
      const magistrat = await this.db.tx.magistrat.findUnique({
        select: { id: true } satisfies Prisma.MagistratSelect,
        where: { id: query.magistratId },
      });
      if (!magistrat) throw new NotFoundException();

      return this.sessions.internalListMagistratNominationFiles(query);
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
  auditionRequired: z.boolean(),
  auditionTime: timeOnlySchema.nullable(),
  canScheduleAudition: z.boolean(),
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
