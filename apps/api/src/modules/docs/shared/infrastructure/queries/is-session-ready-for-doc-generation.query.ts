import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { AffectationVersionFinder } from 'src/modules/session/transparence/infrastructure/finders/affectation-version.finder';

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    const session = await this.db.tx.session.findFirst({
      where: { id: query.sessionId },
      select: { deletedAt: true, archivedAt: true },
    });

    if (!session) throw new NotFoundException();
    if (session.archivedAt || session.deletedAt) {
      return { isReady: false, canCreateAgenda: false, canCreateOfficialReport: false };
    }

    const publishedVersion = await this.versions.lastPublished({
      sessionId: query.sessionId,
    });
    if (publishedVersion.isNone()) {
      return { isReady: false, canCreateAgenda: false, canCreateOfficialReport: false };
    }

    const hasAnyNonReportedAgenda = await this.db.tx.agenda.findFirst({
      where: { sessionId: query.sessionId, officialReportId: null },
    });

    const hasAnyNonOfficiallyReportedFile = await this.db.tx.dossierDeNomination.findFirst({
      select: { id: true },
      where: {
        sessionId: query.sessionId,
        officialReportInclusions: {
          none: { outcome: { in: ['VALIDATED', 'NON_VALIDATED', 'WITHDRAWN'] } },
        },
      },
    });

    const canCreateAgenda = Boolean(hasAnyNonOfficiallyReportedFile);
    const canCreateOfficialReport = Boolean(hasAnyNonReportedAgenda && hasAnyNonOfficiallyReportedFile);

    return {
      canCreateAgenda,
      canCreateOfficialReport,
      isReady: canCreateAgenda || canCreateOfficialReport,
    };
  }
}

export class DocGenerationSessionReadinessDto extends createZodDto(
  z.object({
    isReady: z.boolean(),
    canCreateAgenda: z.boolean(),
    canCreateOfficialReport: z.boolean(),
  }),
) {}
