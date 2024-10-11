import { Module } from '@nestjs/common';
import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { ReportRetrievalVMBuilder } from 'src/reporter-context/business-logic/models/report-retrieval-vm.builder';
import { ReportRuleBuilder } from 'src/reporter-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { FakeNominationFileReportRepository } from '../../secondary/repositories/fake-nomination-file-report.repository';
import { FakeReportListingVMRepository } from '../../secondary/repositories/fake-report-listing-vm.repository';
import { FakeReportRetrievalVMQuery } from '../../secondary/repositories/fake-report-retrieval-vm.query';
import { FakeReportRuleRepository } from '../../secondary/repositories/fake-report-rule.repository';
import { ReporterController } from './reporter.controller';

export const REPORT_LISTING_QUERY = 'REPORT_LISTING_QUERY';
export const REPORT_RULE_REPOSITORY = 'REPORT_RULE_REPOSITORY';
export const REPORT_RETRIEVAL_QUERY = 'REPORT_RETRIEVAL_QUERY';
export const NOMINATION_FILE_REPORT_REPOSITORY =
  'NOMINATION_FILE_REPORT_REPOSITORY';

@Module({
  controllers: [ReporterController],
  providers: [
    {
      provide: ChangeRuleValidationStateUseCase,
      useFactory: (reportRuleRepository: ReportRuleRepository) => {
        return new ChangeRuleValidationStateUseCase(reportRuleRepository);
      },
      inject: [REPORT_RULE_REPOSITORY],
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
            name: 'Marcel Dupont',
            dueDate: '2030-10-05',
          },
          {
            id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
            name: 'Ada Lovelace',
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
            .withTitle('Marcel Dupont')
            .withBiography(
              `- DEA dr priv.
              - Auditric Just 18 janvier 1991, PF 04 février 1991. 
              - J Cambrai, (2ème grade), (Chg Ti Cambrai), 13 août 1993, (Installat. 03 septembre 1993). 
              - (Chg fonct JAP, 11 janvier 1995). 
              - J Évry, (Chg Ti Longjumeau), 13 juillet 1995, (Installat. 1er septembre 1995). 
              - J Créteil, (2ème grade), (Chg Ti Villejuif), 26 juillet 2000. 
              -  VPTI EVRY,(TI  PALAISEAU) (1er grade),  13/08/2004 (Ins.03/09/2004).. 
              -  VP MELUN 26/06/2006 (Ins.04/09/2006).. VPTI MARSEILLE,(TI  AUBAGNE) 20/07/2011 (Ins.01/09/2011). 
              - C AIX EN PROVENCE 08/08/2016 (Ins.29/08/2016).
              `,
            )
            .withOverseasToOverseasRuleValidated(false)
            .build(),
          'f6c92518-19a1-488d-b518-5c39d3ac26c7': new ReportRetrievalVMBuilder()
            .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
            .withTitle('Ada Lovelace')
            .withBiography(
              `- DEA dr priv.
              - Auditric Just 18 janvier 1991, PF 04 février 1991. 
              - J Cambrai, (2ème grade), (Chg Ti Cambrai), 13 août 1993, (Installat. 03 septembre 1993). 
              - (Chg fonct JAP, 11 janvier 1995). 
              - J Évry, (Chg Ti Longjumeau), 13 juillet 1995, (Installat. 1er septembre 1995). 
              - J Créteil, (2ème grade), (Chg Ti Villejuif), 26 juillet 2000. 
              -  VPTI EVRY,(TI  PALAISEAU) (1er grade),  13/08/2004 (Ins.03/09/2004).. 
              -  VP MELUN 26/06/2006 (Ins.04/09/2006).. VPTI MARSEILLE,(TI  AUBAGNE) 20/07/2011 (Ins.01/09/2011). 
              - C AIX EN PROVENCE 08/08/2016 (Ins.29/08/2016).
              `,
            )
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
            .build(),
          'f6c92518-19a1-488d-b518-5c39d3ac26c7': new ReportBuilder()
            .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
            .build(),
        };

        return nominationFileReportRepository;
      },
    },
    {
      provide: REPORT_RULE_REPOSITORY,
      useFactory: (): ReportRuleRepository => {
        const reportRuleRepository = new FakeReportRuleRepository();
        reportRuleRepository.reportRules = {
          'd4596935-e0c6-40c5-8db0-3c1a395a5ba8': new ReportRuleBuilder()
            .withId('d4596935-e0c6-40c5-8db0-3c1a395a5ba8')
            .withReportId('d3696935-e0c6-40c5-8db0-3c1a395a5ba8')
            .withOverseasToOverseasRuleValidated(false)
            .build(),
          'f9c92518-19a1-488d-b518-5c39d3ac26c7': new ReportRuleBuilder()
            .withId('f9c92518-19a1-488d-b518-5c39d3ac26c7')
            .withReportId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
            .withOverseasToOverseasRuleValidated(false)
            .build(),
        };
        return reportRuleRepository;
      },
    },
  ],
})
export class ReporterModule {}
