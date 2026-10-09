import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { ObservationService } from 'src/modules/observation/observation.service';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

import { MagistratNominationFileSchema } from './list-magistrat-nomination-files.query';

@Injectable()
export class ListMagistratObservationsQuery {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
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

      // a magistrat receives a handful of observations: sorting and paging them here costs nothing
      const observations = await this.observations.internalFindMagistratObservations(query);
      const sortedFileIds = await this.sessions.internalSortNominationFiles({
        nominationFileIds: [...new Set(observations.map(({ nominationFileId }) => nominationFileId))],
      });
      const observationsByFileId = Map.groupBy(observations, ({ nominationFileId }) => nominationFileId);
      const sorted = sortedFileIds.flatMap((id) => observationsByFileId.get(id) ?? []);
      const page = sorted.slice(
        (query.pagination.page - 1) * query.pagination.limit,
        query.pagination.page * query.pagination.limit,
      );

      const nominationFiles = await this.sessions.internalHydrateNominationFiles({
        nominationFileIds: page.map(({ nominationFileId }) => nominationFileId),
        role: query.role,
      });
      const nominationFilesById = new Map(nominationFiles.map((file) => [file.id, file]));

      const items = page.flatMap((observation) => {
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

      return paginate({ items, pagination: query.pagination, totalCount: sorted.length });
    });
  }
}

const MagistratObservationSchema = z.object({
  id: z.string(),
  dateReception: dateOnlyJsonSchema,
  nominationFile: MagistratNominationFileSchema,
});

export class ListedMagistratObservationsDto extends createPaginatedZodDto(MagistratObservationSchema) {}
