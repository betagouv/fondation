import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFileBuilder } from 'src/reports-context/business-logic/models/report-attached-file.builder';
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
import {
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';

describe('SQL Report Repository', () => {
  let sqlReportRepository: SqlReportRepository;
  let transactionPerformer: TransactionPerformer;
  let db: DrizzleDb;
  let givenSomeReports: GivenSomeReports;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
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
    const aReport = new ReportBuilder('uuid')
      .with('dueDate', new DateOnly(2030, 10, 1))
      .with('birthDate', new DateOnly(1980, 10, 1))
      .build();

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
      dueDate: '2030-10-01',
      birthDate: '1980-10-01',
      name: aReport.name,
      state: aReport.state,
      formation: aReport.formation,
      transparency: aReport.transparency,
      observers: aReport.observers,
      grade: aReport.grade,
      comment: aReport.comment,
      currentPosition: aReport.currentPosition,
      targettedPosition: aReport.targettedPosition,
      rank: aReport.rank,
      attachedFiles: null,
    });
  });

  describe('when there is a report', () => {
    const aReport = new ReportBuilder('uuid')
      .with('folderNumber', 1)
      .with('dueDate', new DateOnly(2030, 10, 1))
      .with('birthDate', new DateOnly(1980, 10, 1))
      .with('state', NominationFile.ReportState.NEW)
      .with('formation', Magistrat.Formation.SIEGE)
      .with('transparency', Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024)
      .with('grade', Magistrat.Grade.I)
      .build();

    beforeEach(async () => {
      await givenSomeReports(aReport);
    });

    describe('Updates', () => {
      const aReportUpdated = ReportBuilder.duplicateReport(aReport)
        .with('folderNumber', 10)
        .with('dueDate', new DateOnly(2040, 10, 2))
        .with('birthDate', new DateOnly(1990, 10, 1))
        .with('name', 'Updated name')
        .with('state', NominationFile.ReportState.SUPPORTED)
        .with('formation', Magistrat.Formation.PARQUET)
        .with(
          'transparency',
          Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024,
        )
        .with('grade', Magistrat.Grade.II)
        .with('currentPosition', 'Updated current position')
        .with('targettedPosition', 'Updated targetted position')
        .with('comment', 'Updated comment')
        .with('rank', 'Updated rank')
        .with('observers', ['Updated observer'])
        .with('biography', 'Updated biography')
        .build();
      const aReportDbUpdated =
        SqlReportRepository.mapSnapshotToDb(aReportUpdated);

      const aReportUpdatedWithNullValues = ReportBuilder.duplicateReport(
        aReport,
      )
        .with('folderNumber', null)
        .with('dueDate', null)
        .with('comment', null)
        .with('observers', null)
        .with('biography', null)
        .build();
      const aReportDbUpdatedWithNullValues =
        SqlReportRepository.mapSnapshotToDb(aReportUpdatedWithNullValues);

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
            attachedFiles: null,

            dueDate: updatedReportDb.dueDate!,
            birthDate: updatedReportDb.birthDate,
          });
        },
      );
    });

    it('attaches a file to a report', async () => {
      const attachedFile = new ReportAttachedFileBuilder().build();
      const aReportWithFile = ReportBuilder.duplicateReport(aReport)
        .with('attachedFiles', [attachedFile])
        .build();

      await transactionPerformer.perform(
        sqlReportRepository.save(
          NominationFileReport.fromSnapshot(aReportWithFile),
        ),
      );

      const aReportWithFileDb =
        SqlReportRepository.mapSnapshotToDb(aReportWithFile);
      await expectReports({
        id: aReportWithFile.id,
        nominationFileId: aReportWithFile.nominationFileId,
        reporterId: aReportWithFile.reporterId,
        createdAt: aReportWithFile.createdAt,
        folderNumber: aReportWithFile.folderNumber,
        biography: aReportWithFile.biography,
        dueDate: aReportWithFileDb.dueDate!,
        name: aReportWithFile.name,
        birthDate: aReportWithFileDb.birthDate,
        state: aReportWithFile.state,
        formation: aReportWithFile.formation,
        transparency: aReportWithFile.transparency,
        grade: aReportWithFile.grade,
        comment: aReportWithFile.comment,
        currentPosition: aReportWithFile.currentPosition,
        targettedPosition: aReportWithFile.targettedPosition,
        rank: aReportWithFile.rank,
        observers: aReportWithFile.observers,
        attachedFiles: [attachedFile],
      });
    });

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

  describe('Given a saved report with a file', () => {
    const aReport = new ReportBuilder('uuid')
      .with('attachedFiles', [new ReportAttachedFileBuilder().build()])
      .build();
    const aReportDb = SqlReportRepository.mapSnapshotToDb(aReport);

    beforeEach(async () => {
      await db.insert(reports).values(aReportDb).execute();
    });

    it('removes attached files from a report', async () => {
      const aReportWithNoFiles = ReportBuilder.duplicateReport(aReport)
        .with('attachedFiles', null)
        .build();

      await transactionPerformer.perform(
        sqlReportRepository.save(
          NominationFileReport.fromSnapshot(aReportWithNoFiles),
        ),
      );

      const aReportWithNoFilesDb =
        SqlReportRepository.mapSnapshotToDb(aReportWithNoFiles);
      await expectReports({
        id: aReportWithNoFiles.id,
        nominationFileId: aReportWithNoFiles.nominationFileId,
        reporterId: aReportWithNoFiles.reporterId,
        createdAt: aReportWithNoFiles.createdAt,
        folderNumber: aReportWithNoFiles.folderNumber,
        biography: aReportWithNoFiles.biography,
        dueDate: aReportWithNoFilesDb.dueDate!,
        name: aReportWithNoFiles.name,
        birthDate: aReportWithNoFilesDb.birthDate,
        state: aReportWithNoFiles.state,
        formation: aReportWithNoFiles.formation,
        transparency: aReportWithNoFiles.transparency,
        grade: aReportWithNoFiles.grade,
        comment: aReportWithNoFiles.comment,
        currentPosition: aReportWithNoFiles.currentPosition,
        targettedPosition: aReportWithNoFiles.targettedPosition,
        rank: aReportWithNoFiles.rank,
        observers: aReportWithNoFiles.observers,
        attachedFiles: null,
      });
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
