import { and, eq } from 'drizzle-orm';
import { OptimisticLockError } from 'src/reports-context/business-logic/errors/optimistic-lock.error';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
import {
  NominationFileReport,
  NominationFileReportSnapshot,
} from 'src/reports-context/business-logic/models/nomination-file-report';
import { attachedFilesValidationSchema } from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';
import { toReportState } from './schema';
import { toFormation } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';

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
            state: reportRow.state,
            comment: reportRow.comment,
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
        .where(eq(reports.dossierDeNominationId, nominationFileId));
      if (results.length === 0) return null;

      return results.map((reportRow) =>
        SqlReportRepository.mapToDomain(reportRow),
      );
    };
  }

  bySessionId(
    sessionId: string,
  ): DrizzleTransactionableAsync<NominationFileReport[]> {
    return async (db) => {
      const results = await db
        .select()
        .from(reports)
        .where(eq(reports.sessionId, sessionId));

      return results.map((reportRow) =>
        SqlReportRepository.mapToDomain(reportRow),
      );
    };
  }

  delete(reportId: string): DrizzleTransactionableAsync<void> {
    return async (db) => {
      // Supprimer d'abord les report_rules (contrainte FK)
      await db.delete(reportRules).where(eq(reportRules.reportId, reportId));

      // Puis supprimer le rapport
      await db.delete(reports).where(eq(reports.id, reportId));
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
      dossierDeNominationId: reportSnapshot.dossierDeNominationId,
      sessionId: reportSnapshot.sessionId,
      createdAt: reportSnapshot.createdAt,
      reporterId: reportSnapshot.reporterId,
      version: reportSnapshot.version,
      state: reportSnapshot.state,
      formation: reportSnapshot.formation,
      comment: reportSnapshot.comment,
      attachedFiles: reportSnapshot.attachedFiles?.length
        ? reportSnapshot.attachedFiles
        : null,
    };
  }

  static mapToDomain(row: typeof reports.$inferSelect): NominationFileReport {
    const { dossierDeNominationId, ...reportRow } = row;
    const attachedFiles = attachedFilesValidationSchema.parse(
      row.attachedFiles,
    );

    return NominationFileReport.fromSnapshot({
      ...reportRow,
      state: toReportState(reportRow.state),
      formation: toFormation(reportRow.formation),
      dossierDeNominationId,
      attachedFiles,
    });
  }
}
