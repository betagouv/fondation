import { eq, inArray } from 'drizzle-orm';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  FileDocument,
  FileDocumentWithoutId,
} from 'src/files-context/business-logic/models/file-document';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { filesPm } from './schema/files-pm';

export class SqlFileRepository implements FileRepository {
  create(
    file: FileDocumentWithoutId,
  ): DrizzleTransactionableAsync<FileDocument> {
    return async (db) => {
      const { name, bucket, path, storageProvider, createdAt } = file;
      const [row] = await db
        .insert(filesPm)
        .values({
          // mandatory to autogenerate id
          id: undefined,
          name,
          bucket,
          path,
          storageProvider,
          createdAt,
        })
        .returning();

      if (!row) {
        throw new Error('Failed to create file');
      }

      return SqlFileRepository.mapToDomain(row);
    };
  }

  save(file: FileDocument): DrizzleTransactionableAsync {
    return async (db) => {
      const reportRow = SqlFileRepository.mapToDb(file);
      await db.insert(filesPm).values(reportRow);
    };
  }

  getByIds(ids: string[]): DrizzleTransactionableAsync<FileDocument[]> {
    return async (db) => {
      const rows = await db
        .select()
        .from(filesPm)
        .where(inArray(filesPm.id, ids));
      return rows.map(SqlFileRepository.mapToDomain);
    };
  }

  deleteFile(file: FileDocument): DrizzleTransactionableAsync {
    const snapshot = file.toSnapshot();
    return async (db) => {
      await db.delete(filesPm).where(eq(filesPm.id, snapshot.id));
    };
  }

  deleteFiles(files: FileDocument[]): DrizzleTransactionableAsync {
    return async (db) => {
      if (files.length === 0) return;

      const fileIds = files.map((file) => file.toSnapshot().id);
      await db.delete(filesPm).where(inArray(filesPm.id, fileIds));
    };
  }

  static mapToDb(file: FileDocument): typeof filesPm.$inferInsert {
    return file.toSnapshot();
  }

  static mapToDomain(row: typeof filesPm.$inferSelect): FileDocument {
    return FileDocument.fromSnapshot(row);
  }
}
