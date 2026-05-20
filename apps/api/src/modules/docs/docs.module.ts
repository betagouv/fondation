import { forwardRef, Module } from '@nestjs/common';

import { MembersModule } from 'src/modules/members';
import { SessionModule } from 'src/modules/session/session.module';
import { SimpleAuthModule } from 'src/modules/simple-auth';

import { DocsService } from './docs.service';
import { DocsController } from './infrastructure/docs.controller';
import { AgendaFinder } from './infrastructure/finders/agenda.finder';
import { DocsNominationFilesFinder } from './infrastructure/finders/docs-nomination-files.finder';
import { ReportedNominationFilesFinder } from './infrastructure/finders/reported-nomination-files.finder';
import { DetailsAgendaMetadataQuery } from './infrastructure/queries/details-agenda-metadata.query';
import { DetailsOfficialReportQuery } from './infrastructure/queries/details-official-report.query';
import { DetailsPresentationPlanMetadataQuery } from './infrastructure/queries/details-presentation-plan-metadata.query';
import { DetailsPresentationPlanPdfDocumentQuery } from './infrastructure/queries/details-presentation-plan-pdf-document.query';
import { DetailsSessionAgendaQuery } from './infrastructure/queries/details-session-agenda.query';
import { DetailsSessionOfficialReportQuery } from './infrastructure/queries/details-session-official-report.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import { FindAgendaNominationFilesQuery } from './infrastructure/queries/find-agenda-nomination-files.query';
import { FindChairmenQuery } from './infrastructure/queries/find-chairmen.query';
import { FindJusticeContactsQuery } from './infrastructure/queries/find-justice-contacts.query';
import { FindMembersForNewOfficialReportQuery } from './infrastructure/queries/find-members-for-new-official-report.query';
import { FindOfficialReportDocumentPdfQuery } from './infrastructure/queries/find-official-report-document-pdf.query';
import { FindOfficialReportDocumentQuery } from './infrastructure/queries/find-official-report-document.query';
import { FindPresentationPlanDocumentPdfQuery } from './infrastructure/queries/find-presentation-plan-document-pdf.query';
import { FindPresentationPlanDocumentQuery } from './infrastructure/queries/find-presentation-plan-document.query';
import { FindSessionDocsQuery } from './infrastructure/queries/find-session-docs.query';
import { InternalFindNominationFilesLinkedDocsQuery } from './infrastructure/queries/internal-find-nomination-files-linked-docs.query';
import { IsSessionReadyForDocGenerationQuery } from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import { ListNonPresentedPlansQuery } from './infrastructure/queries/list-non-presented-plans.query';
import { ListPresentedPlansQuery } from './infrastructure/queries/list-presented-plans.query';
import { ListSecretariesGeneralQuery } from './infrastructure/queries/list-secretaries-general.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { JusticePresentationPlanRepository } from './infrastructure/repositories/justice-presentation-plan.repository';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';
import { AgendaRenderer } from './infrastructure/services/renderers/agenda.renderer';
import { OfficialReportRenderer } from './infrastructure/services/renderers/official-report.renderer';
import { PdfRenderer } from './infrastructure/services/renderers/pdf/pdf-renderer.service';
import { PresentationPlanRenderer } from './infrastructure/services/renderers/presentation-plan.renderer';

@Module({
  imports: [SimpleAuthModule, forwardRef(() => SessionModule), forwardRef(() => MembersModule)],
  controllers: [DocsController],
  providers: [
    AgendaFinder,
    AgendaRenderer,
    AgendaRepository,
    DetailsAgendaMetadataQuery,
    DetailsOfficialReportQuery,
    DetailsPresentationPlanMetadataQuery,
    DetailsPresentationPlanPdfDocumentQuery,
    DetailsSessionAgendaQuery,
    DetailsSessionOfficialReportQuery,
    DocsNominationFilesFinder,
    DocsService,
    FindAgendaDocumentPdfQuery,
    FindAgendaDocumentQuery,
    FindAgendaNominationFilesQuery,
    FindChairmenQuery,
    FindJusticeContactsQuery,
    FindMembersForNewOfficialReportQuery,
    FindOfficialReportDocumentPdfQuery,
    FindOfficialReportDocumentQuery,
    FindPresentationPlanDocumentPdfQuery,
    FindPresentationPlanDocumentQuery,
    FindSessionDocsQuery,
    InternalFindNominationFilesLinkedDocsQuery,
    IsSessionReadyForDocGenerationQuery,
    JusticePresentationPlanRepository,
    ListNonPresentedPlansQuery,
    ListPresentedPlansQuery,
    ListSecretariesGeneralQuery,
    OfficialReportRenderer,
    OfficialReportRepository,
    PdfRenderer,
    PresentationPlanRenderer,
    ReportedNominationFilesFinder,
  ],
  exports: [DocsService],
})
export class DocsModule {}
