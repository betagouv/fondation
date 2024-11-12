import { NominationFileRepository } from 'src/data-administration-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administration-context/business-logic/models/nomination-file';
import { NominationFileRead } from 'src/data-administration-context/business-logic/models/nomination-file-read';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import typia from 'typia';
import { nominationFiles } from './schema/nomination-file-pm';

export class SqlNominationFileRepository implements NominationFileRepository {
  findAll(): DrizzleTransactionableAsync<NominationFileModel[]> {
    return async (db) => {
      const rows = await db.select().from(nominationFiles).execute();
      return rows.map((row) => this.mapToDomain(row));
    };
  }

  save(nominationFile: NominationFileModel): DrizzleTransactionableAsync {
    return async (db) => {
      const nominationFileRow =
        SqlNominationFileRepository.mapToDb(nominationFile);

      await db
        .insert(nominationFiles)
        .values(nominationFileRow)
        .onConflictDoUpdate({
          target: nominationFiles.id,
          set: buildConflictUpdateColumns(nominationFiles, [
            'rowNumber',
            'content',
          ]),
        })
        .execute();
    };
  }

  mapToDomain(row: typeof nominationFiles.$inferSelect): NominationFileModel {
    return NominationFileModel.fromSnapshot({
      id: row.id,
      createdAt: row.createdAt,
      rowNumber: row.rowNumber,
      content: this.safeContent(row.content),
    });
  }

  private safeContent(content: unknown): NominationFileRead['content'] {
    return typia.assert<NominationFileRead['content']>(content);
  }

  static mapToDb(
    nominationFile: NominationFileModel,
  ): typeof nominationFiles.$inferInsert {
    const snapshot = nominationFile.toSnapshot();

    return {
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      rowNumber: snapshot.rowNumber,
      content: snapshot.content,
    };
  }
}
