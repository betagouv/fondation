import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { formatDate } from 'date-fns';

import { Db } from 'src/modules/framework/database';
import { contentDisposition, FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { PdfRenderer } from 'src/modules/framework/pdf';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';

import { FindPresentationPlanDocumentQuery } from './find-presentation-plan-document.query';

@Injectable()
export class FindPresentationPlanDocumentPdfQuery {
  private readonly logger = new Logger(FindPresentationPlanDocumentPdfQuery.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly findPresentationPlanDocumentQuery: FindPresentationPlanDocumentQuery,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  async handle(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    const plan = await this.findPlan(query.id);

    // Stream the cached PDF from S3 outside of any transaction.
    if (plan.pdf?.id && !query.forceNew) {
      const file$ = await this.files.getFile({ fileId: plan.pdf.id });
      if (!file$) {
        this.logger.error(`Could not retrieve the presentation plan (${query.id}) from S3`);
        throw new InternalServerErrorException();
      }

      return new StreamableFile(file$, {
        type: FILE_MIME_TYPES.pdf,
        disposition: contentDisposition({ name: plan.pdf.name }),
      });
    }

    const html = await this.findPresentationPlanDocumentQuery.handle(query);
    const { buffer, name, pdfFileId } = await this.store(plan, html);

    await this.db.tx.justicePresentationPlan
      .update({
        where: { id: query.id },
        data: { pdfId: pdfFileId },
      })
      .catch((err) => {
        this.logger.warn(`Failed storing presentation plan ${query.id} pdf file`, err);
      });

    return new StreamableFile(buffer, {
      type: FILE_MIME_TYPES.pdf,
      disposition: contentDisposition({ name }),
    });
  }

  /** renders the pdf again from the text as it reads, and drops the one it replaces only once stored */
  async renew(query: { id: string }): Promise<void> {
    const plan = await this.findPlan(query.id);
    const html = await this.findPresentationPlanDocumentQuery.handle({ id: query.id });
    const { pdfFileId } = await this.store(plan, html);

    await this.db.tx.justicePresentationPlan.update({
      where: { id: query.id },
      data: { pdfId: pdfFileId },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
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
  ): Promise<{ buffer: Buffer; name: string; pdfFileId: string }> {
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

    return { buffer, name, pdfFileId: assertIsDefined(pdfFileId) };
  }
}
