import { S3Client } from '@aws-sdk/client-s3';
import { HttpStatus, INestApplication } from '@nestjs/common';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import PDF from 'pdfkit';
import {
  allRulesTuple,
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  Transparency,
} from 'shared-models';
import { MainAppConfigurator } from 'src/main.configurator';
import { ReportRetrievalBuilder } from 'src/reports-context/business-logic/models/report-retrieval-vm.builder';
import {
  ReportRule,
  ReportRuleSnapshot,
} from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';
import request from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { deleteS3Files } from 'test/minio';
import { reportAttachedFiles } from '../../secondary/gateways/repositories/drizzle/schema/report-attached-file-pm';
import { reports } from '../../secondary/gateways/repositories/drizzle/schema/report-pm';
import { reportRules } from '../../secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { SqlReportRepository } from '../../secondary/gateways/repositories/drizzle/sql-report.repository';
import { ChangeRuleValidationStateDto } from './dto/change-rule-validation-state.dto';

describe('Reports Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });
  beforeEach(async () => {
    await clearDB(db);
  });
  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  describe('List', () => {
    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReportSnapshot);
      await db.insert(reports).values(reportRow).execute();
    });

    it('requires a valid user session to list reports', async () => {
      await initApp({ validatedSession: false });
      await requestReportsList().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(() => initApp({ validatedSession: true }));

      it('lists reports', async () => {
        const response = await requestReportsList().expect(HttpStatus.OK);
        expect(response.body.data).toEqual([aReportListingVM]);
      });
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
    const requestReportsList = () =>
      request(app.getHttpServer())
        .get('/api/reports')
        .set('Cookie', 'sessionId=unused');
  });

  describe('Report retrieval', () => {
    let reportRulesSaved: (readonly [
      NominationFile.RuleGroup,
      ReportRuleSnapshot,
    ])[];

    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      const reportRulesPromises = allRulesTuple.map(
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

    it('requires a valid user session to list reports', async () => {
      await initApp({ validatedSession: false });
      await requestReport().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(() => initApp({ validatedSession: true }));

      it('retrieves a report', async () => {
        const response = await requestReport().expect(HttpStatus.OK);
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
    });

    const aReportRetrievedVM: ReportRetrievalVM = new ReportRetrievalBuilder()
      .with('id', 'f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .buildVM();
    const aReport = ReportBuilder.fromRetrievalVM(aReportRetrievedVM)
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .build();
    const requestReport = () =>
      request(app.getHttpServer())
        .get(`/api/reports/${aReportRetrievedVM.id}`)
        .set('Cookie', 'sessionId=unused');
  });

  describe('Rules validation state', () => {
    beforeEach(async () => {
      const reportRow =
        SqlReportRepository.mapSnapshotToDb(nominationFileReport);
      await db.insert(reports).values(reportRow).execute();
    });

    it('requires a valid user session', async () => {
      await initApp({ validatedSession: false });
      await requestReportRule().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(() => initApp({ validatedSession: true }));

      it('forbids unvalidated body', async () => {
        const wrongBody = {
          validated: 'false',
        };
        await requestReportRule()
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
        const response = await requestReportRule()
          .send(body)
          .expect(HttpStatus.OK);
        expect(response.body).toEqual({});

        const savedReportRules = await db
          .select()
          .from(reportRules)
          .where(eq(reportRules.id, reportRuleSnapshot.id))
          .execute();
        expect(savedReportRules).toEqual([
          SqlReportRuleRepository.mapToDb(
            ReportRule.fromSnapshot({
              ...reportRuleSnapshot,
              validated: false,
            }),
          ),
        ]);
      });
    });

    const nominationFileReport = new ReportBuilder()
      .with('id', 'f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .build();
    const reportRuleSnapshot = new ReportRuleBuilder()
      .with('id', 'f6c92518-19a1-488d-b518-5c39d3ac26c7')
      .with('reportId', nominationFileReport.id)
      .build();
    const requestReportRule = () =>
      request(app.getHttpServer())
        .put(`/api/reports/rules/${nominationFileReport.id}`)
        .set('Cookie', 'sessionId=unused');
  });

  describe('Files', () => {
    let s3Client: S3Client;

    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReportSnapshot);
      await db.insert(reports).values(reportRow).execute();

      s3Client = app.get(S3Client);
    });

    it('requires a valid user session', async () => {
      await initApp({ validatedSession: false });
      await app.listen(defaultApiConfig.port); // Run server to contact other contexts over REST
      await uploadFile().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(async () => {
        await initApp({ validatedSession: true });
        await app.listen(defaultApiConfig.port); // Run server to contact other contexts over REST
      });

      afterEach(async () => {
        await deleteS3Files(s3Client);
      });

      it('uploads a file', async () => {
        const response = await uploadFile().expect(201);

        expect(response.body).toEqual({});

        const savedFiles = await db
          .select()
          .from(reportAttachedFiles)
          .execute();
        expect(savedFiles).toEqual<(typeof reportAttachedFiles.$inferSelect)[]>(
          [
            {
              createdAt: expect.any(Date),
              reportId: aReportSnapshot.id,
              name: 'test-file.pdf',
              fileId: expect.any(String),
            },
          ],
        );
      });

      it('get a file signed URL', async () => {
        await uploadFile().expect(201);

        const response = await request(app.getHttpServer())
          .get(`/api/reports/${aReportSnapshot.id}/files/test-file.pdf`)
          .set('Cookie', 'sessionId=unused')
          .expect(HttpStatus.OK);

        expect(response.text).toEqual(expect.stringMatching(/^http/));
      });

      it('deletes a file', async () => {
        await uploadFile().expect(201);

        await request(app.getHttpServer())
          .delete(`/api/reports/${aReportSnapshot.id}/files/test-file.pdf`)
          .set('Cookie', 'sessionId=unused')
          .expect(HttpStatus.OK);

        const savedFiles = await db
          .select()
          .from(reportAttachedFiles)
          .execute();
        expect(savedFiles).toEqual([]);
      });
    });

    const uploadFile = () => {
      const pdfBuffer = givenAPdfBuffer();

      return request(app.getHttpServer())
        .post(`/api/reports/${aReportSnapshot.id}/files/upload-one`)
        .set('Cookie', 'sessionId=unused')
        .attach('file', pdfBuffer, 'test-file.pdf');
    };

    const givenAPdfBuffer = () => {
      const pdfDoc = new PDF();
      pdfDoc.text('This is a test PDF file generated dynamically.');
      pdfDoc.end();
      return pdfDoc.read();
    };
    const aReportSnapshot = new ReportBuilder('uuid').build();
  });

  const initApp = async ({
    validatedSession,
  }: {
    validatedSession: boolean;
  }) => {
    const moduleFixture = await new AppTestingModule()
      .withStubSessionValidationService(validatedSession)
      .compile();

    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    await app.init();
  };

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubSessionValidationService(validated: boolean) {
      this.moduleFixture.overrideProvider(SessionValidationService).useClass(
        class StubSessionValidationService {
          async validateSession(): Promise<boolean> {
            return validated;
          }
        },
      );
      return this;
    }
  }
});
