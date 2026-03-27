import { Module } from '@nestjs/common';

import { SessionModule } from 'src/modules/session/session.module';
import { MembersModule } from '../members';
import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { AgendaNominationFilesFinder } from './infrastructure/finders/agenda-nomination-files.finder';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { FindAgendaNominationFilesQuery } from './infrastructure/queries/find-nomination-files.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { DocRenderer } from './infrastructure/services/doc-renderer.service';
import { AgendaRenderer } from './infrastructure/services/renderers/agenda.renderer';
import { HtmlRenderer } from './infrastructure/services/renderers/html.renderer';
import { PdfRenderer } from './infrastructure/services/renderers/pdf/pdf-renderer.service';

@Module({
  imports: [SessionModule, MembersModule],
  controllers: [DocsController],
  providers: [
    AgendaNominationFilesFinder,
    AgendaRenderer,
    AgendaRepository,
    DocRenderer,
    DocsService,
    FindAgendaDocumentQuery,
    FindAgendaDocumentPdfQuery,
    FindAgendaNominationFilesQuery,
    FindChairmenQuery,
    HtmlRenderer,
    PdfRenderer,
  ],
  exports: [DocsService],
})
export class DocsModule {}
