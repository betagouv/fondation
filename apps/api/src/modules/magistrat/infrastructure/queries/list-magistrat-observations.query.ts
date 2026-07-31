import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

import { MagistratNominationFileSchema } from './list-magistrat-nomination-files.query';

@Injectable()
export class ListMagistratObservationsQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: TransparenceService,
  ) {}

  async handle(query: {
    magistratId: string;
    pagination: Pagination;
  }): Promise<ListedMagistratObservationsDto> {
    return this.prisma.$transaction(async (tx) => {
      const magistrat = await tx.magistrat.findUnique({
        where: { id: query.magistratId },
        select: { id: true },
      });
      if (!magistrat) throw new NotFoundException();

      const where = {
        magistratId: query.magistratId,
        nominationFile: { session: { deletedAt: null } },
      };
      const totalCount = await tx.observation.count({ where });
      const observations = await tx.observation.findMany({
        where,
        orderBy: { dateReception: 'desc' },
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
        select: { id: true, dateReception: true, nominationFileId: true },
      });

      const nominationFiles = await this.sessions.internalHydrateNominationFiles({
        nominationFileIds: observations.map(({ nominationFileId }) => nominationFileId),
      });
      const nominationFilesById = new Map(nominationFiles.map((file) => [file.id, file]));

      const items = observations.flatMap((observation) => {
        const nominationFile = nominationFilesById.get(observation.nominationFileId);
        if (!nominationFile) return [];

        return [
          {
            id: observation.id,
            dateReception: DateOnly.fromDate(observation.dateReception).toJson(),
            nominationFile,
          },
        ];
      });

      return paginate({ items, totalCount, pagination: query.pagination });
    });
  }
}

const MagistratObservationSchema = z.object({
  id: z.string(),
  dateReception: dateOnlyJsonSchema,
  nominationFile: MagistratNominationFileSchema,
});

export class ListedMagistratObservationsDto extends createPaginatedZodDto(MagistratObservationSchema) {}
