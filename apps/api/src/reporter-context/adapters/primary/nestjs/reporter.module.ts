import { Module } from '@nestjs/common';
import { ReportListingVMRepository } from 'src/reporter-context/business-logic/gateways/repositories/ReportListingVM.repository';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/listReports.use-case';
import { FakeReportListingVMRepository } from '../../secondary/repositories/FakeReportListingVM.repository';
import { ReporterController } from './reporter.controller';
import { NominationFileReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/Report.repository';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/changeRuleValidationState.use-case';
import { FakeNominationFileReportRepository } from '../../secondary/repositories/FakeNominationFileReport.repository';

export const REPORT_LISTING_REPOSITORY = 'REPORT_LISTING_REPOSITORY';
export const NOMINATION_FILE_REPORT_REPOSITORY =
  'NOMINATION_FILE_REPORT_REPOSITORY';

@Module({
  controllers: [ReporterController],
  providers: [
    {
      provide: ChangeRuleValidationStateUseCase,
      useFactory: (
        nominationFileReportRepository: NominationFileReportRepository,
      ) => {
        return new ChangeRuleValidationStateUseCase(
          nominationFileReportRepository,
        );
      },
      inject: [NOMINATION_FILE_REPORT_REPOSITORY],
    },
    {
      provide: NOMINATION_FILE_REPORT_REPOSITORY,
      useFactory: (): NominationFileReportRepository => {
        const nominationFileReportRepository =
          new FakeNominationFileReportRepository();

        nominationFileReportRepository.reports = {
          'd3696935-e0c6-40c5-8db0-3c1a395a5ba8': {
            id: 'd3696935-e0c6-40c5-8db0-3c1a395a5ba8',
            managementRules: {
              PROFILED_POSITION: { validated: true },
              OVERSEAS_TO_OVERSEAS: { validated: false },
            },
          },
          'f6c92518-19a1-488d-b518-5c39d3ac26c7': {
            id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
            managementRules: {
              PROFILED_POSITION: { validated: true },
              OVERSEAS_TO_OVERSEAS: { validated: false },
            },
          },
        };

        return nominationFileReportRepository;
      },
    },
    {
      provide: ListReportsUseCase,
      useFactory: (reportListingRepository: ReportListingVMRepository) => {
        return new ListReportsUseCase(reportListingRepository);
      },
      inject: [REPORT_LISTING_REPOSITORY],
    },
    {
      provide: REPORT_LISTING_REPOSITORY,
      useFactory: (): ReportListingVMRepository => {
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
  ],
})
export class ReporterModule {}
