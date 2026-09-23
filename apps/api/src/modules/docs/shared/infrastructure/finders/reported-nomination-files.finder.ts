import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { FinalDocNominationFileOutcomeEnum } from '../../domain/doc-nomination-file-outcome';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { NominationFileOutcome } from 'src/modules/shared/nomination-file-outcome.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class ReportedNominationFilesFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { fileIds: Set<string> }): Promise<Set<string>> {
    assertPgParams(query.fileIds);

    const files = await this.db.tx.officialReportNominationFile.findMany({
      distinct: ['nominationFileId'],
      select: { nominationFileId: true } satisfies Prisma.OfficialReportNominationFileSelect,
      where: {
        nominationFile: { outcome: { in: NominationFileOutcome.finalOutcomes() } },
        nominationFileId: { in: [...query.fileIds] },
        version: { validatedAt: { not: null } },
        outcome: { in: Object.values(FinalDocNominationFileOutcomeEnum) },
      },
    });

    return new Set(
      files.flatMap(({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : [])),
    );
  }
}
