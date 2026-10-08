import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { countUnreportedNominationFiles } from 'src/generated/prisma/sql';
import { FINAL_DOC_NOMINATION_FILE_OUTCOMES } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';

@Injectable()
export class ReportedSessionsFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async reportedSessionIds(query: { sessionIds: readonly string[] }): Promise<Set<string>> {
    if (query.sessionIds.length === 0) return new Set();

    const unreported = await this.countUnreported(query);
    const withUnreported = new Set(unreported.map(({ sessionId }) => sessionId));

    return new Set(query.sessionIds.filter((sessionId) => !withUnreported.has(sessionId)));
  }

  @Transactional()
  async unreportedFilesCount(query: { sessionId: string }): Promise<number> {
    const [row] = await this.countUnreported({ sessionIds: [query.sessionId] });

    return row?.count ?? 0;
  }

  private countUnreported(query: { sessionIds: readonly string[] }) {
    return this.db.tx.$queryRawTyped(
      countUnreportedNominationFiles([...query.sessionIds], NominationFileOutcome.finalOutcomes(), [
        ...FINAL_DOC_NOMINATION_FILE_OUTCOMES,
      ]),
    );
  }
}
