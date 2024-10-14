import { HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportRetrievalVM } from 'src/reporter-context/business-logic/models/report-retrieval-vm';
import { ReportRetrievalVMBuilder } from 'src/reporter-context/business-logic/models/report-retrieval-vm.builder';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reporter-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { ReportListItemVM } from 'src/reporter-context/business-logic/models/reports-listing-vm';
import * as request from 'supertest';
import { FakeNominationFileReportRepository } from '../../secondary/repositories/fake-nomination-file-report.repository';
import { FakeReportListingVMRepository } from '../../secondary/repositories/fake-report-listing-vm.repository';
import { FakeReportRetrievalVMQuery } from '../../secondary/repositories/fake-report-retrieval-vm.query';
import { FakeReportRuleRepository } from '../../secondary/repositories/fake-report-rule.repository';
import { ChangeRuleValidationStateDto } from '../nestia/change-rule-validation-state.dto';
import {
  NOMINATION_FILE_REPORT_REPOSITORY,
  REPORT_LISTING_QUERY,
  REPORT_RETRIEVAL_QUERY,
  REPORT_RULE_REPOSITORY,
} from './reporter.module';
import { ReportState } from 'src/reporter-context/business-logic/models/enums/report-state.enum';
import { Formation } from 'src/reporter-context/business-logic/models/enums/formation.enum';
import { Transparency } from 'src/reporter-context/business-logic/models/enums/transparency.enum';
import { Grade } from 'src/reporter-context/business-logic/models/enums/grade.enum';

describe('Reporter Controller', () => {
  let app: NestApplication;
  let nominationFileReportRepository: FakeNominationFileReportRepository;
  let reportRuleRepository: FakeReportRuleRepository;
  let reportListingRepository: FakeReportListingVMRepository;
  let reportRetrievalVMQuery: FakeReportRetrievalVMQuery;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();

    reportListingRepository = app.get(REPORT_LISTING_QUERY);
    reportRuleRepository = app.get(REPORT_RULE_REPOSITORY);
    reportRetrievalVMQuery = app.get(REPORT_RETRIEVAL_QUERY);
    nominationFileReportRepository = app.get(NOMINATION_FILE_REPORT_REPOSITORY);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/reports', () => {
    beforeEach(() => {
      reportListingRepository.reportsList = [aReportListingVM];
    });

    it('lists reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports')
        .expect(HttpStatus.OK);
      expect(response.body.data).toEqual([aReportListingVM]);
    });

    const aReportListingVM: ReportListItemVM = {
      id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      state: ReportState.NEW,
      dueDate: {
        year: 2030,
        month: 10,
        day: 5,
      },
      formation: Formation.PARQUET,
      name: 'a name',
      transparency: Transparency.MARCH_2025,
      grade: Grade.HH,
      targettedPosition: 'a position',
    };
  });

  describe('GET /api/reports/:id', () => {
    beforeEach(() => {
      reportRetrievalVMQuery.reports = {
        [aReportRetrievedVM.id]: aReportRetrievedVM,
      };
    });

    it('retrieves a report', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${aReportRetrievedVM.id}`)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual(aReportRetrievedVM);
    });

    const aReportRetrievedVM: ReportRetrievalVM = new ReportRetrievalVMBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
  });

  describe('PUT /api/reports', () => {
    beforeEach(() => {
      nominationFileReportRepository.reports = {
        [nominationFileReport.id]: nominationFileReport,
      };
    });

    it('forbids unvalidated report id', async () => {
      const body: ChangeRuleValidationStateDto = {
        validated: false,
      };
      await request(app.getHttpServer())
        .put('/api/reports/invalid-id')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });

    const wrongBodies = [
      {
        validated: 'false',
      },
    ];
    it.each(wrongBodies)('forbids unvalidated body', async (wrongBody) => {
      await request(app.getHttpServer())
        .put(`/api/reports/${nominationFileReport.id}`)
        .send(wrongBody)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('unvalidates an overseas to overseas validation rule', async () => {
      const reportRuleSnapshot = reportRule.toSnapshot();
      reportRuleRepository.reportRules = {
        [reportRuleSnapshot.id]: reportRule,
      };

      const body: ChangeRuleValidationStateDto = {
        validated: false,
      };
      const response = await request(app.getHttpServer())
        .put(`/api/reports/${reportRuleSnapshot.id}`)
        .send(body)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual('');

      const savedReport = await reportRuleRepository.byId(
        reportRuleSnapshot.id,
      );
      expect(savedReport).toEqual<ReportRule>(
        new ReportRule(
          reportRuleSnapshot.id,
          reportRuleSnapshot.reportId,
          reportRuleSnapshot.ruleGroup,
          reportRuleSnapshot.ruleName,
          reportRuleSnapshot.preValidated,
          false,
          reportRuleSnapshot.comment,
        ),
      );
    });

    const nominationFileReport: NominationFileReport = new ReportBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
    const reportRule = new ReportRuleBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
  });
});
