import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';
import { OfficialReportRenderContextFinder } from '../finders/official-report-render-context.finder';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { OfficialReportRenderer } from '../services/renderers/official-report.renderer';

@Injectable()
export class FindOfficialReportDocumentQuery {
  constructor(
    private readonly db: Db,
    private readonly officialReportRenderContextFinder: OfficialReportRenderContextFinder,
    private readonly officialReportRenderer: OfficialReportRenderer,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  @Transactional()
  async handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    const versionId = await this.officialReportVersionFinder.latest({ officialReportId: query.id });

    if (!query.forceNew) {
      const version = await this.db.tx.officialReportVersion.findUnique({
        where: { id: versionId },
        select: { html: true } satisfies Prisma.OfficialReportVersionSelect,
      });

      if (version?.html) return version.html;
    }

    return this.renderHtml(query.id, versionId);
  }

  private async renderHtml(officialReportId: string, versionId: string): Promise<string> {
    const renderContext = await this.officialReportRenderContextFinder.find({ officialReportId });
    const html = this.officialReportRenderer.html(renderContext);
    // the PDF prints this html: what its intro says of the agenda and the session is recorded with it,
    // for the screen of the validated report to tell the same
    await this.db.tx.officialReportVersion.update({
      data: {
        agendaDate: renderContext.agenda.date.toDate(),
        agendaPropositionCount: renderContext.agenda.propositionCount,
        html,
        sessionDate: renderContext.session.date.toDate(),
      },
      where: { id: versionId },
    });

    return html;
  }
}
