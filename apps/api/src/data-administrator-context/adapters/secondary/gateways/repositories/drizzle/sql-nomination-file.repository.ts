import { eq } from 'drizzle-orm';
import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-sql-preparation';
import { nominationFiles } from './schema/nomination-file-pm';
import { NominationFileRead } from 'src/data-administrator-context/business-logic/models/nomination-file-read';
import typia from 'typia';

export class SqlNominationFileRepository implements NominationFileRepository {
  findAll(): DrizzleTransactionableAsync<NominationFileModel[]> {
    return async (db) => {
      const rows = await db.select().from(nominationFiles).execute();
      return rows.map((row) => this.mapToDomain(row));
    };
  }
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
            'reportId',
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
      reportId: row.reportId,
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
      reportId: snapshot.reportId,
      content: snapshot.content,
    };
  }
}
