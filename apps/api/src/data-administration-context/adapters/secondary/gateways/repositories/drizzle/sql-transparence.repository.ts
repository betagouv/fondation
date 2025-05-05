import { eq } from 'drizzle-orm';
import { Transparency } from 'shared-models';
import { TransparenceRepository } from 'src/data-administration-context/business-logic/gateways/repositories/transparence.repository';
import {
  Transparence,
  TransparenceSnapshot,
} from 'src/data-administration-context/business-logic/models/transparence';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import { transparencesPm } from './schema/transparence-pm';

export class SqlTransparenceRepository implements TransparenceRepository {
  save(transparence: Transparence): DrizzleTransactionableAsync {
    return async (db) => {
      const snapshot = transparence.snapshot();

      await db
        .insert(transparencesPm)
        .values({
          id: snapshot.id,
          createdAt: snapshot.createdAt,
          name: snapshot.name,
          formations: Array.from(snapshot.formations),
          nominationFiles: snapshot.nominationFiles,
        })
        .onConflictDoUpdate({
          target: transparencesPm.id,
          set: buildConflictUpdateColumns(transparencesPm, [
            'formations',
            'nominationFiles',
          ]),
        })
        .execute();
    };
  }

  transparence(
    name: Transparency,
  ): DrizzleTransactionableAsync<Transparence | null> {
    return async (db) => {
      const transparenceResult = await db
        .select()
        .from(transparencesPm)
        .where(eq(transparencesPm.name, name))
        .limit(1)
        .execute();

      if (!transparenceResult.length) {
        return null;
      }

      const transparenceRow = transparenceResult[0]!;

      return Transparence.fromSnapshot({
        id: transparenceRow.id,
        createdAt: transparenceRow.createdAt,
        name: transparenceRow.name,
        formations: new Set(transparenceRow.formations),
        nominationFiles: transparenceRow.nominationFiles.map((f) => ({
          ...(f as any),
          createdAt: new Date((f as any).createdAt),
        })) as TransparenceSnapshot['nominationFiles'],
      });
    };
  }
}
