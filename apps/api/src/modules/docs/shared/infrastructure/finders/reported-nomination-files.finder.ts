import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { isDefined } from '../../../../../utils/is-defined';
import { Db } from '../../../../framework/database';
import { FINAL_DOC_NOMINATION_FILE_OUTCOMES } from '../../domain/doc-nomination-file-outcome';

/** the files a validated official report acts with a final outcome: whether the file still holds one is for its session to tell */
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
        nominationFileId: { in: [...query.fileIds] },
        version: { validatedAt: { not: null } },
        outcome: { in: [...FINAL_DOC_NOMINATION_FILE_OUTCOMES] },
      },
    });

    return new Set(
      files.flatMap(({ nominationFileId }) => (isDefined(nominationFileId) ? [nominationFileId] : [])),
    );
  }
}
