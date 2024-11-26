import { ReportAttachedFileRepository } from 'src/reports-context/business-logic/gateways/repositories/report-attached-file.repository';
import {
  ReportAttachedFile,
  ReportAttachedFileSnapshot,
} from 'src/reports-context/business-logic/models/report-attached-file';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { reportAttachedFiles } from './schema/report-attached-file-pm';
import { and, eq } from 'drizzle-orm';

export class SqlReportAttachedFileRepository
  implements ReportAttachedFileRepository
{
  save(
    reportAttachedFile: ReportAttachedFile,
  ): DrizzleTransactionableAsync<void> {
    return async (trx) => {
      const reportAttachedFileRow =
        SqlReportAttachedFileRepository.mapToDb(reportAttachedFile);
      await trx
        .insert(reportAttachedFiles)
        .values(reportAttachedFileRow)
        .execute();
    };
  }

  byFileName(
    reportId: string,
    fileName: string,
  ): DrizzleTransactionableAsync<ReportAttachedFile | null> {
    return async (trx) => {
      const reportAttachedFile = await trx
        .select()
        .from(reportAttachedFiles)
        .where(
          and(
            eq(reportAttachedFiles.reportId, reportId),
            eq(reportAttachedFiles.name, fileName),
          ),
        )
        .limit(1)
        .execute();
      if (reportAttachedFile.length === 0) {
        return null;
      }

      return this.toDomain(reportAttachedFile[0]!);
    };
  }

  static mapToDb(
    reportAttachedFile: ReportAttachedFile,
  ): typeof reportAttachedFiles.$inferInsert {
    const reportAttachedFileSnapshot = reportAttachedFile.toSnapshot();

    return {
      id: reportAttachedFileSnapshot.id,
      createdAt: reportAttachedFileSnapshot.createdAt,
      name: reportAttachedFileSnapshot.name,
      reportId: reportAttachedFileSnapshot.reportId,
    };
  }

  static mapSnapshotToDb(
    reportSnapshot: ReportAttachedFileSnapshot,
  ): typeof reportAttachedFiles.$inferInsert {
    const report = ReportAttachedFile.fromSnapshot(reportSnapshot);
    return this.mapToDb(report);
  }

  toDomain(
    reportAttachedFile: typeof reportAttachedFiles.$inferSelect,
  ): ReportAttachedFile {
    return ReportAttachedFile.fromSnapshot({
      id: reportAttachedFile.id,
      createdAt: reportAttachedFile.createdAt,
      name: reportAttachedFile.name,
      reportId: reportAttachedFile.reportId,
    });
  }
}
