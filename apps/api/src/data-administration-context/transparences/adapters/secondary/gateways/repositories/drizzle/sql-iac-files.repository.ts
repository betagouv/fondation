import { IACFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/iac-file-repository';
import { files } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { FileType } from 'src/identity-and-access-context/business-logic/models/file-type';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';

export class SqlIacFilesRepository implements IACFileRepository {
  create(fileId: string, type: FileType): DrizzleTransactionableAsync {
    return async (db) => {
      await db.insert(files).values({
        fileId,
        type,
      });
    };
  }
}
