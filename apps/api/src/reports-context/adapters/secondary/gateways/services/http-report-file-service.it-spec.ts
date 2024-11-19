import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { FilesContextModule } from 'src/files-context/adapters/primary/nestjs/files-context.module';
import {
  REPORT_FILE_SERVICE,
  ReporterModule,
} from 'src/reports-context/adapters/primary/nestjs/reporter.module';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { clearDB } from 'test/docker-postgresql-manager';
import { HttpReportFileService } from './http-report-file-service';
import { apiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';

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
    await app.listen(apiConfig.port);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  describe('should receive a file id', () => {
    it('on file upload', async () => {
      expect(
        await httpReportFileService.uploadFile(
          'file.txt',
          Buffer.from('some content'),
        ),
      ).toBeString();
    });
  });
});
