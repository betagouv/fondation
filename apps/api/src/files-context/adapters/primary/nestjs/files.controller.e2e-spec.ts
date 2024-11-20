import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import PDF from 'pdfkit';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { clearDB } from 'test/docker-postgresql-manager';
import { FilesContextModule } from './files-context.module';
import { filesPm } from '../../secondary/gateways/repositories/drizzle/schema/files-pm';
import { FilesStorageProvider } from 'src/files-context/business-logic/models/files-provider.enum';

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
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

  it('uploads a file', async () => {
    const pdfBuffer = givenAPdfBuffer();

    const response = await supertest(app.getHttpServer())
      .post(`/api/files/upload-one`)
      .attach('file', pdfBuffer, 'test-file.pdf')
      .expect(201);

    expect(response.body).toBeUuidV4();
    await expectFilesPm({
      id: expect.any(String),
      createdAt: expect.any(Date),
      name: 'test-file.pdf',
      storageProvider: FilesStorageProvider.OUTSCALE,
      uri: expect.any(String),
    });
  });

  const expectFilesPm = async (...files: (typeof filesPm.$inferSelect)[]) => {
    expect(await db.select().from(filesPm).execute()).toEqual(files);
  };

  const givenAPdfBuffer = () => {
    const pdfDoc = new PDF();
    pdfDoc.text('Some content.');
    pdfDoc.end();
    return pdfDoc.read();
  };
});
