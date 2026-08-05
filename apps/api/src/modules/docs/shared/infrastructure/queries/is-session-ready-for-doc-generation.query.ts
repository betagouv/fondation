import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AgendaFinder } from '../finders/agenda.finder';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';

@Injectable()
export class IsSessionReadyForDocGenerationQuery {
  constructor(
    private readonly db: Db,
    private readonly agendas: AgendaFinder,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    const session = await this.transparences.details(query);
    if (session.isArchived) {
      return { isReady: false, canCreateAgenda: false, canCreateOfficialReport: false };
    }

    const publishedVersion = await this.transparences.versions.lastPublished({
      sessionId: query.sessionId,
    });

    if (publishedVersion.isNone()) {
      return { isReady: false, canCreateAgenda: false, canCreateOfficialReport: false };
    }

    const hasAnyReportableAgenda = await this.agendas.hasAnyReportableInOfficialReport({
      sessionId: query.sessionId,
      affectationVersionId: publishedVersion.id,
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
    const canCreateOfficialReport = hasAnyReportableAgenda;

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
