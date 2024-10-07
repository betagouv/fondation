import { HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import {
  NominationFileReport,
  NominationFileRule,
} from 'src/reporter-context/business-logic/models/NominationFileReport';
import { ReportListItemVM } from 'src/reporter-context/business-logic/models/ReportsListingVM';
import * as request from 'supertest';
import { FakeNominationFileReportRepository } from '../../secondary/repositories/FakeNominationFileReport.repository';
import { FakeReportListingVMRepository } from '../../secondary/repositories/FakeReportListingVM.repository';
import { ChangeRuleValidationStateDto } from '../nestia/ChangeRuleValidationState.dto';
import {
  NOMINATION_FILE_REPORT_REPOSITORY,
  REPORT_LISTING_REPOSITORY,
} from './reporter.module';

describe('Reporter Controller', () => {
  let app: NestApplication;
  let nominationFileReportRepository: FakeNominationFileReportRepository;
  let reportListingRepository: FakeReportListingVMRepository;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();

    reportListingRepository = app.get(REPORT_LISTING_REPOSITORY);

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

  describe('PUT /api/reports', () => {
    beforeEach(() => {
      nominationFileReportRepository.reports = {
        [nominationFileReport.id]: nominationFileReport,
      };
    });

    it('forbids unvalidated report id', async () => {
      const body: ChangeRuleValidationStateDto = {
        validated: false,
        rule: NominationFileRule.OVERSEAS_TO_OVERSEAS,
      };
      await request(app.getHttpServer())
        .put('/api/reports/invalid-id')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    });

    const wrongBodies = [
      { validated: false, rule: 'OVERSEAS_TO_OVERSEASSSS' },
      { validated: 'false', rule: NominationFileRule.OVERSEAS_TO_OVERSEAS },
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
          rule: NominationFileRule.OVERSEAS_TO_OVERSEAS,
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
          [NominationFileRule.OVERSEAS_TO_OVERSEAS]: {
            validated: false,
          },
        },
      });
    });

    const nominationFileReport: NominationFileReport = {
      id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      managementRules: {
        [NominationFileRule.PROFILED_POSITION]: {
          validated: true,
        },
        [NominationFileRule.OVERSEAS_TO_OVERSEAS]: {
          validated: true,
        },
      },
    };
  });
});
