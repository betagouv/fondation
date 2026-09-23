import { Injectable, NotFoundException } from '@nestjs/common';
import { formatDate } from 'date-fns';

import { Db } from 'src/modules/framework/database';
import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { PdfRenderer } from 'src/modules/framework/pdf';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';

import { FindPresentationPlanDocumentQuery } from './find-presentation-plan-document.query';

@Injectable()
export class FindPresentationPlanDocumentPdfQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly findPresentationPlanDocumentQuery: FindPresentationPlanDocumentQuery,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  async render(query: { id: string }): Promise<{ html: string; pdf: { id: string; path: string[] } }> {
    const plan = await this.findPlan(query.id);
    const html = await this.findPresentationPlanDocumentQuery.handle({ id: query.id });
    return { html, pdf: await this.store(plan, html) };
  }

  async renew(query: { id: string }): Promise<void> {
    const { pdf: previous } = await this.findPlan(query.id);
    const { pdf } = await this.render(query);

    await this.db.tx.justicePresentationPlan.update({
      where: { id: query.id },
      data: { pdfId: pdf.id },
    });

    if (previous) this.files.delete([previous]);
  }

  private async findPlan(id: string) {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id },
      select: {
        date: true,
        pdf: { select: { id: true, name: true, path: true } },
        agendas: {
          take: 1,
          select: { agenda: { select: { formation: true } } },
        },
      },
    });

    if (!plan || !plan.agendas.length) throw new NotFoundException();
    return plan;
  }

  private async store(
    plan: { date: Date; agendas: { agenda: { formation: string } }[] },
    html: string,
  ): Promise<{ id: string; path: string[] }> {
    const formation = assertIsDefined(plan.agendas[0]).agenda.formation;
    const buffer = await this.pdfRenderer.render(html);

    const planDate = DateOnly.fromUtcDate(plan.date).toLocalStartOfDay();
    const name = `Notice de restitution - ${formation === 'SIEGE' ? 'Siège' : 'Parquet'} - ${formatDate(planDate, 'dd-MM-yyyy')}.pdf`;
    const fileId = makeId('FileId');
    const path = `docs/${fileId}.pdf`;

    const [pdfFileId] = await this.files.create([
      {
        name,
        path,
        buffer,
        mimeType: FILE_MIME_TYPES.pdf,
        meta: { id: fileId },
      },
    ]);

    return { id: assertIsDefined(pdfFileId), path: path.split('/') };
  }
}
