import { S3Client } from '@aws-sdk/client-s3';
import { HttpStatus, INestApplication } from '@nestjs/common';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import PDF from 'pdfkit';
import {
  allRulesTuple,
  Magistrat,
  NominationFile,
  ReportFileUsage,
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
import {
  ExpectReportsInDb,
  expectReportsInDbFactory,
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';
import { clearDB } from 'test/docker-postgresql-manager';
import { deleteS3Files } from 'test/minio';
import { reportRules } from '../../secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { StubUserService } from '../../secondary/gateways/services/stub-user.service';
import { ChangeRuleValidationStateDto } from './dto/change-rule-validation-state.dto';
import { USER_SERVICE } from './tokens';
import { transcode } from 'buffer';

const reporterId = '123e4567-e89b-12d3-a456-426614174000';

describe('Reports Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let givenSomeReports: GivenSomeReports;
  let expectReportsInDb: ExpectReportsInDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
    expectReportsInDb = expectReportsInDbFactory(db);
  });
  beforeEach(async () => {
    await clearDB(db);
  });
  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  describe('List', () => {
    beforeEach(async () => {
      await givenSomeReports(aReportSnapshot);
    });

    it('requires a valid user session to list reports', async () => {
      await initApp({ validatedSession: false });
      await requestReportsList().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(() => initApp({ validatedSession: true }));

      it('lists reports owned by the reporter', async () => {
        await givenAReportNotOwned();
        const response = await requestReportsList().expect(HttpStatus.OK);
        expect(response.body).toEqual({ data: [aReportListingVM] });
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
      transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
      grade: Magistrat.Grade.HH,
      targettedPosition: 'a position',
      observersCount: 1,
    };
    const aReportSnapshot = ReportBuilder.fromListingVM(aReportListingVM)
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .with('reporterId', reporterId)
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
      await givenSomeReports(aReport);

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

      it("cannot retrieve another reporter's report", async () => {
        const aReportNotOwned = await givenAReportNotOwned();
        await request(app.getHttpServer())
          .get(`/api/reports/${aReportNotOwned.id}`)
          .set('Cookie', 'sessionId=unused')
          .expect(HttpStatus.NOT_FOUND);
      });

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
                },
              },
            }),
            {} as ReportRetrievalVM['rules'],
          ),
        });
      });
    });

    const aReportRetrievedVM: ReportRetrievalVM = new ReportRetrievalBuilder(
      'uuid',
    ).buildVM();
    const aReport = ReportBuilder.fromRetrievalVM(aReportRetrievedVM)
      .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
      .with('reporterId', reporterId)
      .build();
    const requestReport = () =>
      request(app.getHttpServer())
        .get(`/api/reports/${aReportRetrievedVM.id}`)
        .set('Cookie', 'sessionId=unused');
  });

  describe('Rules validation state', () => {
    beforeEach(async () => {
      await givenSomeReports(report);
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
        const ruleRow = SqlReportRuleRepository.mapSnapshotToDb(reportRule);
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
          .where(eq(reportRules.id, reportRule.id))
          .execute();
        expect(savedReportRules).toEqual([
          SqlReportRuleRepository.mapToDb(
            ReportRule.fromSnapshot({
              ...reportRule,
              validated: false,
            }),
          ),
        ]);
      });
    });

    const report = new ReportBuilder('uuid').build();
    const reportRule = new ReportRuleBuilder('uuid')
      .with('reportId', report.id)
      .build();

    const requestReportRule = () =>
      request(app.getHttpServer())
        .put(`/api/reports/rules/${reportRule.id}`)
        .set('Cookie', 'sessionId=unused');
  });

  describe('Files', () => {
    let s3Client: S3Client;

    beforeEach(async () => {
      await givenSomeReports(aReportSnapshot);
    });

    it('requires a valid user session', async () => {
      await initApp({ validatedSession: false });
      await app.listen(defaultApiConfig.port); // Run server to contact other contexts over REST
      await uploadFile().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(async () => {
        await initApp({ validatedSession: true });
        s3Client = app.get(S3Client);
        await app.listen(defaultApiConfig.port); // Run server to contact other contexts over REST
      });

      afterEach(async () => {
        await deleteS3Files(s3Client);
      });

      it('uploads a file', async () => {
        const response = await uploadFile(
          ReportFileUsage.ATTACHMENT,
          'test-file.pdf',
          fileId1,
        ).expect(HttpStatus.CREATED);

        expect(response.body).toEqual({});

        await expectReportsInDb({
          ...aReportSnapshot,
          version: aReportSnapshot.version + 1,
          attachedFiles: [
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: 'test-file.pdf',
              fileId: fileId1,
            },
          ],
        });
      });

      it('uploads multiple attachment files', async () => {
        const pdfBuffer1 = givenAPdfBuffer('Content 1');
        const pdfBuffer2 = givenAPdfBuffer('Content 2');

        const response = await request(app.getHttpServer())
          .post(`/api/reports/${aReportSnapshot.id}/files/upload-many`)
          .query({
            usage: ReportFileUsage.ATTACHMENT,
            fileIds: [fileId1, fileId2],
          })
          .set('Cookie', 'sessionId=unused')
          .attach('files', pdfBuffer1, 'attachment1.pdf')
          .attach('files', pdfBuffer2, 'attachment2.pdf')
          .expect(HttpStatus.CREATED);

        expect(response.body).toEqual({});

        await expectReportsInDb({
          ...aReportSnapshot,
          version: aReportSnapshot.version + 1,
          attachedFiles: [
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: 'attachment1.pdf',
              fileId: fileId1,
            },
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: 'attachment2.pdf',
              fileId: fileId2,
            },
          ],
        });
      });

      it('handles the multer latin1 default encoding when uploading a file', async () => {
        const pdfBuffer1 = givenAPdfBuffer('Content 1');
        const expectedUtf8Filename = 'Résumé_éèêë_çñß_déjà_vu.pdf';
        const latin1Buffer = transcode(
          Buffer.from(expectedUtf8Filename),
          'utf8',
          'latin1',
        );
        const latin1String = latin1Buffer.toString('latin1');

        const response = await request(app.getHttpServer())
          .post(`/api/reports/${aReportSnapshot.id}/files/upload-many`)
          .query({ usage: ReportFileUsage.ATTACHMENT, fileIds: fileId1 })
          .set('Cookie', 'sessionId=unused')
          .attach('files', pdfBuffer1, latin1String)
          .expect(HttpStatus.CREATED);

        expect(response.body).toEqual({});

        await expectReportsInDb({
          ...aReportSnapshot,
          version: aReportSnapshot.version + 1,
          attachedFiles: [
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: expectedUtf8Filename,
              fileId: fileId1,
            },
          ],
        });
      });

      it('deletes a file', async () => {
        await uploadFile().expect(HttpStatus.CREATED);

        await request(app.getHttpServer())
          .delete(
            `/api/reports/${aReportSnapshot.id}/files/byName/test-file.pdf`,
          )
          .set('Cookie', 'sessionId=unused')
          .expect(HttpStatus.OK);

        await expectNoFile();
      });

      describe('Batch deletion', () => {
        it('deletes a file', async () => {
          await uploadScreenshot('screenshot1.png').expect(HttpStatus.CREATED);
          await deleteBatchFiles('screenshot1.png').expect(HttpStatus.OK);
          await expectNoFile();
        });

        it('deletes two files at once', async () => {
          await uploadScreenshot('screenshot1.png').expect(HttpStatus.CREATED);
          await uploadScreenshot('screenshot2.png', fileId2).expect(
            HttpStatus.CREATED,
          );

          await deleteBatchFiles(['screenshot1.png', 'screenshot2.png']).expect(
            HttpStatus.OK,
          );

          await expectNoFile(4);
        });

        const uploadScreenshot = (fileName: string, fileId = fileId1) =>
          uploadFile(ReportFileUsage.EMBEDDED_SCREENSHOT, fileName, fileId);

        const deleteBatchFiles = (fileNames: string | string[]) =>
          request(app.getHttpServer())
            .delete(`/api/reports/${aReportSnapshot.id}/files/byNames`)
            .query({ fileNames })
            .set('Cookie', 'sessionId=unused');
      });

      const expectNoFile = (version = 3) =>
        expectReportsInDb({ ...aReportSnapshot, version, attachedFiles: null });
    });

    const uploadFile = (
      usage = ReportFileUsage.ATTACHMENT,
      fileName = 'test-file.pdf',
      fileIds: string | string[] = fileId1,
    ) => {
      const pdfBuffer = givenAPdfBuffer();

      return request(app.getHttpServer())
        .post(`/api/reports/${aReportSnapshot.id}/files/upload-many`)
        .query({ usage, fileIds })
        .set('Cookie', 'sessionId=unused')
        .attach('files', pdfBuffer, fileName);
    };

    const givenAPdfBuffer = (
      content = 'This is a test PDF file generated dynamically.',
    ) => {
      const pdfDoc = new PDF();
      pdfDoc.text(content);
      pdfDoc.end();
      return pdfDoc.read();
    };
    const aReportSnapshot = ReportBuilder.forUpdate('uuid').build();
  });

  const givenAReportNotOwned = async () => {
    const aReportNotOwned = ReportBuilder.forUpdate('uuid')
      .with('id', '10a4b056-dafa-4d28-93b5-e7dd51b9793d')
      .with('reporterId', '1c3f4001-8e08-4359-a68d-55fbf9811534')
      .build();
    await givenSomeReports(aReportNotOwned);
    return aReportNotOwned;
  };

  const initApp = async ({
    validatedSession,
  }: {
    validatedSession: boolean;
  }) => {
    const moduleFixture = await new AppTestingModule()
      .withStubSessionValidationService(validatedSession)
      .withStubUserService()
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
          async validateSession(): ReturnType<
            SessionValidationService['validateSession']
          > {
            return validated ? stubUser : null;
          }
        },
      );
      return this;
    }

    withStubUserService() {
      this.moduleFixture.overrideProvider(USER_SERVICE).useFactory({
        factory: () => {
          const userService = new StubUserService();
          userService.user = stubUser;
          return userService;
        },
      });
      return this;
    }
  }
});

const stubUser = {
  userId: reporterId,
  firstName: 'First-name',
  lastName: 'REPORTER',
};

const fileId1 = 'acd97958-5059-45b7-a3d9-4b46f000d2b4';
const fileId2 = 'a25b1785-0ba0-47b0-b784-161c0e1afae0';
