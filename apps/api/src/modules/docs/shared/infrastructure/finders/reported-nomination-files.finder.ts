import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { FinalDocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Db } from 'src/modules/framework/database';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

/**
 * A reported nomination file was acted with a final outcome in a restituted official report,
 * and still carries a final outcome: reopening its outcome hands it back to the secretariat.
 */
@Injectable()
export class ReportedNominationFilesFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { fileIds: Set<string> }): Promise<Set<string>> {
    assertPgParams(query.fileIds);

    const files = await this.db.tx.officialReportNominationFile.findMany({
      distinct: ['nominationFileId'],
      select: { nominationFileId: true },
      where: {
        nominationFile: { outcome: { in: NominationFileOutcome.finalOutcomes() } },
        nominationFileId: { in: [...query.fileIds] },
        officialReport: { validatedAt: { not: null } },
        outcome: { in: Object.values(FinalDocNominationFileOutcomeEnum) },
      },
    });

    return new Set(
      files.flatMap(({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : [])),
    );
  }
}
