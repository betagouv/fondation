import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { Db } from '../../../../framework/database';
import type { NominationFileOutcomeEnum } from '../../../../shared/nomination-file-outcome.enum';

@Injectable()
export class NominationFileOutcomesFinder {
  constructor(private readonly db: Db) {}

  async find(query: {
    nominationFileIds: ReadonlySet<string>;
  }): Promise<Map<string, NominationFileOutcomeEnum | null>> {
    assertPgParams(query.nominationFileIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { id: true, outcome: true } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] } },
    });

    return new Map(files.map(({ id, outcome }) => [id, outcome] as const));
  }

  async bySession(query: { sessionId: string }): Promise<Map<string, NominationFileOutcomeEnum | null>> {
    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { id: true, outcome: true } satisfies Prisma.DossierDeNominationSelect,
      where: { sessionId: query.sessionId },
    });

    return new Map(files.map(({ id, outcome }) => [id, outcome] as const));
  }
}
