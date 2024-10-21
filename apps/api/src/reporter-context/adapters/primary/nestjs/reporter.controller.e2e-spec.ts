import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  rulesTuple,
  Transparency,
} from '@/shared-models';
import { HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportRetrievalVMBuilder } from 'src/reporter-context/business-logic/models/report-retrieval-vm.builder';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reporter-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { DATA_SOURCE } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import request from 'supertest';
import { clearDB } from 'test/docker-postgresql-manager';
import { ormConfigTest } from 'test/orm-config.test';
import { DataSource } from 'typeorm';
import { ReportPm } from '../../secondary/repositories/typeorm/entities/report-pm';
import { ReportRulePm } from '../../secondary/repositories/typeorm/entities/report-rule-pm';
import { ChangeRuleValidationStateDto } from '../nestia/change-rule-validation-state.dto';

describe('Reporter Controller', () => {
  let app: NestApplication;
  let typeormDataSource: DataSource;
  let dataSource: DataSource;

  beforeAll(async () => {
    typeormDataSource = new DataSource(ormConfigTest('src'));
    await typeormDataSource.initialize();
  });

  beforeEach(async () => {
    await clearDB(typeormDataSource);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATA_SOURCE)
      .useValue(typeormDataSource)
      .compile();
    app = moduleFixture.createNestApplication();

    dataSource = app.get(DATA_SOURCE);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('GET /api/reports', () => {
    beforeEach(async () => {
      await dataSource
        .getRepository(ReportPm)
        .save(ReportPm.fromDomain(aReport));
    });

    it('lists reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports')
        .expect(HttpStatus.OK);
      expect(response.body.data).toEqual([aReportListingVM]);
    });

    const aReportListingVM: ReportListItemVM = {
      id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      state: NominationFile.ReportState.NEW,
      dueDate: {
        year: 2030,
        month: 10,
        day: 5,
      },
      formation: Magistrat.Formation.PARQUET,
      name: 'a name',
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.HH,
      targettedPosition: 'a position',
    };
    const aReport = ReportBuilder.fromListingVM(aReportListingVM).build();
  });

  describe('GET /api/reports/:id', () => {
    let reportRules: (readonly [NominationFile.RuleGroup, ReportRule])[];

    beforeEach(async () => {
      const reportRulesPromises = rulesTuple.map(
        async ([ruleGroup, ruleName]) => {
          const reportRule = new ReportRuleBuilder()
            .withId(crypto.randomUUID())
            .withReportId(aReport.id)
            .withRuleGroup(ruleGroup)
            .withRuleName(ruleName)
            .build();
          await dataSource
            .getRepository(ReportRulePm)
            .save(ReportRulePm.fromDomain(reportRule));

          return [ruleGroup, reportRule] as const;
        },
      );
      reportRules = await Promise.all(reportRulesPromises);

      await dataSource
        .getRepository(ReportPm)
        .save(ReportPm.fromDomain(aReport));
    });

    it('retrieves a report', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${aReportRetrievedVM.id}`)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual<ReportRetrievalVM>({
        ...aReportRetrievedVM,
        rules: reportRules.reduce(
          (acc, [ruleGroup, reportRule]) => {
            const ruleSnapshot = reportRule.toSnapshot();
            return {
              ...acc,
              [ruleGroup]: {
                ...acc[ruleGroup],
                [ruleSnapshot.ruleName]: {
                  id: ruleSnapshot.id,
                  preValidated: ruleSnapshot.preValidated,
                  validated: ruleSnapshot.validated,
                  comment: ruleSnapshot.comment,
                },
              },
            };
          },
          {} as ReportRetrievalVM['rules'],
        ),
      });
    });

    const aReportRetrievedVM: ReportRetrievalVM = new ReportRetrievalVMBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
    const aReport = ReportBuilder.fromRetrievalVM(aReportRetrievedVM).build();
  });

  describe('PUT /api/reports/rules/:id', () => {
    beforeEach(async () => {
      await dataSource
        .getRepository(ReportPm)
        .save(ReportPm.fromDomain(nominationFileReport));
    });

    it('forbids unvalidated rule id', async () => {
      const body: ChangeRuleValidationStateDto = {
        validated: false,
      };
      await request(app.getHttpServer())
        .put('/api/reports/rules/invalid-id')
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
        .put(`/api/reports/rules/${nominationFileReport.id}`)
        .send(wrongBody)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('unvalidates an overseas to overseas validation rule', async () => {
      await dataSource
        .getRepository(ReportRulePm)
        .save(ReportRulePm.fromDomain(reportRule));

      const reportRuleSnapshot = reportRule.toSnapshot();
      const body: ChangeRuleValidationStateDto = {
        validated: false,
      };
      const response = await request(app.getHttpServer())
        .put(`/api/reports/rules/${reportRuleSnapshot.id}`)
        .send(body)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual('');

      const savedReportRules = await dataSource
        .getRepository(ReportRulePm)
        .find({ where: { id: reportRuleSnapshot.id } });
      expect(savedReportRules).toEqual<typeof savedReportRules>([
        ReportRulePm.fromDomain(
          ReportRule.fromSnapshot({ ...reportRuleSnapshot, validated: false }),
        ),
      ]);
    });

    const nominationFileReport: NominationFileReport = new ReportBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
    const reportRule = new ReportRuleBuilder()
      .withId('f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .withReportId(nominationFileReport.id)
      .build();
  });
});
