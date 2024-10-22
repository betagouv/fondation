import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { nominationFiles } from './schema/nomination-file-pm';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-sql-preparation';

export class SqlNominationFileRepository implements NominationFileRepository {
  save(nominationFile: NominationFileModel): TransactionableAsync<void> {
    return async (db: PostgresJsDatabase) => {
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
      rowNumber: snapshot.rowNumber,
      reportId: snapshot.reportId,
      content: snapshot.content,
    };
  }
}
