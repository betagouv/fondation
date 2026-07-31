import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';

import { docFileName } from '../../../shared/domain/doc-file-name';
import { Db } from 'src/modules/framework/database';
import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { PdfRenderer } from 'src/modules/framework/pdf';

import { FindOfficialReportDocumentQuery } from './find-official-report-document.query';

@Injectable()
export class FindOfficialReportDocumentPdfQuery {
  private readonly logger = new Logger(FindOfficialReportDocumentPdfQuery.name);

  constructor(
    private readonly files: Files,
    private readonly db: Db,
    private readonly pdfRenderer: PdfRenderer,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
  ) {}

  async handle(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    const result = await this.db.withTransaction(async () => {
      const officialReport = await this.db.tx.officialReport.findUnique({
        where: { id: query.id },
        select: {
          sessionMeetingDate: true,
          chairmanFirstName: true,
          chairmanLastName: true,
          agendas: { select: { sessionId: true, sessionName: true, formation: true }, take: 1 },
          pdf: { select: { id: true, name: true } },
        },
      });

      if (!officialReport) throw new NotFoundException();

      if (!query.forceNew && officialReport.pdf?.id) {
        const file$ = await this.files.getFile({ fileId: officialReport.pdf.id });
        if (!file$) {
          this.logger.error(`Could not retrieve the official report PDF file from S3`);
          throw new InternalServerErrorException();
        }

        return {
          type: 'pdf',
          file: new StreamableFile(file$, {
            type: FILE_MIME_TYPES.pdf,
            disposition: `inline; filename=${encodeURIComponent(officialReport.pdf.name)}`,
          }),
        } as const;
      }

      const html = await this.findOfficialReportDocumentQuery.handle(query);
      return { type: 'html', html, officialReport } as const;
    });

    if (result.type === 'pdf') return result.file;

    const { officialReport, html } = result;
    const buffer = await this.pdfRenderer.render(html);

    const [agenda] = officialReport.agendas;
    if (!agenda) throw new NotFoundException();

    const name = docFileName({
      type: 'OFFICIAL_REPORT',
      formation: agenda.formation,
      date: officialReport.sessionMeetingDate,
      sessionName: agenda.sessionName,
      typeDeSaisine: 'TRANSPARENCE_GDS',
      chairman: { firstName: officialReport.chairmanFirstName, lastName: officialReport.chairmanLastName },
    });
    const path = `sessions/${agenda.sessionId}/official-reports/${query.id}.pdf`;

    const [pdfFileId] = await this.files.create([{ buffer, name, path, mimeType: FILE_MIME_TYPES.pdf }]);

    if (pdfFileId) {
      await this.db.withTransaction((tx) =>
        tx.officialReport.update({
          where: { id: query.id },
          data: { pdfId: pdfFileId },
        }),
      );
    } else {
      this.logger.warn(`Failed storing the PDF file`);
    }

    return new StreamableFile(buffer, {
      disposition: `inline; filename=${encodeURIComponent(name)}`,
      type: FILE_MIME_TYPES.pdf,
    });
  }
}
