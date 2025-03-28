import { and, eq } from 'drizzle-orm';
import { OptimisticLockError } from 'src/reports-context/business-logic/errors/optimistic-lock.error';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import {
  NominationFileReport,
  NominationFileReportSnapshot,
} from 'src/reports-context/business-logic/models/nomination-file-report';
import { attachedFilesValidationSchema } from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { reports } from './schema/report-pm';

export class SqlReportRepository implements ReportRepository {
  save(report: NominationFileReport): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const reportRow = SqlReportRepository.mapToDb(report);
      if (report.version === 0) {
        await db.insert(reports).values({ ...reportRow, version: 1 });
      } else {
        const updatedRows = await db
          .update(reports)
          .set({
            version: report.version + 1,
            folderNumber: reportRow.folderNumber,
            biography: reportRow.biography,
            dueDate: reportRow.dueDate,
            name: reportRow.name,
            birthDate: reportRow.birthDate,
            state: reportRow.state,
            formation: reportRow.formation,
            transparency: reportRow.transparency,
            grade: reportRow.grade,
            currentPosition: reportRow.currentPosition,
            targettedPosition: reportRow.targettedPosition,
            comment: reportRow.comment,
            rank: reportRow.rank,
            observers: reportRow.observers,
            attachedFiles: reportRow.attachedFiles,
          })
          .where(
            and(eq(reports.id, report.id), eq(reports.version, report.version)),
          );

        if (updatedRows.rowCount === 0) {
          throw new OptimisticLockError({
            entityName: 'Report',
            entityId: report.id,
            version: report.version,
          });
        }
      }
    };
  }

  byId(id: string): DrizzleTransactionableAsync<NominationFileReport | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      if (result.length === 0) return null;

      const reportRow = result[0]!;
      return SqlReportRepository.mapToDomain(reportRow);
    };
  }

  byNominationFileId(
    nominationFileId: string,
  ): DrizzleTransactionableAsync<NominationFileReport[] | null> {
    return async (db) => {
      const results = await db
        .select()
        .from(reports)
        .where(eq(reports.nominationFileId, nominationFileId));
      if (results.length === 0) return null;

      return results.map((reportRow) =>
        SqlReportRepository.mapToDomain(reportRow),
      );
    };
  }

  static mapToDb(report: NominationFileReport): typeof reports.$inferInsert {
    return SqlReportRepository.mapSnapshotToDb(report.toSnapshot());
  }

  static mapSnapshotToDb(
    reportSnapshot: NominationFileReportSnapshot,
  ): typeof reports.$inferInsert {
    return {
      id: reportSnapshot.id,
      nominationFileId: reportSnapshot.nominationFileId,
      createdAt: reportSnapshot.createdAt,
      reporterId: reportSnapshot.reporterId,
      version: reportSnapshot.version,
      folderNumber: reportSnapshot.folderNumber,
      biography: reportSnapshot.biography,
      dueDate: reportSnapshot.dueDate
        ? reportSnapshot.dueDate.toDbString()
        : null,
      name: reportSnapshot.name,
      birthDate: reportSnapshot.birthDate.toDbString(),
      state: reportSnapshot.state,
      formation: reportSnapshot.formation,
      transparency: reportSnapshot.transparency,
      grade: reportSnapshot.grade,
      currentPosition: reportSnapshot.currentPosition,
      targettedPosition: reportSnapshot.targettedPosition,
      comment: reportSnapshot.comment,
      rank: reportSnapshot.rank,
      observers: reportSnapshot.observers,
      attachedFiles: reportSnapshot.attachedFiles?.length
        ? reportSnapshot.attachedFiles
        : null,
    };
  }

  static mapToDomain(row: typeof reports.$inferSelect): NominationFileReport {
    const attachedFiles = attachedFilesValidationSchema.parse(
      row.attachedFiles,
    );

    return NominationFileReport.fromSnapshot({
      ...row,
      dueDate: row.dueDate ? DateOnly.fromDbDateOnlyString(row.dueDate) : null,
      birthDate: DateOnly.fromDbDateOnlyString(row.birthDate),
      attachedFiles,
    });
  }
}
