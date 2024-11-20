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
      storageProvider: file.storageProvider,
      uri: file.uri,
    };
  }

  static mapToDomain(row: typeof filesPm.$inferSelect): FileDocument {
    return new FileDocument(
      row.id,
      row.createdAt,
      row.name,
      row.storageProvider,
      row.uri,
    );
  }
}
