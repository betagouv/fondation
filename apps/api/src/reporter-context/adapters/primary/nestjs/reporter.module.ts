import { Module } from '@nestjs/common';
import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import {
  DATA_SOURCE,
  SharedKernelModule,
  TRANSACTION_PERFORMER,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DataSource } from 'typeorm';
import { SqlNominationFileReportRepository } from '../../secondary/repositories/typeorm/sql-nomination-file-report.repository';
import { SqlReportListingVMQuery } from '../../secondary/repositories/typeorm/sql-report-listing-vm.query';
import { SqlReportRetrievalVMQuery } from '../../secondary/repositories/typeorm/sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from '../../secondary/repositories/typeorm/sql-report-rule.repository';
import { ReporterController } from './reporter.controller';
import { UpdateReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-update/update-report.use-case';

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
      useFactory: (dataSource: DataSource): ReportListingVMQuery => {
        return new SqlReportListingVMQuery(dataSource);
      },
      inject: [DATA_SOURCE],
    },
    {
      provide: REPORT_RETRIEVAL_QUERY,
      useFactory: (dataSource: DataSource): ReportRetrievalVMQuery => {
        return new SqlReportRetrievalVMQuery(dataSource);
      },
      inject: [DATA_SOURCE],
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
