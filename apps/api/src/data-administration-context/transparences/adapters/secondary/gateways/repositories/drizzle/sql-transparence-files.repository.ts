import { eq, inArray } from 'drizzle-orm';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
import { filesPm } from 'src/files-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { PartialFileDocumentSnapshot } from 'src/files-context/business-logic/models/file-document';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { transparenceFilesPm } from './schema/transparence-files-pm';

export class SqlTransparenceFilesRepository
  implements TransparenceFileRepository
{
  create(transparenceId: string, fileId: string): DrizzleTransactionableAsync {
    return async (db) => {
      await db.insert(transparenceFilesPm).values({
        transparenceId,
        fileId,
      });
    };
  }

  findBySessionImportId(
    transparenceId: string,
  ): DrizzleTransactionableAsync<PartialFileDocumentSnapshot[]> {
    return async (db) => {
      const rows = await db
        .select({ fileId: transparenceFilesPm.fileId })
        .from(transparenceFilesPm)
        .where(eq(transparenceFilesPm.transparenceId, transparenceId));

      const fileIds = rows.map((row) => row.fileId);

      const files = await db
        .select()
        .from(filesPm)
        .where(inArray(filesPm.id, fileIds));

      return files.map((file) => ({
        id: file.id,
        createdAt: file.createdAt,
        name: file.name,
      }));
    };
  }

  deleteByFileId(fileId: string): DrizzleTransactionableAsync {
    return async (db) => {
      await db
        .delete(transparenceFilesPm)
        .where(eq(transparenceFilesPm.fileId, fileId));
    };
  }
}
