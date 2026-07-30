import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Pagination } from 'src/modules/framework/pagination';

import {
  type HydratedNominationFile,
  InternalHydrateNominationFilesQuery,
} from './internal-hydrate-nomination-files.query';

@Injectable()
export class InternalListMagistratNominationFilesQuery {
  constructor(private readonly hydrateNominationFiles: InternalHydrateNominationFilesQuery) {}

  async handle(query: {
    magistratId: string;
    pagination: Pagination;
    tx: Prisma.TransactionClient;
  }): Promise<{ nominationFiles: HydratedNominationFile[]; totalCount: number }> {
    const where = { detectedMagistratId: query.magistratId, session: { deletedAt: null } };
    const totalCount = await query.tx.dossierDeNomination.count({ where });
    const page = await query.tx.dossierDeNomination.findMany({
      where,
      orderBy: { session: { date: 'desc' } },
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      select: { id: true },
    });

    const nominationFiles = await this.hydrateNominationFiles.handle({
      nominationFileIds: page.map(({ id }) => id),
      tx: query.tx,
    });

    return { nominationFiles, totalCount };
  }
}
