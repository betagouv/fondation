import { Module } from '@nestjs/common';
import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  DRIZZLE_DB,
  SharedKernelModule,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { SqlNominationFileReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-nomination-file-report.repository';
import { SqlReportListingVMQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-listing-vm.query';
import { SqlReportRetrievalVMQuery } from '../../secondary/gateways/repositories/drizzle/sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { ReporterController } from './reporter.controller';
import { NominationFileImportedSubscriber } from './event-subscribers/nomination-file-imported.subscriber';
import { CreateReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-creation/create-report.use-case';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domainEventRepository';

export const REPORT_LISTING_QUERY = 'REPORT_LISTING_QUERY';
export const REPORT_RULE_REPOSITORY = 'REPORT_RULE_REPOSITORY';
export const REPORT_RETRIEVAL_QUERY = 'REPORT_RETRIEVAL_QUERY';
export const NOMINATION_FILE_REPORT_REPOSITORY =
  'NOMINATION_FILE_REPORT_REPOSITORY';

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
      provide: CreateReportUseCase,
      useFactory: (
        reportRepository: ReportRepository,
        transactionPerformer: TransactionPerformer,
        uuidGenerator: UuidGenerator,
        reportRuleRepository: ReportRuleRepository,
        domainEventRepository: DomainEventRepository,
        datetimeProvider: DateTimeProvider,
      ) => {
        return new CreateReportUseCase(
          reportRepository,
          transactionPerformer,
          uuidGenerator,
          reportRuleRepository,
          domainEventRepository,
          datetimeProvider,
        );
      },
      inject: [
        NOMINATION_FILE_REPORT_REPOSITORY,
        TRANSACTION_PERFORMER,
        UUID_GENERATOR,
        REPORT_RULE_REPOSITORY,
        DOMAIN_EVENT_REPOSITORY,
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
  ],
})
export class ReporterModule {}
