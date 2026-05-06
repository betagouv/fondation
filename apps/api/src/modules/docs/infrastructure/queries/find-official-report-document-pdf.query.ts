import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { formatDate } from 'date-fns';

import { OfficialReportRenderer } from '../services/renderers/official-report.renderer';
import { PrismaService } from 'src/modules/framework/database';
import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';

import { FindOfficialReportDocumentQuery } from './find-official-report-document.query';

@Injectable()
export class FindOfficialReportDocumentPdfQuery {
  private readonly logger = new Logger(FindOfficialReportDocumentPdfQuery.name);

  constructor(
    private readonly files: Files,
    private readonly prisma: PrismaService,
    private readonly officialReportRenderer: OfficialReportRenderer,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
  ) {}

  async handle(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    const file = await this.prisma.$transaction(async (tx) => {
      const report = await tx.officialReport.findUnique({
        where: { id: query.id },
        select: {
          sessionMeetingDate: true,
          agendas: { select: { sessionId: true, formation: true }, take: 1 },
          pdf: { select: { id: true, name: true } },
        },
      });

      if (!report) throw new NotFoundException();

      if (query.forceNew || !report.pdf || !report.pdf.id) return report;

      const file$ = await this.files.getFile({ fileId: report.pdf.id, tx });
      if (!file$) {
        this.logger.error(`Could not retrieve the official report PDF file from S3`);
        throw new InternalServerErrorException();
      }

      return new StreamableFile(file$, {
        type: FILE_MIME_TYPES.pdf,
        disposition: `inline; filename=${encodeURIComponent(report.pdf.name)}`,
      });
    });

    if (file instanceof StreamableFile) return file;

    const html = await this.findOfficialReportDocumentQuery.handle(query);
    const buffer = await this.officialReportRenderer.pdf(html);

    const [agenda] = file.agendas;
    if (!agenda) throw new NotFoundException();

    const formation = agenda.formation === 'SIEGE' ? 'Siège' : 'Parquet';
    const name = `PV - ${formation} ${formatDate(file.sessionMeetingDate, 'dd-MM-yyyy')}.pdf`;
    const path = `sessions/${agenda.sessionId}/official-reports/${query.id}.pdf`;

    const [pdfFileId] = await this.files.create([{ buffer, name, path, mimeType: FILE_MIME_TYPES.pdf }]);

    if (pdfFileId) {
      await this.prisma.officialReport.update({
        where: { id: query.id },
        data: { pdfId: pdfFileId },
      });
    } else {
      this.logger.warn(`Failed storing the PDF file`);
    }

    return new StreamableFile(buffer, {
      disposition: `inline; filename=${encodeURIComponent(name)}`,
      type: FILE_MIME_TYPES.pdf,
    });
  }
}
