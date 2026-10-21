import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';
import { SessionReportedFilesFinder } from './session-reported-files.finder';

@Injectable()
export class ReportersAffectationFinder {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,

    private readonly reportedFiles: SessionReportedFilesFinder,
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
    const reportedFileIds = await this.reportedFiles.find({
      nominationFileIds: new Set([query.nominationFileId]),
    });

    return { isLocked: reportedFileIds.has(query.nominationFileId), reportersCount };
  }

  @Transactional()
  async findAssigned(query: {
    nominationFileIds: readonly string[];
    sessionId: string;
  }): Promise<Map<string, Set<string>>> {
    const version = await this.versions.last({ sessionId: query.sessionId });
    if (version.isNone()) return new Map();

    const reporters = await this.db.tx.nominationFileToReporter.findMany({
      select: { nominationFileId: true, userId: true } satisfies Prisma.NominationFileToReporterSelect,
      where: { nominationFileId: { in: query.nominationFileIds as string[] }, versionId: version.id },
    });

    const assigned = new Map<string, Set<string>>();
    for (const { nominationFileId, userId } of reporters) {
      assigned.set(nominationFileId, (assigned.get(nominationFileId) ?? new Set()).add(userId));
    }
    return assigned;
  }
}
