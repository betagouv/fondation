import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { countUnreportedNominationFiles } from 'src/generated/prisma/sql';
import { FinalDocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class ReportedSessionsFinder {
  constructor(
    private readonly db: Db,
    private readonly version: AffectationVersionFinder,
  ) {}

  @Transactional()
  async reportedSessionIds(query: { sessionIds: readonly string[] }): Promise<Set<string>> {
    if (query.sessionIds.length === 0) return new Set();

    const unreported = await this.countUnreported({
      affectationVersionId: null,
      requiresPublishedAffectation: false,
      sessionIds: query.sessionIds,
    });
    const withUnreported = new Set(unreported.map(({ sessionId }) => sessionId));

    return new Set(query.sessionIds.filter((sessionId) => !withUnreported.has(sessionId)));
  }

  /** archival also demands a reporter on the last published version, see FON-128 */
  @Transactional()
  async unreportedFilesCount(query: { sessionId: string }): Promise<number> {
    const version = await this.version.lastPublished({ sessionId: query.sessionId });
    const [row] = await this.countUnreported({
      affectationVersionId: version.optionalId ?? null,
      requiresPublishedAffectation: true,
      sessionIds: [query.sessionId],
    });

    return row?.count ?? 0;
  }

  private countUnreported(query: {
    affectationVersionId: string | null;
    requiresPublishedAffectation: boolean;
    sessionIds: readonly string[];
  }) {
    return this.db.tx.$queryRawTyped(
      countUnreportedNominationFiles(
        [...query.sessionIds],
        NominationFileOutcome.finalOutcomes(),
        Object.values(FinalDocNominationFileOutcomeEnum),
        query.requiresPublishedAffectation,
        query.affectationVersionId,
      ),
    );
  }
}
