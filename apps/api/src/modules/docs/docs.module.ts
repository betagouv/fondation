import { forwardRef, Module } from '@nestjs/common';

import { MembersModule } from 'src/modules/members';
import { SessionModule } from 'src/modules/session/session.module';
import { SimpleAuthModule } from 'src/modules/simple-auth';

import { AgendasController } from './agenda/agendas.controller';
import { AgendasService } from './agenda/agendas.service';
import { DetailsAgendaFilesQuery } from './agenda/infrastructure/queries/details-agenda-files.query';
import { DetailsAgendaMetadataQuery } from './agenda/infrastructure/queries/details-agenda-metadata.query';
import { DetailsSessionAgendaQuery } from './agenda/infrastructure/queries/details-session-agenda.query';
import { FindAgendaDocumentPdfQuery } from './agenda/infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './agenda/infrastructure/queries/find-agenda-document.query';
import { AgendaRepository } from './agenda/infrastructure/repositories/agenda.repository';
import { AgendaRenderer } from './agenda/infrastructure/services/renderers/agenda.renderer';
import { DocsService } from './docs.service';
import { OnOfficialReportInvalidatedEventHandler } from './official-report/infrastructure/events/on-official-report-invalidated.event-handler';
import { OfficialReportRenderContextFinder } from './official-report/infrastructure/finders/official-report-render-context.finder';
import { DetailsOfficialReportDocumentQuery } from './official-report/infrastructure/queries/details-official-report-document.query';
import { DetailsOfficialReportQuery } from './official-report/infrastructure/queries/details-official-report.query';
import { DetailsSessionOfficialReportQuery } from './official-report/infrastructure/queries/details-session-official-report.query';
import { FindOfficialReportDocumentPdfQuery } from './official-report/infrastructure/queries/find-official-report-document-pdf.query';
import { FindOfficialReportDocumentQuery } from './official-report/infrastructure/queries/find-official-report-document.query';
import { OfficialReportRepository } from './official-report/infrastructure/repositories/official-report.repository';
import { OfficialReportRenderer } from './official-report/infrastructure/services/renderers/official-report.renderer';
import { InternalInvalidateOfficialReportUseCase } from './official-report/infrastructure/use-cases/invalidate-official-report.use-case';
import { OfficialReportsController } from './official-report/official-reports.controller';
import { OfficialReportsService } from './official-report/official-reports.service';
import { DetailsPresentationPlanMetadataQuery } from './presentation-plan/infrastructure/queries/details-presentation-plan-metadata.query';
import { DetailsPresentationPlanPdfDocumentQuery } from './presentation-plan/infrastructure/queries/details-presentation-plan-pdf-document.query';
import { FindPresentationPlanDocumentPdfQuery } from './presentation-plan/infrastructure/queries/find-presentation-plan-document-pdf.query';
import { FindPresentationPlanDocumentQuery } from './presentation-plan/infrastructure/queries/find-presentation-plan-document.query';
import { ListNonPresentedPlansQuery } from './presentation-plan/infrastructure/queries/list-non-presented-plans.query';
import { ListPresentedPlansQuery } from './presentation-plan/infrastructure/queries/list-presented-plans.query';
import { JusticePresentationPlanRepository } from './presentation-plan/infrastructure/repositories/justice-presentation-plan.repository';
import { PresentationPlanRenderer } from './presentation-plan/infrastructure/services/renderers/presentation-plan.renderer';
import { PresentationPlansController } from './presentation-plan/presentation-plans.controller';
import { PresentationPlansService } from './presentation-plan/presentation-plans.service';
import { DocsController } from './shared/infrastructure/docs.controller';
import { AgendaFinder } from './shared/infrastructure/finders/agenda.finder';
import { DocsNominationFilesFinder } from './shared/infrastructure/finders/docs-nomination-files.finder';
import { ReportedNominationFilesFinder } from './shared/infrastructure/finders/reported-nomination-files.finder';
import { FindJusticeContactsQuery } from './shared/infrastructure/queries/find-justice-contacts.query';
import { FindSessionDocsQuery } from './shared/infrastructure/queries/find-session-docs.query';
import { InternalFindNominationFilesLinkedDocsQuery } from './shared/infrastructure/queries/internal-find-nomination-files-linked-docs.query';
import { IsSessionReadyForDocGenerationQuery } from './shared/infrastructure/queries/is-session-ready-for-doc-generation.query';
import { ListSecretariesGeneralQuery } from './shared/infrastructure/queries/list-secretaries-general.query';

@Module({
  imports: [SimpleAuthModule, forwardRef(() => SessionModule), forwardRef(() => MembersModule)],
  controllers: [DocsController, AgendasController, OfficialReportsController, PresentationPlansController],
  providers: [
    AgendaFinder,
    AgendaRenderer,
    AgendaRepository,
    AgendasService,
    DetailsAgendaFilesQuery,
    DetailsAgendaMetadataQuery,
    DetailsOfficialReportDocumentQuery,
    DetailsOfficialReportQuery,
    DetailsPresentationPlanMetadataQuery,
    DetailsPresentationPlanPdfDocumentQuery,
    DetailsSessionAgendaQuery,
    DetailsSessionOfficialReportQuery,
    DocsNominationFilesFinder,
    DocsService,
    FindAgendaDocumentPdfQuery,
    FindAgendaDocumentQuery,
    FindJusticeContactsQuery,
    FindOfficialReportDocumentPdfQuery,
    FindOfficialReportDocumentQuery,
    FindPresentationPlanDocumentPdfQuery,
    FindPresentationPlanDocumentQuery,
    FindSessionDocsQuery,
    InternalFindNominationFilesLinkedDocsQuery,
    InternalInvalidateOfficialReportUseCase,
    IsSessionReadyForDocGenerationQuery,
    JusticePresentationPlanRepository,
    ListNonPresentedPlansQuery,
    ListPresentedPlansQuery,
    ListSecretariesGeneralQuery,
    OfficialReportRenderContextFinder,
    OfficialReportRenderer,
    OfficialReportRepository,
    OfficialReportsService,
    OnOfficialReportInvalidatedEventHandler,
    PresentationPlanRenderer,
    PresentationPlansService,
    ReportedNominationFilesFinder,
  ],
  exports: [DocsService],
})
export class DocsModule {}
