import { Module } from '@nestjs/common';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { FakeReportListingVMRepository } from '../../secondary/repositories/fake-report-listing-vm.repository';
import { ReporterController } from './reporter.controller';
import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { FakeNominationFileReportRepository } from '../../secondary/repositories/fake-nomination-file-report.repository';
import { RetrieveReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { FakeReportRetrievalVMQuery } from '../../secondary/repositories/fake-report-retrieval-vm.query';
import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { ReportRetrievalVMBuilder } from 'src/reporter-context/business-logic/models/report-retrieval-vm.builder';

export const REPORT_LISTING_QUERY = 'REPORT_LISTING_QUERY';
export const REPORT_RETRIEVAL_QUERY = 'REPORT_RETRIEVAL_QUERY';
export const NOMINATION_FILE_REPORT_REPOSITORY =
  'NOMINATION_FILE_REPORT_REPOSITORY';

@Module({
  controllers: [ReporterController],
  providers: [
    {
      provide: ChangeRuleValidationStateUseCase,
      useFactory: (nominationFileReportRepository: ReportRepository) => {
        return new ChangeRuleValidationStateUseCase(
          nominationFileReportRepository,
        );
      },
      inject: [NOMINATION_FILE_REPORT_REPOSITORY],
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
      provide: REPORT_LISTING_QUERY,
      useFactory: (): ReportListingVMQuery => {
        const reportListingRepository = new FakeReportListingVMRepository();
        reportListingRepository.reportsList = [
          {
            id: 'd3696935-e0c6-40c5-8db0-3c1a395a5ba8',
            title: 'Report 1',
            dueDate: '2030-10-05',
          },
          {
            id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
            title: 'Report 2',
            dueDate: null,
          },
        ];
        return reportListingRepository;
      },
    },
    {
      provide: REPORT_RETRIEVAL_QUERY,
      useFactory: (): ReportRetrievalVMQuery => {
        const reportRetrievalQuery = new FakeReportRetrievalVMQuery();

        reportRetrievalQuery.reports = {
          'd3696935-e0c6-40c5-8db0-3c1a395a5ba8': new ReportRetrievalVMBuilder()
            .withId('d3696935-e0c6-40c5-8db0-3c1a395a5ba8')
            .withOverseasToOverseasRuleValidated(false)
            .build(),
          'f6c92518-19a1-488d-b518-5c39d3ac26c7': new ReportRetrievalVMBuilder()
            .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
            .withOverseasToOverseasRuleValidated(false)
            .build(),
        };

        return reportRetrievalQuery;
      },
    },
    {
      provide: NOMINATION_FILE_REPORT_REPOSITORY,
      useFactory: (): ReportRepository => {
        const nominationFileReportRepository =
          new FakeNominationFileReportRepository();

        nominationFileReportRepository.reports = {
          'd3696935-e0c6-40c5-8db0-3c1a395a5ba8': new ReportBuilder()
            .withId('d3696935-e0c6-40c5-8db0-3c1a395a5ba8')
            .withOverseasToOverseasRuleValidated(false)
            .build(),
          'f6c92518-19a1-488d-b518-5c39d3ac26c7': new ReportBuilder()
            .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
            .withOverseasToOverseasRuleValidated(false)
            .build(),
        };

        return nominationFileReportRepository;
      },
    },
  ],
})
export class ReporterModule {}
