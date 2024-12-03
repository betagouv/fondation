import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { APP_PIPE, NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import { FileVM } from 'src/files-context/business-logic/models/file-document';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { clearDB } from 'test/docker-postgresql-manager';
import { deleteS3Files, givenSomeS3Files } from 'test/minio';
import { z } from 'zod';
import { filesPm } from '../../secondary/gateways/repositories/drizzle/schema/files-pm';
import { fileUploadQueryDtoSchema } from '../dto/file-upload-query.dto';
import { FilesContextModule } from './files-context.module';

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

    const moduleFixture = await Test.createTestingModule({
      imports: [FilesContextModule],
      providers: [
        {
          provide: APP_PIPE,
          useClass: ZodValidationPipe,
        },
      ],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();
    s3Client = app.get(S3Client);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await deleteS3Files(s3Client);
  });
  afterAll(() => db.$client.end());

  it('uploads a file', async () => {
    const query: z.infer<typeof fileUploadQueryDtoSchema> = {
      bucket,
      path: filePath,
      fileId,
    };

    await supertest(app.getHttpServer())
      .post(`/api/files/upload-one`)
      .query(query)
      .attach('file', Buffer.from('test file.'), fileName)
      .expect(201);

    await expectFilesPm({
      id: fileId,
      createdAt: expect.any(Date),
      name: fileName,
      storageProvider: FilesStorageProvider.OUTSCALE,
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
        storageProvider: FilesStorageProvider.OUTSCALE,
        bucket,
      })
      .execute();

    const response = await supertest(app.getHttpServer())
      .get('/api/files/signed-urls')
      .query({
        ids: fileId,
      })
      .expect(200);

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
        storageProvider: FilesStorageProvider.OUTSCALE,
      })
      .execute();

    await supertest(app.getHttpServer())
      .delete(`/api/files/${fileId}`)
      .expect(200);

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
