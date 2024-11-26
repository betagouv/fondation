import { Module } from '@nestjs/common';
import { AttachReportFileUseCase } from 'src/reports-context/business-logic/use-cases/report-attach-file/attach-report-file';
import { CreateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportOnImportChangeUseCase } from 'src/reports-context/business-logic/use-cases/report-update-on-import-change/update-report-on-import-change.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DRIZZLE_DB,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { SqlReportAttachedFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-attached-file.repository';
import { SqlReportListingQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-listing-vm.query';
import { SqlReportRetrievalQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { SqlReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-report.repository';
import { HttpReportFileService } from '../../secondary/gateways/services/http-report-file-service';
import { NominationFileImportedSubscriber } from './event-subscribers/nomination-file-imported.subscriber';
import { NominationFileUpdatedSubscriber } from './event-subscribers/nomination-file-updated.subscriber';
import { generateReportsProvider as generateProvider } from './provider-generator';
import { ReportsController } from './reports.controller';
import {
  REPORT_ATTACHED_FILE_REPOSITORY,
  REPORT_FILE_SERVICE,
  REPORT_LISTING_QUERY,
  REPORT_REPOSITORY,
  REPORT_RETRIEVAL_QUERY,
  REPORT_RULE_REPOSITORY,
} from './tokens';
import { GenerateReportFileUrlUseCase } from 'src/reports-context/business-logic/use-cases/report-file-url-generation/generate-report-file-url';

@Module({
  imports: [SharedKernelModule],
  controllers: [ReportsController],
  providers: [
    generateProvider(NominationFileImportedSubscriber, [CreateReportUseCase]),
    generateProvider(NominationFileUpdatedSubscriber, [
      UpdateReportOnImportChangeUseCase,
    ]),

    generateProvider(AttachReportFileUseCase, [
      REPORT_ATTACHED_FILE_REPOSITORY,
      UUID_GENERATOR,
      REPORT_FILE_SERVICE,
      DATE_TIME_PROVIDER,
      TRANSACTION_PERFORMER,
      REPORT_REPOSITORY,
    ]),
    generateProvider(UpdateReportOnImportChangeUseCase, [
      REPORT_REPOSITORY,
      REPORT_RULE_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(CreateReportUseCase, [
      REPORT_REPOSITORY,
      TRANSACTION_PERFORMER,
      UUID_GENERATOR,
      REPORT_RULE_REPOSITORY,
      DATE_TIME_PROVIDER,
    ]),
    generateProvider(ChangeRuleValidationStateUseCase, [
      REPORT_RULE_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(RetrieveReportUseCase, [
      REPORT_RETRIEVAL_QUERY,
      REPORT_FILE_SERVICE,
    ]),
    generateProvider(ListReportsUseCase, [REPORT_LISTING_QUERY]),
    generateProvider(UpdateReportUseCase, [
      REPORT_REPOSITORY,
      TRANSACTION_PERFORMER,
    ]),
    generateProvider(AttachReportFileUseCase, [
      REPORT_ATTACHED_FILE_REPOSITORY,
      UUID_GENERATOR,
      REPORT_FILE_SERVICE,
      DATE_TIME_PROVIDER,
      TRANSACTION_PERFORMER,
      REPORT_REPOSITORY,
    ]),
    generateProvider(GenerateReportFileUrlUseCase, [
      TRANSACTION_PERFORMER,
      REPORT_ATTACHED_FILE_REPOSITORY,
      REPORT_FILE_SERVICE,
    ]),

    generateProvider(HttpReportFileService, [API_CONFIG], REPORT_FILE_SERVICE),

    generateProvider(SqlReportListingQuery, [DRIZZLE_DB], REPORT_LISTING_QUERY),
    generateProvider(
      SqlReportRetrievalQuery,
      [DRIZZLE_DB],
      REPORT_RETRIEVAL_QUERY,
    ),
    generateProvider(SqlReportRepository, [], REPORT_REPOSITORY),
    generateProvider(SqlReportRuleRepository, [], REPORT_RULE_REPOSITORY),
    generateProvider(
      SqlReportAttachedFileRepository,
      [],
      REPORT_ATTACHED_FILE_REPOSITORY,
    ),
  ],
})
export class ReportsModule {}
