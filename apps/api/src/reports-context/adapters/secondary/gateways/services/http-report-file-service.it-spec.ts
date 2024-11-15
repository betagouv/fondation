import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { FilesContextModule } from 'src/files-context/adapters/primary/nestjs/files-context.module';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { Readable } from 'stream';
import { clearDB } from 'test/docker-postgresql-manager';
import { HttpReportFileService } from './http-report-file-service';
import {
  REPORT_FILE_SERVICE,
  ReporterModule,
} from 'src/reports-context/adapters/primary/nestjs/reporter.module';

describe('Http Report File Service', () => {
  let app: NestApplication;
  let db: DrizzleDb;
  let httpReportFileService: HttpReportFileService;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await Test.createTestingModule({
      imports: [FilesContextModule, ReporterModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();
    httpReportFileService = moduleFixture.get(REPORT_FILE_SERVICE);
    await app.init();
    await app.listen(3000);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  describe('should receive a response', () => {
    it('on file upload', async () => {
      expect(
        await httpReportFileService.uploadFile(
          'file.txt',
          new Readable({
            read() {
              this.push('some content');
              this.push(null);
            },
          }),
        ),
      ).toBeString();
    });
  });
});
