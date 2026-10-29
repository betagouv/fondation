import { Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { DateOnly } from '../../../../../utils/date-only';
import { Db } from '../../../../framework/database';
import { contentDisposition, FILE_MIME_TYPES, Files } from '../../../../framework/files';
import { PdfRenderer } from '../../../../framework/pdf';
import { docFileName } from '../../../shared/domain/doc-file-name';
import { AgendaVersionFinder } from '../finders/agenda-version.finder';

import { FindAgendaDocumentQuery } from './find-agenda-document.query';

@Injectable()
export class FindAgendaDocumentPdfQuery {
  private readonly logger = new Logger(FindAgendaDocumentPdfQuery.name);

  constructor(
    private readonly files: Files,
    private readonly db: Db,
    private readonly pdfRenderer: PdfRenderer,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly agendaVersionFinder: AgendaVersionFinder,
  ) {}

  /** makes sure the version carries its PDF, without opening a stream nobody reads */
  async ensure(query: { id: string }): Promise<void> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.id });
    const version = await this.db.tx.agendaVersion.findUnique({
      where: { id: versionId },
      select: { pdfFileId: true } satisfies Prisma.AgendaVersionSelect,
    });

    if (version?.pdfFileId) return;
    await this.handle({ id: query.id, forceNew: true });
  }

  async handle(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    const versionId = await this.agendaVersionFinder.latest({ agendaId: query.id });

    const version = await this.db.tx.agendaVersion.findUnique({
      where: { id: versionId },
      select: {
        sessionMeetingDate: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        pdf: { select: { id: true, name: true } },
        agenda: { select: { sessionId: true, sessionName: true, formation: true } },
      } satisfies Prisma.AgendaVersionSelect,
    });

    if (!version) throw new NotFoundException();
    const agenda = version.agenda;

    // Stream the cached PDF from S3 outside of any transaction.
    if (!query.forceNew && version.pdf?.id) {
      const file$ = await this.files.getFile({ fileId: version.pdf.id });
      if (file$) {
        return new StreamableFile(file$, {
          type: FILE_MIME_TYPES.pdf,
          disposition: contentDisposition({ name: version.pdf.name }),
        });
      }
      // the storage lost it: rendered again from the HTML the version froze
    }

    const html = await this.findAgendaDocumentQuery.handle(query);
    const buffer = await this.pdfRenderer.render(html);

    const name = docFileName({
      type: 'AGENDA',
      formation: agenda.formation,
      date: DateOnly.fromUtcDate(version.sessionMeetingDate),
      sessionName: agenda.sessionName,
      typeDeSaisine: 'TRANSPARENCE_GDS',
      chairman: { firstName: version.chairmanFirstName, lastName: version.chairmanLastName },
    });

    // the version belongs in the path: a shared one would have the validation delete the object it
    // has just written, since it renders the draft before dropping the version it replaces
    const path = `sessions/${agenda.sessionId}/agendas/${query.id}/${versionId}.pdf`;

    const [pdfFileId] = await this.files.create([{ buffer, name, path, mimeType: FILE_MIME_TYPES.pdf }]);

    if (pdfFileId) {
      // a validation sent twice renders twice: the PDF the other one attached meanwhile stays
      const { count } = await this.db.tx.agendaVersion.updateMany({
        data: { pdfFileId },
        where: { id: versionId, pdfFileId: version.pdf?.id ?? null },
      });
      if (count === 0) this.files.delete([{ id: pdfFileId, path: path.split('/') }]);
    } else {
      this.logger.warn(`Failed storing the PDF file`);
    }

    return new StreamableFile(buffer, {
      disposition: contentDisposition({ name }),
      type: FILE_MIME_TYPES.pdf,
    });
  }
}
