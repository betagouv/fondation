import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { AgendaRenderer } from '../services/renderers/agenda.renderer';
import { FindAgendaDocumentQuery } from './find-agenda-document.query';

@Injectable()
export class FindAgendaDocumentPdfQuery {
  private readonly logger = new Logger(FindAgendaDocumentPdfQuery.name);

  constructor(
    private readonly files: Files,
    private readonly prisma: PrismaService,
    private readonly agendaRenderer: AgendaRenderer,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
  ) {}

  async handle(query: { id: string }): Promise<StreamableFile> {
    const file = await this.prisma.$transaction(async (tx) => {
      const agenda = await tx.agenda.findUnique({
        where: { id: query.id },
        select: { sessionId: true, pdf: { select: { id: true, name: true } } },
      });

      if (!agenda) throw new NotFoundException();

      if (!agenda.pdf || !agenda.pdf.id) return agenda;

      const file$ = await this.files.getFile({ fileId: agenda.pdf.id, tx });
      if (!file$) {
        this.logger.error(`Could not retrieve the agenda PDF file from S3`);
        throw new InternalServerErrorException();
      }

      return new StreamableFile(file$, {
        type: FILE_MIME_TYPES.pdf,
        disposition: `inline; filename=${encodeURIComponent(agenda.pdf.name)}`,
      });
    });

    if (file instanceof StreamableFile) return file;

    const html = await this.findAgendaDocumentQuery.handle(query);
    const buffer = await this.agendaRenderer.pdf(html);

    const filename = 'msdqlkfjdsmq.pdf';
    /* TODO: implement*/
    await this.files.create([{ buffer, name }]);

    return new StreamableFile(buffer, {
      disposition: `inline; filename=${encodeURIComponent(filename)}`,
      type: FILE_MIME_TYPES.pdf,
    });
  }
}
