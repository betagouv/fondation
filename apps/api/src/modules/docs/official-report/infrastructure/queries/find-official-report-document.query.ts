import { Injectable } from '@nestjs/common';

import { OfficialReportRenderContextFinder } from '../finders/official-report-render-context.finder';
import { OfficialReportRenderer } from '../services/renderers/official-report.renderer';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class FindOfficialReportDocumentQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly officialReportRenderContextFinder: OfficialReportRenderContextFinder,
    private readonly officialReportRenderer: OfficialReportRenderer,
  ) {}

  async handle(query: { id: string; forceNew?: boolean; tx?: Prisma.TransactionClient }): Promise<string> {
    if (!query.tx) return this.prisma.$transaction((tx) => this.handle({ ...query, tx }));

    if (!query.forceNew) {
      const officialReport = await query.tx.officialReport.findUnique({
        where: { id: query.id },
        select: { html: true },
      });

      if (officialReport?.html) return officialReport.html;
    }

    return this.renderHtml(query.tx, query.id);
  }

  private async renderHtml(tx: Prisma.TransactionClient, officialReportId: string): Promise<string> {
    const renderContext = await this.officialReportRenderContextFinder.find({ officialReportId, tx });
    const html = this.officialReportRenderer.html(renderContext);
    await tx.officialReport.update({ where: { id: officialReportId }, data: { html } });

    return html;
  }
}
