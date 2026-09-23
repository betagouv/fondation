import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';

import { docFileName } from '../../../shared/domain/doc-file-name';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { contentDisposition, FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { PdfRenderer } from 'src/modules/framework/pdf';
import { DateOnly } from 'src/utils/date-only';

import { FindOfficialReportDocumentQuery } from './find-official-report-document.query';

@Injectable()
export class FindOfficialReportDocumentPdfQuery {
  private readonly logger = new Logger(FindOfficialReportDocumentPdfQuery.name);

  constructor(
    private readonly files: Files,
    private readonly db: Db,
    private readonly pdfRenderer: PdfRenderer,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  /** makes sure the version carries its PDF, without opening a stream nobody reads */
  async ensure(query: { id: string }): Promise<void> {
    const versionId = await this.officialReportVersionFinder.latest({ officialReportId: query.id });
    const version = await this.db.tx.officialReportVersion.findUnique({
      where: { id: versionId },
      select: { pdfId: true } satisfies Prisma.OfficialReportVersionSelect,
    });

    if (version?.pdfId) return;
    await this.handle({ id: query.id, forceNew: true });
  }

  async handle(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    const versionId = await this.officialReportVersionFinder.latest({ officialReportId: query.id });
    const officialReport = await this.db.tx.officialReportVersion.findUnique({
      where: { id: versionId },
      select: {
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        officialReport: {
          select: { agendas: { select: { sessionId: true, sessionName: true, formation: true }, take: 1 } },
        },
        pdf: { select: { id: true, name: true } },
      } satisfies Prisma.OfficialReportVersionSelect,
    });

    if (!officialReport) throw new NotFoundException();

    // Stream the cached PDF from S3 outside of any transaction.
    if (!query.forceNew && officialReport.pdf?.id) {
      const file$ = await this.files.getFile({ fileId: officialReport.pdf.id });
      if (!file$) {
        this.logger.error(`Could not retrieve the official report PDF file from S3`);
        throw new InternalServerErrorException();
      }

      return new StreamableFile(file$, {
        type: FILE_MIME_TYPES.pdf,
        disposition: contentDisposition({ name: officialReport.pdf.name }),
      });
    }

    const html = await this.findOfficialReportDocumentQuery.handle(query);
    const buffer = await this.pdfRenderer.render(html);

    const [agenda] = officialReport.officialReport.agendas;
    if (!agenda) throw new NotFoundException();

    const name = docFileName({
      type: 'OFFICIAL_REPORT',
      formation: agenda.formation,
      date: DateOnly.fromUtcDate(officialReport.sessionMeetingDate),
      sessionName: agenda.sessionName,
      typeDeSaisine: 'TRANSPARENCE_GDS',
      chairman: { firstName: officialReport.chairmanFirstName, lastName: officialReport.chairmanLastName },
    });
    // the version belongs in the path: a shared one would have the validation delete the object it
    // has just written, since it renders the draft before dropping the version it replaces
    const path = `sessions/${agenda.sessionId}/official-reports/${query.id}/${versionId}.pdf`;

    const [pdfFileId] = await this.files.create([{ buffer, name, path, mimeType: FILE_MIME_TYPES.pdf }]);

    if (pdfFileId) {
      await this.db.tx.officialReportVersion.update({
        where: { id: versionId },
        data: { pdfId: pdfFileId },
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
