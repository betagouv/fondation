import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { ReportedNominationFileCollection } from '../../domain/reported-nomination-file-collection';
import { Db } from 'src/modules/framework/database';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

@Injectable()
export class ReportedNominationFilesFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: {
    fileIds: Set<string>;
    ignoreOfficialReportId?: string;
  }): Promise<ReportedNominationFileCollection> {
    assertPgParams(query.fileIds);

    const files = await this.db.tx.officialReportNominationFile.findMany({
      where: {
        nominationFileId: { in: [...query.fileIds] },
        officialReportId: { not: query.ignoreOfficialReportId },
      },
      select: {
        nominationFileId: true,
        officialReportId: true,
        outcome: true,
        officialReport: { select: { validatedAt: true } },
      },
    });

    return ReportedNominationFileCollection.from(
      files.map((f) => ({
        outcome: f.outcome,
        officialReportId: f.officialReportId,
        isValidated: isDefined(f.officialReport.validatedAt),
        nominationFileId: assertIsDefined(f.nominationFileId, `nomination file was deleted`),
      })),
    );
  }
}
