import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { REPORT_FILE_SERVICE } from 'src/reports-context/adapters/primary/nestjs/tokens';
import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { apiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { clearDB } from 'test/docker-postgresql-manager';

describe('Http Report File Service', () => {
  let app: NestApplication;
  let db: DrizzleDb;
  let httpReportFileService: ReportFileService;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_DB)
      .useValue(db)
      .compile();
    app = moduleFixture.createNestApplication();
    httpReportFileService = moduleFixture.get(REPORT_FILE_SERVICE);
    await app.init();
    await app.listen(apiConfig.port);
  });

  afterEach(() => app.close());
  afterAll(() => db.$client.end());

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
