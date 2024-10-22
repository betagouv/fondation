import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { SqlNominationFileReportRepository } from './sql-nomination-file-report.repository';

describe('SQL Nomination File Report Repository', () => {
  let sqlNominationFileReportRepository: SqlNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlNominationFileReportRepository = new SqlNominationFileReportRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a report', async () => {
    await transactionPerformer.perform(
      sqlNominationFileReportRepository.save(aReport),
    );

    const existingReports = await db.select().from(reports).execute();
    expect(existingReports).toEqual([
      SqlNominationFileReportRepository.mapToDb(aReport),
    ]);
  });

  const aReport = new ReportBuilder()
    .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
    .withDueDate(new DateOnly(2030, 10, 1))
    .withBirthDate(new DateOnly(1980, 10, 1))
    .build();
});
