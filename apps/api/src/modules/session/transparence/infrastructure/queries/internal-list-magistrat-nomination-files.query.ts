import { Injectable } from '@nestjs/common';

import { HydratedNominationFilesFinder } from '../finders/hydrated-nomination-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { paginate, Pagination } from 'src/modules/framework/pagination';

@Injectable()
export class InternalListMagistratNominationFilesQuery {
  constructor(private readonly hydratedNominationFiles: HydratedNominationFilesFinder) {}

  async handle(query: { magistratId: string; pagination: Pagination; tx: Prisma.TransactionClient }) {
    const where = { detectedMagistratId: query.magistratId, session: { deletedAt: null } };
    const totalCount = await query.tx.dossierDeNomination.count({ where });
    const page = await query.tx.dossierDeNomination.findMany({
      where,
      orderBy: { session: { date: 'desc' } },
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      select: { id: true },
    });

    const nominationFiles = await this.hydratedNominationFiles.hydrate({
      nominationFileIds: page.map(({ id }) => id),
      tx: query.tx,
    });

    return paginate({ items: nominationFiles, totalCount, pagination: query.pagination });
  }
}
