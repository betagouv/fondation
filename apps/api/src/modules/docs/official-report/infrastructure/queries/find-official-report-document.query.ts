import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { OfficialReportRenderContextFinder } from '../finders/official-report-render-context.finder';
import { OfficialReportRenderer } from '../services/renderers/official-report.renderer';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class FindOfficialReportDocumentQuery {
  constructor(
    private readonly db: Db,
    private readonly officialReportRenderContextFinder: OfficialReportRenderContextFinder,
    private readonly officialReportRenderer: OfficialReportRenderer,
  ) {}

  @Transactional()
  async handle(query: { id: string; forceNew?: boolean }): Promise<string> {
    if (!query.forceNew) {
      const officialReport = await this.db.tx.officialReport.findUnique({
        where: { id: query.id },
        select: { html: true },
      });

      if (officialReport?.html) return officialReport.html;
    }

    return this.renderHtml(query.id);
  }

  private async renderHtml(officialReportId: string): Promise<string> {
    const renderContext = await this.officialReportRenderContextFinder.find({ officialReportId });
    const html = this.officialReportRenderer.html(renderContext);
    await this.db.tx.officialReport.update({ where: { id: officialReportId }, data: { html } });

    return html;
  }
}
