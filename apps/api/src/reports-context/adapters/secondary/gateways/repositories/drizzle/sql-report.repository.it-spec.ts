import { TransactionRollbackError } from 'drizzle-orm';
import { NominationFile } from 'shared-models';
import {
  NominationFileReport,
  NominationFileReportSnapshot,
} from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFileBuilder } from 'src/reports-context/business-logic/models/report-attached-file.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import {
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { SqlReportRepository } from './sql-report.repository';

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
    const aReport = new ReportBuilder('uuid').build();

    await transactionPerformer.perform(
      sqlReportRepository.save(NominationFileReport.fromSnapshot(aReport)),
    );

    await expectReports({
      id: aReport.id,
      dossierDeNominationId: aReport.dossierDeNominationId,
      sessionId: aReport.sessionId,
      reporterId: aReport.reporterId,
      version: 1,
      createdAt: aReport.createdAt,
      state: aReport.state,
      formation: aReport.formation,
      comment: aReport.comment,
      attachedFiles: null,
    });
  });

  describe('when there is a report', () => {
    const aReport = new ReportBuilder('uuid')
      .with('version', 1)
      .with('state', NominationFile.ReportState.NEW)
      .build();

    beforeEach(async () => {
      await givenSomeReports(aReport);
    });

    it('refuses to update a report with an old version', async () => {
      const aReportV2 = new ReportBuilder('uuid')
        .with('id', '7eee3e35-033f-467f-b3f9-3540af233bf0')
        .with('version', 2)
        .build();
      await givenSomeReports(aReportV2);
      const aReportUpdated = ReportBuilder.duplicateReport(aReportV2)
        .with('version', 1)
        .build();

      await expect(
        transactionPerformer.perform(
          sqlReportRepository.save(
            NominationFileReport.fromSnapshot(aReportUpdated),
          ),
        ),
      ).rejects.toThrow(TransactionRollbackError);
    });

    describe('Updates', () => {
      const aReportUpdated = ReportBuilder.duplicateReport(aReport)
        .with('state', NominationFile.ReportState.SUPPORTED)
        .with('comment', 'Updated comment')
        .build();

      const aReportUpdatedWithNullValues = ReportBuilder.duplicateReport(
        aReport,
      )
        .with('comment', null)
        .build();

      it.each`
        testName                 | updatedReportSnapshot
        ${'all values'}          | ${aReportUpdated}
        ${'some values removed'} | ${aReportUpdatedWithNullValues}
      `(
        'updates a report with $testName',
        async ({
          updatedReportSnapshot,
        }: {
          updatedReportSnapshot: NominationFileReportSnapshot;
        }) => {
          await transactionPerformer.perform(
            sqlReportRepository.save(
              NominationFileReport.fromSnapshot(updatedReportSnapshot),
            ),
          );

          await expectReports({
            id: updatedReportSnapshot.id,
            dossierDeNominationId: updatedReportSnapshot.dossierDeNominationId,
            sessionId: updatedReportSnapshot.sessionId,
            reporterId: updatedReportSnapshot.reporterId,
            version: 2,
            createdAt: updatedReportSnapshot.createdAt,
            state: updatedReportSnapshot.state,
            formation: updatedReportSnapshot.formation,
            comment: updatedReportSnapshot.comment,
            attachedFiles: null,
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

      await expectReports({
        id: aReportWithFile.id,
        dossierDeNominationId: aReportWithFile.dossierDeNominationId,
        sessionId: aReportWithFile.sessionId,
        reporterId: aReportWithFile.reporterId,
        version: 2,
        createdAt: aReportWithFile.createdAt,
        state: aReportWithFile.state,
        formation: aReportWithFile.formation,
        comment: aReportWithFile.comment,
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
        sqlReportRepository.byNominationFileId(aReport.dossierDeNominationId),
      );
      expect(result).toEqual([NominationFileReport.fromSnapshot(aReport)]);
    });
  });

  describe('Given a saved report with a file', () => {
    const aReport = new ReportBuilder('uuid')
      .with('version', 1)
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

      await expectReports({
        id: aReportWithNoFiles.id,
        dossierDeNominationId: aReportWithNoFiles.dossierDeNominationId,
        sessionId: aReportWithNoFiles.sessionId,
        reporterId: aReportWithNoFiles.reporterId,
        version: 2,
        createdAt: aReportWithNoFiles.createdAt,
        state: aReportWithNoFiles.state,
        formation: aReportWithNoFiles.formation,
        comment: aReportWithNoFiles.comment,
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
