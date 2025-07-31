import { eq } from 'drizzle-orm';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
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

  getByTransparenceId(
    transparenceId: string,
  ): DrizzleTransactionableAsync<string[]> {
    return async (db) => {
      const rows = await db
        .select({ fileId: transparenceFilesPm.fileId })
        .from(transparenceFilesPm)
        .where(eq(transparenceFilesPm.transparenceId, transparenceId));

      return rows.map((row) => row.fileId);
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
