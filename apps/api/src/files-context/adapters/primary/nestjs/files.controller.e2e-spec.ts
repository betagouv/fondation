import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpStatus } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { fileUploadQueryDtoSchema, FileVM } from 'shared-models';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
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
import { z } from 'zod';
import { filesPm } from '../../secondary/gateways/repositories/drizzle/schema/files-pm';
import { SecureCrossContextRequestBuilder } from 'test/secure-cross-context-request.builder';

// Which bucket is used doesn't matter, we just pick one.
const bucket = defaultApiConfig.s3.reportsContext.attachedFilesBucketName;
const filePath = ['file', 'path'];
const fileName = 'test-file.pdf';
const fileId = '672d02d0-adc6-4fb2-8047-9cae543dd80e';

describe('Files Controller', () => {
  let app: NestApplication;
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
          testAgent.delete(`/api/files/${fileId}`).expect(HttpStatus.OK),
        )
        .request();

      await expectFilesPm();
      await expect(
        s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: fileName,
          }),
        ),
      ).rejects.toThrow();
    });

    const expectFilesPm = async (...files: (typeof filesPm.$inferSelect)[]) => {
      expect(await db.select().from(filesPm).execute()).toEqual(files);
    };
  });

  const initApp = async () => {
    const moduleFixture = await new AppTestingModule().compile();
    app = moduleFixture.createNestApplication();

    s3Client = app.get(S3Client);

    await app.init();
  };

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }
  }
});
