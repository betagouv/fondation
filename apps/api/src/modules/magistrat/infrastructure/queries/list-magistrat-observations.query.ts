import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

import { MagistratNominationFileSchema } from './list-magistrat-nomination-files.query';

@Injectable()
export class ListMagistratObservationsQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  async handle(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }): Promise<ListedMagistratObservationsDto> {
    return this.db.withTransaction(async () => {
      const magistrat = await this.db.tx.magistrat.findUnique({
        select: { id: true } satisfies Prisma.MagistratSelect,
        where: { id: query.magistratId },
      });
      if (!magistrat) throw new NotFoundException();

      const where = {
        magistratId: query.magistratId,
        nominationFile: { session: { deletedAt: null } },
      };
      const totalCount = await this.db.tx.observation.count({ where });
      const observations = await this.db.tx.observation.findMany({
        orderBy: [
          { nominationFile: { session: { date: 'desc' } } },
          { nominationFile: { number: { nulls: 'last', sort: 'asc' } } },
        ],
        select: { dateReception: true, id: true, nominationFileId: true } satisfies Prisma.ObservationSelect,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
        where,
      });

      const nominationFiles = await this.sessions.internalHydrateNominationFiles({
        nominationFileIds: observations.map(({ nominationFileId }) => nominationFileId),
        role: query.role,
      });
      const nominationFilesById = new Map(nominationFiles.map((file) => [file.id, file]));

      const items = observations.flatMap((observation) => {
        const nominationFile = nominationFilesById.get(observation.nominationFileId);
        if (!nominationFile) return [];

        return [
          {
            dateReception: DateOnly.fromUtcDate(observation.dateReception).toJson(),
            id: observation.id,
            nominationFile,
          },
        ];
      });

      return paginate({ items, pagination: query.pagination, totalCount });
    });
  }
}

const MagistratObservationSchema = z.object({
  id: z.string(),
  dateReception: dateOnlyJsonSchema,
  nominationFile: MagistratNominationFileSchema,
});

export class ListedMagistratObservationsDto extends createPaginatedZodDto(MagistratObservationSchema) {}
