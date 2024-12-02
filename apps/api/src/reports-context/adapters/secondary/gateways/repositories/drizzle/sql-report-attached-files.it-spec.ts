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
    await transactionPerformer.perform(
      sqlReportRuleRepository.save(reportAttachedFile),
    );

    expect(await db.select().from(reportAttachedFiles).execute()).toEqual<
      (typeof reportAttachedFiles.$inferSelect)[]
    >([reportAttachedFile.toSnapshot()]);
  });

  it("finds an attached file by report's id and file name", async () => {
    const file = reportAttachedFile.toSnapshot();

    await db
      .insert(reportAttachedFiles)
      .values(SqlReportAttachedFileRepository.mapSnapshotToDb(file))
      .execute();

    const result = await transactionPerformer.perform(
      sqlReportRuleRepository.byFileName(file.reportId, file.name),
    );

    expect(result).toEqual(ReportAttachedFile.fromSnapshot(file));
  });

  it("deletes an attached file by report's id and file name", async () => {
    const file = reportAttachedFile.toSnapshot();

    await db
      .insert(reportAttachedFiles)
      .values(SqlReportAttachedFileRepository.mapSnapshotToDb(file))
      .execute();

    await transactionPerformer.perform(
      sqlReportRuleRepository.delete(ReportAttachedFile.fromSnapshot(file)),
    );

    expect(await db.select().from(reportAttachedFiles).execute()).toEqual([]);
  });
});

const reportId = 'cd1619e2-263d-49b6-b928-6a04ee681133';
const reportAttachedFile = new ReportAttachedFile(
  new Date(),
  reportId,
  'file-name.png',
  'file-id',
);
