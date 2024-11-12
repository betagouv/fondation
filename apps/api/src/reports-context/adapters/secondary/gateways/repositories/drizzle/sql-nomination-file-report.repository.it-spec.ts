import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { SqlNominationFileReportRepository } from './sql-nomination-file-report.repository';

const aReport = new ReportBuilder()
  .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
  .withNominationFileId('a725b384-f07a-4b19-814e-3610f055ea5c')
  .withFolderNumber(1)
  .withDueDate(new DateOnly(2030, 10, 1))
  .withBirthDate(new DateOnly(1980, 10, 1))
  .withState(NominationFile.ReportState.NEW)
  .withFormation(Magistrat.Formation.SIEGE)
  .withTransparency(Transparency.AUTOMNE_2024)
  .withGrade(Magistrat.Grade.I)
  .build();
const aReportUpdated = new ReportBuilder()
  .withId(aReport.id)
  .withNominationFileId(aReport.nominationFileId)
  .withFolderNumber(10)
  .withDueDate(new DateOnly(2040, 10, 2))
  .withBirthDate(new DateOnly(1990, 10, 1))
  .withName('Updated name')
  .withState(NominationFile.ReportState.OPINION_RETURNED)
  .withFormation(Magistrat.Formation.PARQUET)
  .withTransparency(Transparency.MARCH_2025)
  .withGrade(Magistrat.Grade.II)
  .withCurrentPosition('Updated current position')
  .withTargettedPosition('Updated targetted position')
  .withComment('Updated comment')
  .withRank('Updated rank')
  .withObservers(['Updated observer'])
  .withBiography('Updated biography')
  .build();
const aReportUpdatedWithNullValues = new ReportBuilder()
  .withId(aReport.id)
  .withNominationFileId(aReport.nominationFileId)
  .withFolderNumber(null)
  .withDueDate(null)
  .withBirthDate(new DateOnly(1990, 10, 1))
  .withName('Updated name')
  .withState(NominationFile.ReportState.OPINION_RETURNED)
  .withFormation(Magistrat.Formation.PARQUET)
  .withTransparency(Transparency.MARCH_2025)
  .withGrade(Magistrat.Grade.II)
  .withCurrentPosition('Updated current position')
  .withTargettedPosition('Updated targetted position')
  .withComment(null)
  .withRank('Updated rank')
  .withObservers(null)
  .withBiography(null)
  .build();

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

  describe('when there is a report', () => {
    beforeEach(async () => {
      const reportRow = SqlNominationFileReportRepository.mapToDb(aReport);
      await db.insert(reports).values(reportRow).execute();
    });

    it.each`
      testName                 | updatedReport
      ${'all values'}          | ${aReportUpdated}
      ${'some values removed'} | ${aReportUpdatedWithNullValues}
    `('updates a report with $testName', async ({ updatedReport }) => {
      await transactionPerformer.perform(
        sqlNominationFileReportRepository.save(updatedReport),
      );

      const existingReports = await db.select().from(reports).execute();
      expect(existingReports).toEqual([
        SqlNominationFileReportRepository.mapToDb(updatedReport),
      ]);
    });

    it('finds a report by id', async () => {
      const result = await transactionPerformer.perform(
        sqlNominationFileReportRepository.byId(aReport.id),
      );
      expect(result).toEqual(aReport);
    });

    it('finds a report by nomination file id', async () => {
      const result = await transactionPerformer.perform(
        sqlNominationFileReportRepository.byNominationFileId(
          aReport.nominationFileId,
        ),
      );
      expect(result).toEqual([aReport]);
    });
  });
});
