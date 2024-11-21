import { HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import PDF from 'pdfkit';
import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  rulesTuple,
  Transparency,
} from 'shared-models';
import { AppModule } from 'src/app.module';
import { ReportRetrievalVMBuilder } from 'src/reports-context/business-logic/models/report-retrieval-vm.builder';
import {
  ReportRule,
  ReportRuleSnapshot,
} from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import request from 'supertest';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from '../../secondary/gateways/repositories/drizzle/schema/report-pm';
import { reportRules } from '../../secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SqlReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-report.repository';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { ChangeRuleValidationStateDto } from '../nestia/change-rule-validation-state.dto';
import { reportAttachedFiles } from '../../secondary/gateways/repositories/drizzle/schema/report-attached-file-pm';

describe('Reports Controller', () => {
  let app: NestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  describe('GET /api/reports', () => {
    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReportSnapshot);
      await db.insert(reports).values(reportRow).execute();
    });

    it('lists reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports')
        .expect(HttpStatus.OK);
      expect(response.body.data).toEqual([aReportListingVM]);
    });

    const aReportListingVM: ReportListItemVM = {
      id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      folderNumber: 1,
      state: NominationFile.ReportState.NEW,
      dueDate: {
        year: 2030,
        month: 10,
        day: 5,
      },
      formation: Magistrat.Formation.PARQUET,
      name: 'a name',
      reporterName: 'REPORTER Name',
      transparency: Transparency.MARCH_2025,
      grade: Magistrat.Grade.HH,
      targettedPosition: 'a position',
      observersCount: 1,
    };
    const aReportSnapshot = ReportBuilder.fromListingVM(aReportListingVM)
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .build();
  });

  describe('GET /api/reports/:id', () => {
    let reportRulesSaved: (readonly [
      NominationFile.RuleGroup,
      ReportRuleSnapshot,
    ])[];

    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      const reportRulesPromises = rulesTuple.map(
        async ([ruleGroup, ruleName]) => {
          const reportRuleSnapshot = new ReportRuleBuilder()
            .with('id', crypto.randomUUID())
            .with('reportId', aReport.id)
            .with('ruleGroup', ruleGroup)
            .with('ruleName', ruleName)
            .build();

          const ruleRow =
            SqlReportRuleRepository.mapSnapshotToDb(reportRuleSnapshot);
          await db.insert(reportRules).values(ruleRow).execute();

          return [ruleGroup, reportRuleSnapshot] as const;
        },
      );
      reportRulesSaved = await Promise.all(reportRulesPromises);
    });

    it('retrieves a report', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/${aReportRetrievedVM.id}`)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual<ReportRetrievalVM>({
        ...aReportRetrievedVM,
        rules: reportRulesSaved.reduce(
          (acc, [ruleGroup, reportRuleSnapshot]) => ({
            ...acc,
            [ruleGroup]: {
              ...acc[ruleGroup],
              [reportRuleSnapshot.ruleName]: {
                id: reportRuleSnapshot.id,
                preValidated: reportRuleSnapshot.preValidated,
                validated: reportRuleSnapshot.validated,
                comment: reportRuleSnapshot.comment,
              },
            },
          }),
          {} as ReportRetrievalVM['rules'],
        ),
      });
    });

    const aReportRetrievedVM: ReportRetrievalVM = new ReportRetrievalVMBuilder()
      .with('id', 'f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .build();
    const aReport = ReportBuilder.fromRetrievalVM(aReportRetrievedVM)
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .build();
  });

  describe('PUT /api/reports/rules/:id', () => {
    beforeEach(async () => {
      const reportRow =
        SqlReportRepository.mapSnapshotToDb(nominationFileReport);
      await db.insert(reports).values(reportRow).execute();
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
      const ruleRow =
        SqlReportRuleRepository.mapSnapshotToDb(reportRuleSnapshot);
      await db.insert(reportRules).values(ruleRow).execute();

      const body: ChangeRuleValidationStateDto = {
        validated: false,
      };
      const response = await request(app.getHttpServer())
        .put(`/api/reports/rules/${reportRuleSnapshot.id}`)
        .send(body)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual('');

      const savedReportRules = await db
        .select()
        .from(reportRules)
        .where(eq(reportRules.id, reportRuleSnapshot.id))
        .execute();
      expect(savedReportRules).toEqual([
        SqlReportRuleRepository.mapToDb(
          ReportRule.fromSnapshot({ ...reportRuleSnapshot, validated: false }),
        ),
      ]);
    });

    const nominationFileReport = new ReportBuilder()
      .with('id', 'f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .build();
    const reportRuleSnapshot = new ReportRuleBuilder()
      .with('id', 'f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .with('reportId', nominationFileReport.id)
      .build();
  });

  describe('POST /api/reports/:id/files/upload-one', () => {
    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReportSnapshot);
      await db.insert(reports).values(reportRow).execute();

      await app.listen(3000); // Run server to contact other contexts over REST
    });

    it('uploads a file', async () => {
      const pdfBuffer = givenAPdfBuffer();

      const response = await request(app.getHttpServer())
        .post(`/api/reports/${aReportSnapshot.id}/files/upload-one`)
        .attach('file', pdfBuffer, 'test-file.pdf')
        .expect(201);

      expect(response.body).toBe('');
      expect(
        await db.select().from(reportAttachedFiles).execute(),
      ).toHaveLength(1);
      expect(await db.select().from(reportAttachedFiles).execute()).toEqual([
        {
          id: expect.any(String),
          createdAt: expect.any(Date),
          reportId: aReportSnapshot.id,
          fileId: expect.any(String),
        },
      ]);
    });

    const givenAPdfBuffer = () => {
      const pdfDoc = new PDF();
      pdfDoc.text('This is a test PDF file generated dynamically.');
      pdfDoc.end();
      return pdfDoc.read();
    };

    const aReportSnapshot = new ReportBuilder('uuid').build();
  });
});