import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { FinalDocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

/** the business closes a proposition with its presented notice, not with the official report, see ReportedNominationFilesFinder */
@Injectable()
export class ActedNominationFilesFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { fileIds: Set<string> }): Promise<Set<string>> {
    assertPgParams(query.fileIds);

    const files = await this.db.tx.justicePresentationPlanNominationFile.findMany({
      where: {
        nominationFile: { outcome: { in: NominationFileOutcome.finalOutcomes() } },
        nominationFileId: { in: [...query.fileIds] },
        outcome: { in: Object.values(FinalDocNominationFileOutcomeEnum) },
        plan: { isPresented: true },
      },
      select: { nominationFileId: true } satisfies Prisma.JusticePresentationPlanNominationFileSelect,
      distinct: ['nominationFileId'],
    });

    return new Set(
      files.flatMap(({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : [])),
    );
  }
}
