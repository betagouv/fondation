import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';
import { type DraftChangesBy } from '../../../shared/domain/document.policies';
import { draftChangesBy } from '../../../shared/infrastructure/draft-changes-by';

@Injectable()
export class OfficialReportVersionFinder {
  constructor(private readonly db: Db) {}

  /** the version every reader sees, null while the report has never been validated */
  @Transactional()
  async published(query: { officialReportId: string }): Promise<string | null> {
    const version = await this.db.tx.officialReportVersion.findFirst({
      select: { id: true } satisfies Prisma.OfficialReportVersionSelect,
      where: { officialReportId: query.officialReportId, status: 'VALIDATED' },
      orderBy: { version: 'desc' },
    });

    return version?.id ?? null;
  }

  /**
   * the version every edition writes into: the draft when one is open, the validated version
   * otherwise, which the first edition then forks a draft from.
   */
  @Transactional()
  async latest(query: { officialReportId: string }): Promise<string> {
    const version = await this.db.tx.officialReportVersion.findFirst({
      select: { id: true } satisfies Prisma.OfficialReportVersionSelect,
      where: { officialReportId: query.officialReportId },
      orderBy: { version: 'desc' },
    });

    if (!version) throw new NotFoundException();

    return version.id;
  }

  @Transactional()
  async draftChangesBy(query: { officialReportId: string }): Promise<DraftChangesBy | null> {
    const draft = await this.db.tx.officialReportVersion.findFirst({
      orderBy: { version: 'desc' },
      select: {
        createdBy: true,
        status: true,
        systemUpdatedAt: true,
        updatedBy: true,
      } satisfies Prisma.OfficialReportVersionSelect,
      where: { officialReportId: query.officialReportId, status: 'DRAFT' },
    });

    return draft ? draftChangesBy(draft) : null;
  }
}
