import { APP_PIPE, NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import { FileVM } from 'src/files-context/business-logic/models/file-document';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { clearDB } from 'test/docker-postgresql-manager';
import {
  deleteAllS3Objects,
  givenSomeS3Files,
} from '../../secondary/gateways/providers/minio-s3-storage.provider.it-spec';
import { filesPm } from '../../secondary/gateways/repositories/drizzle/schema/files-pm';
import { FilesContextModule } from './files-context.module';

describe('Files Controller', () => {
  let app: NestApplication;
  let db: DrizzleDb;

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

    await app.init();
  });

  afterEach(async () => {
    await deleteAllS3Objects();
    await app.close();
  });
  afterAll(() => db.$client.end());

  it('uploads a file', async () => {
    const response = await supertest(app.getHttpServer())
      .post(`/api/files/upload-one`)
      .attach('file', Buffer.from('test file.'), 'test-file.pdf')
      .expect(201);

    expect(response.body).toBeUuidV4();
    await expectFilesPm({
      id: expect.any(String),
      createdAt: expect.any(Date),
      name: 'test-file.pdf',
      storageProvider: FilesStorageProvider.OUTSCALE,
      path: null,
    });
  });

  it("generates a signed url for a file's download", async () => {
    const fileId = '672d02d0-adc6-4fb2-8047-9cae543dd80e';
    await givenSomeS3Files(
      {
        fileName: 'test-file.pdf',
        fileBuffer: Buffer.from('test file'),
      },
      {
        fileName: 'another-file.pdf',
        fileBuffer: Buffer.from('another file'),
      },
    );
    await db
      .insert(filesPm)
      .values({
        id: fileId,
        name: 'test-file.pdf',
        storageProvider: FilesStorageProvider.OUTSCALE,
      })
      .execute();

    const response = await supertest(app.getHttpServer())
      .get(`/api/files`)
      .query({ names: ['test-file.pdf'] })
      .expect(200);

    expect(response.body).toEqual<FileVM[]>([
      {
        name: 'test-file.pdf',
        signedUrl: expect.stringMatching(/^http/),
      },
    ]);
  });

  const expectFilesPm = async (...files: (typeof filesPm.$inferSelect)[]) => {
    expect(await db.select().from(filesPm).execute()).toEqual(files);
  };
});
