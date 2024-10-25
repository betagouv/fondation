import { eq } from 'drizzle-orm';
import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/providers/drizzle-transaction-performer';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-sql-preparation';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { nominationFiles } from './schema/nomination-file-pm';

export class SqlNominationFileRepository implements NominationFileRepository {
  setReportId(
    nominationFileId: string,
    reportId: string,
  ): DrizzleTransactionableAsync {
    return async (db) => {
      await db
        .update(nominationFiles)
        .set({ reportId })
        .where(eq(nominationFiles.id, nominationFileId))
        .execute();
    };
  }
  save(nominationFile: NominationFileModel): TransactionableAsync<void> {
    return async (db: DrizzleDb) => {
      const nominationFileRow =
        SqlNominationFileRepository.mapToDb(nominationFile);

      await db
        .insert(nominationFiles)
        .values(nominationFileRow)
        .onConflictDoUpdate({
          target: nominationFiles.id,
          set: buildConflictUpdateColumns(nominationFiles, [
            'rowNumber',
            'reportId',
            'content',
          ]),
        })
        .execute();
    };
  }

  static mapToDb(
    nominationFile: NominationFileModel,
  ): typeof nominationFiles.$inferInsert {
    const snapshot = nominationFile.toSnapshot();

    return {
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      rowNumber: snapshot.rowNumber,
      reportId: snapshot.reportId,
      content: snapshot.content,
    };
  }
}
