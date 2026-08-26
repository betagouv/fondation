import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';

import { docFileName } from '../../../shared/domain/doc-file-name';
import { Db } from 'src/modules/framework/database';
import { contentDisposition, FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { PdfRenderer } from 'src/modules/framework/pdf';
import { DateOnly } from 'src/utils/date-only';

import { FindAgendaDocumentQuery } from './find-agenda-document.query';

@Injectable()
export class FindAgendaDocumentPdfQuery {
  private readonly logger = new Logger(FindAgendaDocumentPdfQuery.name);

  constructor(
    private readonly files: Files,
    private readonly db: Db,
    private readonly pdfRenderer: PdfRenderer,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
  ) {}

  async handle(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: query.id },
      select: {
        sessionId: true,
        sessionName: true,
        formation: true,
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        pdf: { select: { id: true, name: true } },
      },
    });

    if (!agenda) throw new NotFoundException();

    // Stream the cached PDF from S3 outside of any transaction.
    if (!query.forceNew && agenda.pdf?.id) {
      const file$ = await this.files.getFile({ fileId: agenda.pdf.id });
      if (!file$) {
        this.logger.error(`Could not retrieve the agenda PDF file from S3`);
        throw new InternalServerErrorException();
      }

      return new StreamableFile(file$, {
        type: FILE_MIME_TYPES.pdf,
        disposition: contentDisposition({ name: agenda.pdf.name }),
      });
    }

    const html = await this.findAgendaDocumentQuery.handle(query);
    const buffer = await this.pdfRenderer.render(html);

    const name = docFileName({
      type: 'AGENDA',
      formation: agenda.formation,
      date: DateOnly.fromUtcDate(agenda.sessionMeetingDate),
      sessionName: agenda.sessionName,
      typeDeSaisine: 'TRANSPARENCE_GDS',
      chairman: { firstName: agenda.chairmanFirstName, lastName: agenda.chairmanLastName },
    });

    const path = `sessions/${agenda.sessionId}/agendas/${query.id}.pdf`;

    const [pdfFileId] = await this.files.create([{ buffer, name, path, mimeType: FILE_MIME_TYPES.pdf }]);

    if (pdfFileId) {
      await this.db.tx.agenda.update({
        where: { id: query.id },
        data: { pdfFileId },
      });
    } else {
      this.logger.warn(`Failed storing the PDF file`);
    }

    return new StreamableFile(buffer, {
      disposition: contentDisposition({ name }),
      type: FILE_MIME_TYPES.pdf,
    });
  }
}
