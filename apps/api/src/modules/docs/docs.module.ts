import { Module } from '@nestjs/common';

import { SessionModule } from 'src/modules/session/session.module';
import { MembersModule } from '../members';
import { SimpleAuthModule } from '../simple-auth';
import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { AgendaNominationFilesFinder } from './infrastructure/finders/agenda-nomination-files.finder';
import { DetailsAgendaMetadataQuery } from './infrastructure/queries/details-agenda-metadata.query';
import { DetailsSessionAgendaQuery } from './infrastructure/queries/details-session-agenda.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { FindAgendasForNewOfficialReportQuery } from './infrastructure/queries/find-agendas-for-new-official-report.query';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { FindJusticeContactsQuery } from './infrastructure/queries/find-justice-contacts.query';
import { FindMembersForNewOfficialReportQuery } from './infrastructure/queries/find-members-for-new-official-report.query';
import { FindOfficialReportDocumentQuery } from './infrastructure/queries/find-official-report-document.query';
import { FindSessionDocsQuery } from './infrastructure/queries/find-session-docs.query';
import { IsSessionReadyForDocGenerationQuery } from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import { ListSecretariesGeneralForNewOfficialReportQuery } from './infrastructure/queries/list-secretaries-general-for-new-official-report.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';
import { AgendaRenderer } from './infrastructure/services/renderers/agenda.renderer';
import { OfficialReportRenderer } from './infrastructure/services/renderers/official-report.renderer';
import { PdfRenderer } from './infrastructure/services/renderers/pdf/pdf-renderer.service';

@Module({
  imports: [SessionModule, SimpleAuthModule, MembersModule],
  controllers: [DocsController],
  providers: [
    AgendaNominationFilesFinder,
    AgendaRenderer,
    AgendaRepository,
    DetailsAgendaMetadataQuery,
    DetailsSessionAgendaQuery,
    DocsService,
    FindAgendaDocumentPdfQuery,
    FindAgendaDocumentQuery,
    FindAgendasForNewOfficialReportQuery,
    FindChairmenQuery,
    FindJusticeContactsQuery,
    FindMembersForNewOfficialReportQuery,
    FindOfficialReportDocumentQuery,
    FindSessionDocsQuery,
    IsSessionReadyForDocGenerationQuery,
    ListSecretariesGeneralForNewOfficialReportQuery,
    OfficialReportRenderer,
    OfficialReportRepository,
    PdfRenderer,
  ],
  exports: [DocsService],
})
export class DocsModule {}
