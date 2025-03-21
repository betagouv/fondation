import { eq, inArray } from 'drizzle-orm';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { filesPm } from './schema/files-pm';

export class SqlFileRepository implements FileRepository {
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
    return async (db) => {
      await db.delete(filesPm).where(eq(filesPm.id, file.id));
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
    return this.mapSnapshotToDb(file.toSnapshot());
  }

  static mapSnapshotToDb(
    file: FileDocumentSnapshot,
  ): typeof filesPm.$inferInsert {
    return {
      id: file.id,
      createdAt: file.createdAt,
      name: file.name,
      bucket: file.bucket,
      path: file.path,
      storageProvider: file.storageProvider,
    };
  }

  static mapToDomain(row: typeof filesPm.$inferSelect): FileDocument {
    return new FileDocument(
      row.id,
      row.createdAt,
      row.name,
      row.bucket,
      row.path,
      row.storageProvider,
    );
  }
}
