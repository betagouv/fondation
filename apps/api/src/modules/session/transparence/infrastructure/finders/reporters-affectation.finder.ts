import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { DocsService } from 'src/modules/docs/docs.service';
import { Db } from 'src/modules/framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class ReportersAffectationFinder {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,

    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
  ) {}

  // the secretariat works on the last version of the affectations, published or not
  @Transactional()
  async find(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<{ isLocked: boolean; reportersCount: number }> {
    const version = await this.versions.last({ sessionId: query.sessionId });
    const reportersCount = version.isNone()
      ? 0
      : await this.db.tx.nominationFileToReporter.count({
          where: { nominationFileId: query.nominationFileId, versionId: version.id },
        } satisfies Prisma.NominationFileToReporterCountArgs);
    const reportedFileIds = await this.docs.internalFindReportedNominationFiles({
      nominationFileIds: new Set([query.nominationFileId]),
    });

    return { isLocked: reportedFileIds.has(query.nominationFileId), reportersCount };
  }
}
