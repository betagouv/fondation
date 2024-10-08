import { HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import {
  NominationFileReport,
  NominationFileRuleName,
} from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportListItemVM } from 'src/reporter-context/business-logic/models/reports-listing-vm';
import * as request from 'supertest';
import { FakeNominationFileReportRepository } from '../../secondary/repositories/fake-nomination-file-report.repository';
import { FakeReportListingVMRepository } from '../../secondary/repositories/fake-report-listing-vm.repository';
import { ChangeRuleValidationStateDto } from '../nestia/change-rule-validation-state.dto';
import {
  NOMINATION_FILE_REPORT_REPOSITORY,
  REPORT_LISTING_QUERY,
  REPORT_RETRIEVAL_QUERY,
} from './reporter.module';
import { FakeReportRetrievalVMQuery } from '../../secondary/repositories/fake-report-retrieval-vm.query';
import { ReportRetrievalVM } from 'src/reporter-context/business-logic/models/report-retrieval-vm';
import { ReportRetrievalVMBuilder } from 'src/reporter-context/business-logic/models/report-retrieval-vm.builder';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';

describe('Reporter Controller', () => {
  let app: NestApplication;
  let nominationFileReportRepository: FakeNominationFileReportRepository;
  let reportListingRepository: FakeReportListingVMRepository;
  let reportRetrievalVMQuery: FakeReportRetrievalVMQuery;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();

    reportListingRepository = app.get(REPORT_LISTING_QUERY);
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
      title: 'a title',
      dueDate: '2030-10-05',
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
        rule: NominationFileRuleName.OVERSEAS_TO_OVERSEAS,
      };
      await request(app.getHttpServer())
        .put('/api/reports/invalid-id')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });

    const wrongBodies = [
      { validated: false, rule: 'OVERSEAS_TO_OVERSEASSSS' },
      { validated: 'false', rule: NominationFileRuleName.OVERSEAS_TO_OVERSEAS },
    ];
    it.each(wrongBodies)(
      'forbids unvalidated report id and body',
      async (wrongBody) => {
        await request(app.getHttpServer())
          .put(`/api/reports/${nominationFileReport.id}`)
          .send(wrongBody)
          .expect(HttpStatus.BAD_REQUEST);
      },
    );

    it('unvalidates an overseas to overseas validation rule', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/reports/${nominationFileReport.id}`)
        .send({
          validated: false,
          rule: NominationFileRuleName.OVERSEAS_TO_OVERSEAS,
        })
        .expect(HttpStatus.OK);
      expect(response.body).toEqual('');

      const savedReport = await nominationFileReportRepository.byId(
        nominationFileReport.id,
      );

      expect(savedReport).toEqual({
        ...nominationFileReport,
        managementRules: {
          ...nominationFileReport.managementRules,
          [NominationFileRuleName.OVERSEAS_TO_OVERSEAS]: {
            validated: false,
          },
        },
      });
    });

    const nominationFileReport: NominationFileReport = new ReportBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
  });
});
