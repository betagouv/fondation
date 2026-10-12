import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';

export type NominationFileProgress = {
  /** a reporter in any version of the affectations, published or not */
  hasAnyReporter: boolean;
  hasOutcome: boolean;
  /** a reporter in the given version of the affectations */
  isAffected: boolean;
};

@Injectable()
export class NominationFilesProgressFinder {
  constructor(private readonly db: Db) {}

  async find(query: {
    affectationVersionId: string;
    nominationFileIds: readonly string[];
  }): Promise<Map<string, NominationFileProgress>> {
    assertPgParams(query.nominationFileIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      select: {
        id: true,
        outcome: true,
        reporterIds: { select: { versionId: true } },
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] } },
    });

    return new Map(
      files.map(({ id, outcome, reporterIds }) => [
        id,
        {
          hasAnyReporter: reporterIds.length > 0,
          hasOutcome: outcome !== null,
          isAffected: reporterIds.some(({ versionId }) => versionId === query.affectationVersionId),
        },
      ]),
    );
  }
}
