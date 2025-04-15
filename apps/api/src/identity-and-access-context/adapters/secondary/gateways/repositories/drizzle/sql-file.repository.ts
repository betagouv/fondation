import { eq } from 'drizzle-orm';
import { FileRepository } from 'src/identity-and-access-context/business-logic/gateways/repositories/file-repository';
import { FileModel } from 'src/identity-and-access-context/business-logic/models/file';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { files } from './schema/file-pm';

export class SqlFileRepository implements FileRepository {
  fileWithId(fileId: string): DrizzleTransactionableAsync<FileModel | null> {
    return async (db) => {
      const result = await db
        .select()
        .from(files)
        .where(eq(files.fileId, fileId))
        .limit(1);

      if (result.length === 0) return null;

      const fileRow = result[0]!;
      return SqlFileRepository.mapToDomain(fileRow);
    };
  }

  static mapToDb(file: FileModel): typeof files.$inferInsert {
    return {
      fileId: file.fileId,
      type: file.type,
    };
  }

  static mapToDomain(row: typeof files.$inferSelect): FileModel {
    return new FileModel(row.fileId, row.type);
  }
}
