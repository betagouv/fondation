import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { FINAL_DOC_NOMINATION_FILE_OUTCOMES } from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

/** the business closes a proposition with its presented notice, not with the official report, see ReportedNominationFilesFinder */
@Injectable()
export class ActedNominationFilesFinder {
  constructor(
    private readonly db: Db,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  @Transactional()
  async find(query: { fileIds: Set<string> }): Promise<Set<string>> {
    assertPgParams(query.fileIds);

    const files = await this.db.tx.justicePresentationPlanNominationFile.findMany({
      where: {
        nominationFileId: { in: [...query.fileIds] },
        outcome: { in: [...FINAL_DOC_NOMINATION_FILE_OUTCOMES] },
        plan: { isPresented: true },
      },
      select: { nominationFileId: true } satisfies Prisma.JusticePresentationPlanNominationFileSelect,
      distinct: ['nominationFileId'],
    });

    const presentedIds = new Set(
      files.flatMap(({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : [])),
    );
    if (presentedIds.size === 0) return presentedIds;

    // a file presented once may since have been given a non final outcome again
    const outcomes = await this.sessions.internalFindNominationFileOutcomes({
      nominationFileIds: presentedIds,
    });
    return new Set([...presentedIds].filter((id) => NominationFileOutcome.isFinal(outcomes.get(id) ?? null)));
  }
}
