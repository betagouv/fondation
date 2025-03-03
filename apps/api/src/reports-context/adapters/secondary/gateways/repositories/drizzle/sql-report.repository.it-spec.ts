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

const aReport = new ReportBuilder('uuid')
  .with('folderNumber', 1)
  .with('dueDate', new DateOnly(2030, 10, 1))
  .with('birthDate', new DateOnly(1980, 10, 1))
  .with('state', NominationFile.ReportState.NEW)
  .with('formation', Magistrat.Formation.SIEGE)
  .with('transparency', Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024)
  .with('grade', Magistrat.Grade.I)
  .build();
const aReportDb = SqlReportRepository.mapSnapshotToDb(aReport);

const aReportUpdated = ReportBuilder.duplicateReport(aReport)
  .with('folderNumber', 10)
  .with('dueDate', new DateOnly(2040, 10, 2))
  .with('birthDate', new DateOnly(1990, 10, 1))
  .with('name', 'Updated name')
  .with('state', NominationFile.ReportState.SUPPORTED)
  .with('formation', Magistrat.Formation.PARQUET)
  .with('transparency', Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024)
  .with('grade', Magistrat.Grade.II)
  .with('currentPosition', 'Updated current position')
  .with('targettedPosition', 'Updated targetted position')
  .with('comment', 'Updated comment')
  .with('rank', 'Updated rank')
  .with('observers', ['Updated observer'])
  .with('biography', 'Updated biography')
  .build();
const aReportDbUpdated = SqlReportRepository.mapSnapshotToDb(aReportUpdated);

const aReportUpdatedWithNullValues = ReportBuilder.duplicateReport(aReport)
  .with('folderNumber', null)
  .with('dueDate', null)
  .with('comment', null)
  .with('observers', null)
  .with('biography', null)
  .build();
const aReportDbUpdatedWithNullValues = SqlReportRepository.mapSnapshotToDb(
  aReportUpdatedWithNullValues,
);

describe('SQL Report Repository', () => {
  let sqlReportRepository: SqlReportRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportRepository = new SqlReportRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a report', async () => {
    await transactionPerformer.perform(
      sqlReportRepository.save(NominationFileReport.fromSnapshot(aReport)),
    );

    await expectReports({
      id: aReport.id,
      nominationFileId: aReport.nominationFileId,
      reporterId: aReport.reporterId,
      createdAt: aReport.createdAt,
      folderNumber: aReport.folderNumber,
      biography: aReport.biography,
      dueDate: aReportDb.dueDate!,
      name: aReport.name,
      birthDate: aReportDb.birthDate,
      state: aReport.state,
      formation: aReport.formation,
      transparency: aReport.transparency,
      observers: aReport.observers,
      grade: aReport.grade,
      comment: aReport.comment,
      currentPosition: aReport.currentPosition,
      targettedPosition: aReport.targettedPosition,
      rank: aReport.rank,
    });
  });

  describe('when there is a report', () => {
    beforeEach(async () => {
      await db.insert(reports).values(aReportDb).execute();
    });

    it.each`
      testName                 | updatedReportSnapshot           | updatedReportDb
      ${'all values'}          | ${aReportUpdated}               | ${aReportDbUpdated}
      ${'some values removed'} | ${aReportUpdatedWithNullValues} | ${aReportDbUpdatedWithNullValues}
    `(
      'updates a report with $testName',
      async ({ updatedReportSnapshot, updatedReportDb }) => {
        await transactionPerformer.perform(
          sqlReportRepository.save(updatedReportSnapshot),
        );

        await expectReports({
          id: updatedReportSnapshot.id,
          nominationFileId: updatedReportSnapshot.nominationFileId,
          reporterId: updatedReportSnapshot.reporterId,
          createdAt: updatedReportSnapshot.createdAt,
          folderNumber: updatedReportSnapshot.folderNumber,
          biography: updatedReportSnapshot.biography,
          name: updatedReportSnapshot.name,
          state: updatedReportSnapshot.state,
          formation: updatedReportSnapshot.formation,
          transparency: updatedReportSnapshot.transparency,
          observers: updatedReportSnapshot.observers,
          grade: updatedReportSnapshot.grade,
          comment: updatedReportSnapshot.comment,
          currentPosition: updatedReportSnapshot.currentPosition,
          targettedPosition: updatedReportSnapshot.targettedPosition,
          rank: updatedReportSnapshot.rank,

          dueDate: updatedReportDb.dueDate!,
          birthDate: updatedReportDb.birthDate,
        });
      },
    );

    it('finds a report by id', async () => {
      const result = await transactionPerformer.perform(
        sqlReportRepository.byId(aReport.id),
      );
      expect(result).toEqual(NominationFileReport.fromSnapshot(aReport));
    });

    it('finds a report by nomination file id', async () => {
      const result = await transactionPerformer.perform(
        sqlReportRepository.byNominationFileId(aReport.nominationFileId),
      );
      expect(result).toEqual([NominationFileReport.fromSnapshot(aReport)]);
    });
  });

  const expectReports = async (
    ...expectedReports: (typeof reports.$inferSelect)[]
  ) => {
    const existingReports = await db.select().from(reports).execute();
    expect(existingReports).toEqual<(typeof reports.$inferSelect)[]>(
      expectedReports,
    );
  };
});
