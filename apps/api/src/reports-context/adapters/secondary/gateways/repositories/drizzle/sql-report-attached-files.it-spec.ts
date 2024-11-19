import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { reportAttachedFiles } from './schema/report-attached-file-pm';
import { SqlReportAttachedFileRepository } from './sql-report-attached-file.repository';

describe('SQL Report Attached File Repository', () => {
  let db: DrizzleDb;
  let sqlReportRuleRepository: SqlReportAttachedFileRepository;
  let transactionPerformer: TransactionPerformer;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportRuleRepository = new SqlReportAttachedFileRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('adds an attached file to the report', async () => {
    const id = 'cce3c259-c259-45ea-8f88-1414d7bdbbd8';
    const currentDate = new Date();
    const reportId = 'cd1619e2-263d-49b6-b928-6a04ee681133';
    const fileId = '8060de42-f8e3-4780-af46-1f14d6b116ea';
    const reportAttachedFile = new ReportAttachedFile(
      id,
      currentDate,
      reportId,
      fileId,
    );

    await transactionPerformer.perform(
      sqlReportRuleRepository.save(reportAttachedFile),
    );

    expect(await db.select().from(reportAttachedFiles).execute()).toEqual([
      reportAttachedFile.toSnapshot(),
    ]);
  });
});
