import { Module } from '@nestjs/common';

import { SessionModule } from 'src/modules/session/session.module';
import { MembersModule } from '../members';
import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { AgendaNominationFilesFinder } from './infrastructure/finders/agenda-nomination-files.finder';
import { DetailsAgendaMetadataQuery } from './infrastructure/queries/details-agenda-metadata.query';
import { DetailsSessionDocQuery } from './infrastructure/queries/details-session-doc.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { FindSessionDocsQuery } from './infrastructure/queries/find-session-docs.query';
import { IsSessionReadyForDocGenerationQuery } from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { DocRenderer } from './infrastructure/services/doc-renderer.service';
import { AgendaRenderer } from './infrastructure/services/renderers/agenda.renderer';
import { PdfRenderer } from './infrastructure/services/renderers/pdf/pdf-renderer.service';

@Module({
  imports: [SessionModule, MembersModule],
  controllers: [DocsController],
  providers: [
    AgendaNominationFilesFinder,
    AgendaRenderer,
    AgendaRepository,
    DetailsAgendaMetadataQuery,
    DetailsSessionDocQuery,
    DocRenderer,
    DocsService,
    FindAgendaDocumentPdfQuery,
    FindAgendaDocumentQuery,
    FindChairmenQuery,
    FindSessionDocsQuery,
    IsSessionReadyForDocGenerationQuery,
    PdfRenderer,
  ],
  exports: [DocsService],
})
export class DocsModule {}
