import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { HydratedNominationFilesFinder } from '../finders/hydrated-nomination-files.finder';
import { Db } from 'src/modules/framework/database';
import { paginate, Pagination } from 'src/modules/framework/pagination';

@Injectable()
export class InternalListMagistratNominationFilesQuery {
  constructor(
    private readonly db: Db,
    private readonly hydratedNominationFiles: HydratedNominationFilesFinder,
  ) {}

  @Transactional()
  async handle(query: { magistratId: string; pagination: Pagination }) {
    const where = { detectedMagistratId: query.magistratId, session: { deletedAt: null } };
    const totalCount = await this.db.tx.dossierDeNomination.count({ where });
    const page = await this.db.tx.dossierDeNomination.findMany({
      where,
      orderBy: { session: { date: 'desc' } },
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      select: { id: true },
    });

    const nominationFiles = await this.hydratedNominationFiles.hydrate({
      nominationFileIds: page.map(({ id }) => id),
    });

    return paginate({ items: nominationFiles, totalCount, pagination: query.pagination });
  }
}
