import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { formatDate } from 'date-fns';

import { Db } from 'src/modules/framework/database';
import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { PdfRenderer } from 'src/modules/framework/pdf';
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
    const file = await this.db.withTransaction(async () => {
      const plan = await this.db.tx.justicePresentationPlan.findUnique({
        where: { id: query.id },
        select: {
          date: true,
          pdf: { select: { id: true, name: true } },
          agendas: {
            take: 1,
            select: { agenda: { select: { formation: true } } },
          },
        },
      });

      if (!plan || !plan.agendas.length) throw new NotFoundException();
      if (!plan.pdf || query.forceNew)
        return {
          date: plan.date,
          formation: assertIsDefined(plan.agendas[0]).agenda.formation,
        };

      const file$ = await this.files.getFile({ fileId: plan.pdf?.id, tx: this.db.tx });
      if (!file$) {
        this.logger.error(`Could not retrieve the presentation plan (${query.id}) from S3`);
        throw new InternalServerErrorException();
      }

      return new StreamableFile(file$, {
        type: FILE_MIME_TYPES.pdf,
        disposition: `inline; filename=${encodeURIComponent(plan.pdf.name)}`,
      });
    });

    if (file instanceof StreamableFile) return file;

    const html = await this.findPresentationPlanDocumentQuery.handle(query);
    const buffer = await this.pdfRenderer.render(html);

    const name = `Notice de restitution - ${file.formation === 'SIEGE' ? 'Siège' : 'Parquet'} - ${formatDate(file.date, 'dd-MM-yyyy')}.pdf`;
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
      disposition: `inline; filename=${encodeURIComponent(name)}`,
    });
  }
}
