import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { DocsService } from 'src/modules/docs/docs.service';
import { Db } from 'src/modules/framework/database';
import {
  NominationFileOutcome,
  type NominationFileOutcomeEnum,
} from 'src/modules/shared/nomination-file-outcome.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';

/** a file is reported once a validated official report acts it and it still holds a final outcome */
@Injectable()
export class SessionReportedFilesFinder {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
  ) {}

  @Transactional()
  async find(query: { nominationFileIds: ReadonlySet<string> }): Promise<Set<string>> {
    if (query.nominationFileIds.size === 0) return new Set();
    assertPgParams(query.nominationFileIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { id: true, outcome: true } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] } },
    });
    return this.reportedAmong(files);
  }

  /** sessions with every file reported are left out */
  @Transactional()
  async unreportedCountBySession(query: { sessionIds: readonly string[] }): Promise<Map<string, number>> {
    if (query.sessionIds.length === 0) return new Map();
    assertPgParams(query.sessionIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { id: true, outcome: true, sessionId: true } satisfies Prisma.DossierDeNominationSelect,
      where: { sessionId: { in: [...query.sessionIds] } },
    });
    const reportedFileIds = await this.reportedAmong(files);

    const unreported = new Map<string, number>();
    for (const file of files) {
      if (reportedFileIds.has(file.id)) continue;
      unreported.set(file.sessionId, (unreported.get(file.sessionId) ?? 0) + 1);
    }
    return unreported;
  }

  private async reportedAmong(
    files: readonly { id: string; outcome: NominationFileOutcomeEnum | null }[],
  ): Promise<Set<string>> {
    const finalFileIds = new Set(
      files.filter(({ outcome }) => NominationFileOutcome.isFinal(outcome)).map(({ id }) => id),
    );
    if (finalFileIds.size === 0) return new Set();

    return this.docs.internalFindReportedNominationFiles({ nominationFileIds: finalFileIds });
  }
}
