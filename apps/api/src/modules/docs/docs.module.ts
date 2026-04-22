import { Module } from '@nestjs/common';

import { SessionModule } from 'src/modules/session/session.module';
import { MembersModule } from '../members';
import { SimpleAuthModule } from '../simple-auth';
import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { AgendaNominationFilesFinder } from './infrastructure/finders/agenda-nomination-files.finder';
import { AgendaFinder } from './infrastructure/finders/agenda.finder';
import { DetailsAgendaMetadataQuery } from './infrastructure/queries/details-agenda-metadata.query';
import { DetailsOfficialReportQuery } from './infrastructure/queries/details-official-report.query';
import { DetailsPresentationPlanMetadataQuery } from './infrastructure/queries/details-presentation-plan-metadata.query';
import { DetailsSessionAgendaQuery } from './infrastructure/queries/details-session-agenda.query';
import { DetailsSessionOfficialReportQuery } from './infrastructure/queries/details-session-official-report.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { FindJusticeContactsQuery } from './infrastructure/queries/find-justice-contacts.query';
import { FindMembersForNewOfficialReportQuery } from './infrastructure/queries/find-members-for-new-official-report.query';
import { FindOfficialReportDocumentPdfQuery } from './infrastructure/queries/find-official-report-document-pdf.query';
import { FindOfficialReportDocumentQuery } from './infrastructure/queries/find-official-report-document.query';
import { FindPresentationPlanDocumentPdfQuery } from './infrastructure/queries/find-presentation-plan-document-pdf.query';
import { FindPresentationPlanDocumentQuery } from './infrastructure/queries/find-presentation-plan-document.query';
import { FindSessionDocsQuery } from './infrastructure/queries/find-session-docs.query';
import { IsSessionReadyForDocGenerationQuery } from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import { ListSecretariesGeneralQuery } from './infrastructure/queries/list-secretaries-general.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';
import { AgendaRenderer } from './infrastructure/services/renderers/agenda.renderer';
import { OfficialReportRenderer } from './infrastructure/services/renderers/official-report.renderer';
import { PdfRenderer } from './infrastructure/services/renderers/pdf/pdf-renderer.service';
import { PresentationPlanRenderer } from './infrastructure/services/renderers/presentation-plan.renderer';

@Module({
  imports: [SessionModule, SimpleAuthModule, MembersModule],
  controllers: [DocsController],
  providers: [
    AgendaFinder,
    AgendaNominationFilesFinder,
    AgendaRenderer,
    AgendaRepository,
    DetailsAgendaMetadataQuery,
    DetailsOfficialReportQuery,
    DetailsPresentationPlanMetadataQuery,
    DetailsSessionAgendaQuery,
    DetailsSessionOfficialReportQuery,
    DocsService,
    FindAgendaDocumentPdfQuery,
    FindAgendaDocumentQuery,
    FindChairmenQuery,
    FindJusticeContactsQuery,
    FindMembersForNewOfficialReportQuery,
    FindOfficialReportDocumentPdfQuery,
    FindOfficialReportDocumentQuery,
    FindPresentationPlanDocumentPdfQuery,
    FindPresentationPlanDocumentQuery,
    FindSessionDocsQuery,
    IsSessionReadyForDocGenerationQuery,
    ListSecretariesGeneralQuery,
    OfficialReportRenderer,
    OfficialReportRepository,
    PdfRenderer,
    PresentationPlanRenderer,
  ],
  exports: [DocsService],
})
export class DocsModule {}
