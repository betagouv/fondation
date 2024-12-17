import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { SqlReportRepository } from './sql-report.repository';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';

const aReport = new ReportBuilder()
  .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681132')
  .with('nominationFileId', 'a725b384-f07a-4b19-814e-3610f055ea5c')
  .with('folderNumber', 1)
  .with('dueDate', new DateOnly(2030, 10, 1))
  .with('birthDate', new DateOnly(1980, 10, 1))
  .with('state', NominationFile.ReportState.NEW)
  .with('formation', Magistrat.Formation.SIEGE)
  .with('transparency', Transparency.AUTOMNE_2024)
  .with('grade', Magistrat.Grade.I)
  .build();

const aReportUpdated = new ReportBuilder()
  .with('id', aReport.id)
  .with('nominationFileId', aReport.nominationFileId)
  .with('folderNumber', 10)
  .with('dueDate', new DateOnly(2040, 10, 2))
  .with('birthDate', new DateOnly(1990, 10, 1))
  .with('name', 'Updated name')
  .with('state', NominationFile.ReportState.SUPPORTED)
  .with('formation', Magistrat.Formation.PARQUET)
  .with('transparency', Transparency.MARCH_2025)
  .with('grade', Magistrat.Grade.II)
  .with('currentPosition', 'Updated current position')
  .with('targettedPosition', 'Updated targetted position')
  .with('comment', 'Updated comment')
  .with('rank', 'Updated rank')
  .with('observers', ['Updated observer'])
  .with('biography', 'Updated biography')
  .build();

const aReportUpdatedWithNullValues = new ReportBuilder()
  .with('id', aReport.id)
  .with('nominationFileId', aReport.nominationFileId)
  .with('folderNumber', null)
  .with('dueDate', null)
  .with('birthDate', new DateOnly(1990, 10, 1))
  .with('name', 'Updated name')
  .with('state', NominationFile.ReportState.SUPPORTED)
  .with('formation', Magistrat.Formation.PARQUET)
  .with('transparency', Transparency.MARCH_2025)
  .with('grade', Magistrat.Grade.II)
  .with('currentPosition', 'Updated current position')
  .with('targettedPosition', 'Updated targetted position')
  .with('comment', null)
  .with('rank', 'Updated rank')
  .with('observers', null)
  .with('biography', null)
  .build();

describe('SQL Report Repository', () => {
  let sqlNominationFileReportRepository: SqlReportRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlNominationFileReportRepository = new SqlReportRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a report', async () => {
    await transactionPerformer.perform(
      sqlNominationFileReportRepository.save(
        NominationFileReport.fromSnapshot(aReport),
      ),
    );

    const existingReports = await db.select().from(reports).execute();
    expect(existingReports).toEqual([
      SqlReportRepository.mapSnapshotToDb(aReport),
    ]);
  });

  describe('when there is a report', () => {
    beforeEach(async () => {
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
      await db.insert(reports).values(reportRow).execute();
    });

    it.each`
      testName                 | updatedReportSnapshot
      ${'all values'}          | ${aReportUpdated}
      ${'some values removed'} | ${aReportUpdatedWithNullValues}
    `('updates a report with $testName', async ({ updatedReportSnapshot }) => {
      await transactionPerformer.perform(
        sqlNominationFileReportRepository.save(updatedReportSnapshot),
      );

      const existingReports = await db.select().from(reports).execute();
      expect(existingReports).toEqual([
        SqlReportRepository.mapSnapshotToDb(updatedReportSnapshot),
      ]);
    });

    it('finds a report by id', async () => {
      const result = await transactionPerformer.perform(
        sqlNominationFileReportRepository.byId(aReport.id),
      );
      expect(result).toEqual(NominationFileReport.fromSnapshot(aReport));
    });

    it('finds a report by nomination file id', async () => {
      const result = await transactionPerformer.perform(
        sqlNominationFileReportRepository.byNominationFileId(
          aReport.nominationFileId,
        ),
      );
      expect(result).toEqual([NominationFileReport.fromSnapshot(aReport)]);
    });
  });
});
