import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { HydratedNominationFilesFinder } from '../finders/hydrated-nomination-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { paginate, Pagination } from 'src/modules/framework/pagination';
import type { RoleEnum } from 'src/modules/shared/role.enum';

@Injectable()
export class InternalListMagistratNominationFilesQuery {
  constructor(
    private readonly db: Db,
    private readonly hydratedNominationFiles: HydratedNominationFilesFinder,
  ) {}

  @Transactional()
  async handle(query: { magistratId: string; pagination: Pagination; role: RoleEnum }) {
    const where = { detectedMagistratId: query.magistratId, session: { deletedAt: null } };
    const totalCount = await this.db.tx.dossierDeNomination.count({ where });
    const page = await this.db.tx.dossierDeNomination.findMany({
      orderBy: [{ session: { date: 'desc' } }, { number: { nulls: 'last', sort: 'asc' } }],
      select: { id: true } satisfies Prisma.DossierDeNominationSelect,
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      where,
    });

    const nominationFiles = await this.hydratedNominationFiles.hydrate({
      nominationFileIds: page.map(({ id }) => id),
      role: query.role,
    });

    return paginate({ items: nominationFiles, pagination: query.pagination, totalCount });
  }
}
