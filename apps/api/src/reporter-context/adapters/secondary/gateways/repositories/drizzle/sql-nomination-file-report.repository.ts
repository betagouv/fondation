import { eq } from 'drizzle-orm';
import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { reports } from './schema/report-pm';

export class SqlNominationFileReportRepository implements ReportRepository {
  save(report: NominationFileReport): DrizzleTransactionableAsync<void> {
    return async (db) => {
      const reportRow = SqlNominationFileReportRepository.mapToDb(report);
      await db
        .insert(reports)
        .values(reportRow)
        .onConflictDoUpdate({
          target: reports.id,
          set: buildConflictUpdateColumns(reports, [
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
      return SqlNominationFileReportRepository.mapToDomain(reportRow);
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
        SqlNominationFileReportRepository.mapToDomain(reportRow),
      );
    };
  }

  static mapToDb(report: NominationFileReport): typeof reports.$inferInsert {
    return {
      id: report.id,
      nominationFileId: report.nominationFileId,
      createdAt: report.createdAt,
      biography: report.biography,
      dueDate: report.dueDate ? report.dueDate.toDbString() : null,
      name: report.name,
      reporterName: report.reporterName,
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
    };
  }

  static mapToDomain(row: typeof reports.$inferSelect): NominationFileReport {
    return new NominationFileReport(
      row.id,
      row.nominationFileId,
      row.createdAt,
      row.biography,
      row.dueDate ? DateOnly.fromDbDateOnlyString(row.dueDate) : null,
      row.name,
      row.reporterName,
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
    );
  }
}
