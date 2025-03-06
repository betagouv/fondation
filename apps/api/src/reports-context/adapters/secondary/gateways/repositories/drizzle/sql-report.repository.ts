import { eq } from 'drizzle-orm';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import {
  NominationFileReport,
  NominationFileReportSnapshot,
} from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import {
  attachedFilesValidationSchema,
  ReportAttachedFiles,
} from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { reports } from './schema/report-pm';

export class SqlReportRepository implements ReportRepository {
  save(report: NominationFileReport): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const reportRow = SqlReportRepository.mapToDb(report);
      await db
        .insert(reports)
        .values(reportRow)
        .onConflictDoUpdate({
          target: reports.id,
          set: buildConflictUpdateColumns(reports, [
            'folderNumber',
            'biography',
            'dueDate',
            'name',
            'birthDate',
            'state',
            'formation',
            'transparency',
            'grade',
            'currentPosition',
            'targettedPosition',
            'comment',
            'rank',
            'observers',
            'attachedFiles',
          ]),
        });
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
    const attachedFiles = report.attachedFiles?.serialize();

    return {
      id: report.id,
      nominationFileId: report.nominationFileId,
      createdAt: report.createdAt,
      reporterId: report.reporterId,
      folderNumber: report.folderNumber,
      biography: report.biography,
      dueDate: report.dueDate ? report.dueDate.toDbString() : null,
      name: report.name,
      birthDate: report.birthDate.toDbString(),
      state: report.state,
      formation: report.formation,
      transparency: report.transparency,
      grade: report.grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: report.observers,
      attachedFiles,
    };
  }

  static mapSnapshotToDb(
    reportSnapshot: NominationFileReportSnapshot,
  ): typeof reports.$inferInsert {
    const report = NominationFileReport.fromSnapshot(reportSnapshot);
    return this.mapToDb(report);
  }

  static mapToDomain(row: typeof reports.$inferSelect): NominationFileReport {
    const attachedFiles = attachedFilesValidationSchema.parse(
      row.attachedFiles,
    );

    return new NominationFileReport(
      row.id,
      row.nominationFileId,
      row.createdAt,
      row.reporterId,
      row.folderNumber,
      row.biography,
      row.dueDate ? DateOnly.fromDbDateOnlyString(row.dueDate) : null,
      row.name,
      DateOnly.fromDbDateOnlyString(row.birthDate),
      row.state,
      row.formation,
      row.transparency,
      row.grade,
      row.currentPosition,
      row.targettedPosition,
      row.comment,
      row.rank,
      row.observers,
      attachedFiles?.length
        ? new ReportAttachedFiles(
            attachedFiles.map(
              (file) => new ReportAttachedFile(row.id, file.name, file.fileId),
            ),
          )
        : null,
    );
  }
}
