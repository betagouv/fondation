import { Module } from '@nestjs/common';
import { ReportListingVMQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportRetrievalVMQuery } from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportAttachedFileRepository } from 'src/reports-context/business-logic/gateways/repositories/report-attached-file.repository';
import { ReportRuleRepository } from 'src/reports-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { AttachReportFileUseCase } from 'src/reports-context/business-logic/use-cases/report-attach-file/attach-report-file';
import { CreateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-creation/create-report.use-case';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportOnImportChangeUseCase } from 'src/reports-context/business-logic/use-cases/report-update-on-import-change/update-report-on-import-change.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/nestia/api-config-schema';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DRIZZLE_DB,
  SharedKernelModule,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { SqlNominationFileReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-nomination-file-report.repository';
import { SqlReportAttachedFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-attached-file.repository';
import { SqlReportListingVMQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-listing-vm.query';
import { SqlReportRetrievalVMQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { HttpReportFileService } from '../../secondary/gateways/services/http-report-file-service';
import { NominationFileImportedSubscriber } from './event-subscribers/nomination-file-imported.subscriber';
import { NominationFileUpdatedSubscriber } from './event-subscribers/nomination-file-updated.subscriber';
import { ReporterController } from './reporter.controller';

export const REPORT_LISTING_QUERY = 'REPORT_LISTING_QUERY';
export const REPORT_RULE_REPOSITORY = 'REPORT_RULE_REPOSITORY';
export const REPORT_RETRIEVAL_QUERY = 'REPORT_RETRIEVAL_QUERY';
export const NOMINATION_FILE_REPORT_REPOSITORY =
  'NOMINATION_FILE_REPORT_REPOSITORY';
export const REPORT_FILE_SERVICE = 'REPORT_FILE_SERVICE';
export const REPORT_ATTACHED_FILE_REPOSITORY =
  'REPORT_ATTACHED_FILE_REPOSITORY';

@Module({
  imports: [SharedKernelModule],
  controllers: [ReporterController],
  providers: [
    {
      provide: NominationFileImportedSubscriber,

      useFactory: (createReportUseCase: CreateReportUseCase) => {
        return new NominationFileImportedSubscriber(createReportUseCase);
      },
      inject: [CreateReportUseCase],
    },
    {
      provide: NominationFileUpdatedSubscriber,
      useFactory: (
        updateReportOnImportChangeUseCase: UpdateReportOnImportChangeUseCase,
      ) => {
        return new NominationFileUpdatedSubscriber(
          updateReportOnImportChangeUseCase,
        );
      },
      inject: [UpdateReportOnImportChangeUseCase],
    },

    {
      provide: AttachReportFileUseCase,
      useFactory: (
        reportAttachedFileRepository: ReportAttachedFileRepository,
        uuidGenerator: UuidGenerator,
        reportFileService: ReportFileService,
        dateTimeProvider: DateTimeProvider,
        transactionPerformer: TransactionPerformer,
        reportRepository: ReportRepository,
      ) => {
        return new AttachReportFileUseCase(
          reportAttachedFileRepository,
          uuidGenerator,
          reportFileService,
          dateTimeProvider,
          transactionPerformer,
          reportRepository,
        );
      },
      inject: [
        REPORT_ATTACHED_FILE_REPOSITORY,
        UUID_GENERATOR,
        REPORT_FILE_SERVICE,
        DATE_TIME_PROVIDER,
        TRANSACTION_PERFORMER,
        NOMINATION_FILE_REPORT_REPOSITORY,
      ],
    },
    {
      provide: UpdateReportOnImportChangeUseCase,
      useFactory: (
        reportRepository: ReportRepository,
        reportRuleRepository: ReportRuleRepository,
        transactionPerformer: TransactionPerformer,
      ) => {
        return new UpdateReportOnImportChangeUseCase(
          reportRepository,
          reportRuleRepository,
          transactionPerformer,
        );
      },
      inject: [
        NOMINATION_FILE_REPORT_REPOSITORY,
        REPORT_RULE_REPOSITORY,
        TRANSACTION_PERFORMER,
      ],
    },
    {
      provide: CreateReportUseCase,
      useFactory: (
        reportRepository: ReportRepository,
        transactionPerformer: TransactionPerformer,
        uuidGenerator: UuidGenerator,
        reportRuleRepository: ReportRuleRepository,
        datetimeProvider: DateTimeProvider,
      ) => {
        return new CreateReportUseCase(
          reportRepository,
          transactionPerformer,
          uuidGenerator,
          reportRuleRepository,
          datetimeProvider,
        );
      },
      inject: [
        NOMINATION_FILE_REPORT_REPOSITORY,
        TRANSACTION_PERFORMER,
        UUID_GENERATOR,
        REPORT_RULE_REPOSITORY,
        DATE_TIME_PROVIDER,
      ],
    },
    {
      provide: ChangeRuleValidationStateUseCase,
      useFactory: (
        reportRuleRepository: ReportRuleRepository,
        transactionPerformer: TransactionPerformer,
      ) => {
        return new ChangeRuleValidationStateUseCase(
          reportRuleRepository,
          transactionPerformer,
        );
      },
      inject: [REPORT_RULE_REPOSITORY, TRANSACTION_PERFORMER],
    },
    {
      provide: RetrieveReportUseCase,
      useFactory: (reportRetrievalVMQuery: ReportRetrievalVMQuery) => {
        return new RetrieveReportUseCase(reportRetrievalVMQuery);
      },
      inject: [REPORT_RETRIEVAL_QUERY],
    },
    {
      provide: ListReportsUseCase,
      useFactory: (reportListingRepository: ReportListingVMQuery) => {
        return new ListReportsUseCase(reportListingRepository);
      },
      inject: [REPORT_LISTING_QUERY],
    },
    {
      provide: UpdateReportUseCase,
      useFactory: (
        reportRepository: ReportRepository,
        transactionPerformer: TransactionPerformer,
      ) => {
        return new UpdateReportUseCase(reportRepository, transactionPerformer);
      },
      inject: [NOMINATION_FILE_REPORT_REPOSITORY, TRANSACTION_PERFORMER],
    },

    {
      provide: REPORT_FILE_SERVICE,
      useFactory: (apiConfig: ApiConfig) => {
        return new HttpReportFileService(apiConfig);
      },
      inject: [API_CONFIG],
    },

    {
      provide: REPORT_LISTING_QUERY,
      useFactory: (db: DrizzleDb): ReportListingVMQuery => {
        return new SqlReportListingVMQuery(db);
      },
      inject: [DRIZZLE_DB],
    },
    {
      provide: REPORT_RETRIEVAL_QUERY,
      useFactory: (db: DrizzleDb): ReportRetrievalVMQuery => {
        return new SqlReportRetrievalVMQuery(db);
      },
      inject: [DRIZZLE_DB],
    },
    {
      provide: NOMINATION_FILE_REPORT_REPOSITORY,
      useFactory: (): ReportRepository => {
        return new SqlNominationFileReportRepository();
      },
    },
    {
      provide: REPORT_RULE_REPOSITORY,
      useFactory: (): ReportRuleRepository => {
        return new SqlReportRuleRepository();
      },
    },
    {
      provide: REPORT_ATTACHED_FILE_REPOSITORY,
      useFactory: () => {
        return new SqlReportAttachedFileRepository();
      },
    },
  ],
})
export class ReporterModule {}
