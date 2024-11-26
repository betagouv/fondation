import { inArray } from 'drizzle-orm';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import {
  FileDocument,
  FileDocumentSnapshot,
} from 'src/files-context/business-logic/models/file-document';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { filesPm } from './schema/files-pm';

export class SqlFileRepository implements FileRepository {
  save(report: FileDocument): DrizzleTransactionableAsync {
    return async (db) => {
      const reportRow = SqlFileRepository.mapToDb(report);
      await db.insert(filesPm).values(reportRow);
    };
  }

  getByNames(fileNames: string[]): DrizzleTransactionableAsync<FileDocument[]> {
    return async (db) => {
      const rows = await db
        .select()
        .from(filesPm)
        .where(inArray(filesPm.name, fileNames));
      return rows.map(SqlFileRepository.mapToDomain);
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
      path: file.path,
      storageProvider: file.storageProvider,
    };
  }

  static mapToDomain(row: typeof filesPm.$inferSelect): FileDocument {
    return new FileDocument(
      row.id,
      row.createdAt,
      row.name,
      row.path,
      row.storageProvider,
    );
  }
}
