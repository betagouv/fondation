import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  filesUploadQueryDtoSchema,
  fileUploadQueryDtoSchema,
  FileVM,
} from 'shared-models';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { MainAppConfigurator } from 'src/main.configurator';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { deleteS3Files, givenSomeS3Files } from 'test/minio';
import { SecureCrossContextRequestBuilder } from 'test/secure-cross-context-request.builder';
import { z } from 'zod';
import { filesPm } from '../../secondary/gateways/repositories/drizzle/schema/files-pm';

// Which bucket is used doesn't matter, we just pick one.
const bucket = defaultApiConfig.s3.reportsContext.attachedFilesBucketName;
const filePath = ['file', 'path'];
const fileName = 'test-file.pdf';
const fileId = '672d02d0-adc6-4fb2-8047-9cae543dd80e';
const fileId2 = '7f4e1c30-b9d2-4e8f-bc7e-1a3d78f92a1c';
const fileName2 = 'second-test-file.pdf';

describe('Files Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let s3Client: S3Client;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
  });

  afterEach(async () => {
    await app.close();
    await deleteS3Files(s3Client);
  });
  afterAll(() => db.$client.end());

  describe('Invalid system requests', () => {
    beforeEach(async () => {
      await initApp();
    });

    it('requires a valid internal request token', async () => {
      const query: z.infer<typeof fileUploadQueryDtoSchema> = {
        bucket,
        path: filePath,
        fileId,
      };

      await supertest(app.getHttpServer())
        .post(`/api/files/upload-one`)
        .query(query)
        .attach('file', Buffer.from('test file.'), fileName)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Internal requests', () => {
    beforeEach(async () => {
      await initApp();
    });

    it('uploads a file', async () => {
      const query: z.infer<typeof fileUploadQueryDtoSchema> = {
        bucket,
        path: filePath,
        fileId,
      };

      await new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((testAgent) =>
          testAgent
            .post(`/api/files/upload-one`)
            .query(query)
            .attach('file', Buffer.from('test file.'), fileName)
            .expect(HttpStatus.CREATED),
        )
        .request();

      await expectFilesPm({
        id: fileId,
        createdAt: expect.any(Date),
        name: fileName,
        storageProvider: FilesStorageProvider.SCALEWAY,
        path: filePath,
        bucket,
      });
      await expectExistingS3File(`file/path/${fileName}`);
    });

    it('uploads two files at the same time', async () => {
      const query: z.infer<typeof filesUploadQueryDtoSchema> = {
        bucket,
        path: filePath,
        fileIds: [fileId, fileId2],
      };

      await new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((testAgent) =>
          testAgent
            .post(`/api/files/upload-many`)
            .query(query)
            .attach('files', Buffer.from('test file.'), 'file1.txt')
            .attach('files', Buffer.from('test file.'), 'file2.txt')
            .expect(HttpStatus.CREATED),
        )
        .request();

      await expectFilesPm(
        {
          id: fileId,
          createdAt: expect.any(Date),
          name: 'file1.txt',
          storageProvider: FilesStorageProvider.SCALEWAY,
          path: filePath,
          bucket,
        },
        {
          id: fileId2,
          createdAt: expect.any(Date),
          name: 'file2.txt',
          storageProvider: FilesStorageProvider.SCALEWAY,
          path: filePath,
          bucket,
        },
      );
      await expectExistingS3File(`file/path/file1.txt`);
      await expectExistingS3File(`file/path/file2.txt`);
    });

    it("generates a signed url for a file's download", async () => {
      await givenSomeS3Files(
        s3Client,
        {
          bucket,
          Key: fileName,
        },
        {
          bucket,
          Key: 'another-file.pdf',
        },
      );
      await db
        .insert(filesPm)
        .values({
          id: fileId,
          name: fileName,
          storageProvider: FilesStorageProvider.SCALEWAY,
          bucket,
        })
        .execute();

      const response = await new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((testAgent) =>
          testAgent
            .get('/api/files/signed-urls')
            .query({
              ids: fileId,
            })
            .expect(HttpStatus.OK),
        )
        .request();

      expect(response.body).toEqual<FileVM[]>([
        {
          name: fileName,
          signedUrl: expect.stringMatching(/^http/),
        },
      ]);
    });

    it('deletes a file', async () => {
      await givenSomeS3Files(s3Client, {
        bucket,
        Key: fileName,
      });
      await db
        .insert(filesPm)
        .values({
          id: fileId,
          bucket,
          path: null,
          name: fileName,
          storageProvider: FilesStorageProvider.SCALEWAY,
        })
        .execute();

      await new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((testAgent) =>
          testAgent.delete(`/api/files/byId/${fileId}`).expect(HttpStatus.OK),
        )
        .request();

      await expectFilesPm();
      await expectDeletedS3File(fileName);
    });

    it('deletes multiple files', async () => {
      await givenSomeS3Files(
        s3Client,
        {
          bucket,
          Key: fileName,
        },
        {
          bucket,
          Key: fileName2,
        },
      );

      await db
        .insert(filesPm)
        .values([
          {
            id: fileId,
            bucket,
            path: null,
            name: fileName,
            storageProvider: FilesStorageProvider.SCALEWAY,
          },
          {
            id: fileId2,
            bucket,
            path: null,
            name: fileName2,
            storageProvider: FilesStorageProvider.SCALEWAY,
          },
        ])
        .execute();

      await new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((testAgent) =>
          testAgent
            .delete(`/api/files/byIds`)
            .query({ ids: [fileId, fileId2] })
            .expect(HttpStatus.OK),
        )
        .request();

      await expectFilesPm();
      await expectDeletedS3File(fileName);
      await expectDeletedS3File(fileName2);
    });

    const expectFilesPm = async (...files: (typeof filesPm.$inferSelect)[]) => {
      expect(await db.select().from(filesPm).execute()).toEqual(files);
    };

    async function expectDeletedS3File(Key: string) {
      await expect(
        s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key,
          }),
        ),
      ).rejects.toBeDefined();
    }

    async function expectExistingS3File(Key: string) {
      await expect(
        s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key,
          }),
        ),
      ).resolves.toBeDefined();
    }
  });

  describe('User requests', () => {
    beforeEach(async () => {
      await initApp({ validatedUserSession: true });
    });

    it("generates a signed url for a file's download", async () => {
      await givenSomeS3Files(s3Client, {
        bucket,
        Key: fileName,
      });
      await db
        .insert(filesPm)
        .values({
          id: fileId,
          name: fileName,
          storageProvider: FilesStorageProvider.SCALEWAY,
          bucket,
        })
        .execute();

      const response = await supertest(app.getHttpServer())
        .get('/api/files/signed-urls')
        .set('Cookie', 'sessionId=unused')
        .query({
          ids: fileId,
        })
        .expect(HttpStatus.OK);
      expect(response.body).toEqual<FileVM[]>([
        {
          name: fileName,
          signedUrl: expect.stringMatching(/^http/),
        },
      ]);
    });
  });

  const initApp = async (args?: { validatedUserSession: boolean }) => {
    let testingModule = new BaseAppTestingModule(db);

    if (args?.validatedUserSession)
      testingModule = testingModule
        .withFakeCookieSignature()
        .withStubSessionValidationService(true);

    const moduleFixture = await testingModule.compile();
    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    s3Client = app.get(S3Client);

    await app.init();
  };
});
