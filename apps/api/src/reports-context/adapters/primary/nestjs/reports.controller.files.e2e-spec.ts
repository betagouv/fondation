import { S3Client } from '@aws-sdk/client-s3';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { transcode } from 'buffer';
import PDF from 'pdfkit';
import { ReportFileUsage } from 'shared-models';
import { MainAppConfigurator } from 'src/main.configurator';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import request from 'supertest';
import {
  ExpectReportsInDb,
  expectReportsInDbFactory,
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';
import { clearDB } from 'test/docker-postgresql-manager';
import { deleteS3Files } from 'test/minio';
import {
  AppTestingModule,
  fileId1,
  fileId2,
  stubDossier,
  stubSession,
} from './reports.controller.fixtures';

describe('Reports Controller - Files', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let s3Client: S3Client;
  let givenSomeReports: GivenSomeReports;
  let expectReportsInDb: ExpectReportsInDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
    expectReportsInDb = expectReportsInDbFactory(db);
  });
  beforeEach(async () => {
    await clearDB(db);
    await givenSomeReports(aReportSnapshot);
  });
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

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
        .delete(`/api/reports/${aReportSnapshot.id}/files/byName/test-file.pdf`)
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
  const initApp = async ({
    validatedSession,
  }: {
    validatedSession: boolean;
  }) => {
    const moduleFixture = await new AppTestingModule(db)
      .withStubSessionValidationService(validatedSession)
      .withStubUserService()
      .withStubSessionService()
      .withStubDossierDeNominationService()
      .compile();

    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    await app.init();
  };
});

const aReportSnapshot = ReportBuilder.forUpdate('uuid')
  .with('dossierDeNominationId', stubDossier.id)
  .with('sessionId', stubSession.id)
  .build();
