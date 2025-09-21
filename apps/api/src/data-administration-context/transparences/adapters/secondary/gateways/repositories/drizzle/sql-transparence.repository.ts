import { and, eq, inArray } from 'drizzle-orm';
import {
  DateOnlyJson,
  EditTransparencyDto,
  Magistrat,
  Transparency,
} from 'shared-models';
import {
  TransparenceSnapshot,
  Transparence as TransparenceXlsx,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { TransparenceRepository } from 'src/data-administration-context/transparences/business-logic/gateways/repositories/transparence.repository';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { z } from 'zod';
import { transparencesPm } from './schema/transparence-pm';

export class SqlTransparenceRepository implements TransparenceRepository {
  save(
    transparence: TransparenceXlsx | TransparenceXlsx,
  ): DrizzleTransactionableAsync {
    return async (db) => {
      const snapshot = transparence.snapshot();

      await db
        .insert(transparencesPm)
        .values({
          id: snapshot.id,
          createdAt: snapshot.createdAt,
          name: snapshot.name,
          formation: snapshot.formation,
          dateTransparence: DateOnly.fromJson(
            snapshot.dateTransparence,
          ).toDate(),
          dateEchéance: snapshot.dateEchéance
            ? DateOnly.fromJson(snapshot.dateEchéance).toDate()
            : null,
          datePriseDePosteCible: snapshot.datePriseDePosteCible
            ? DateOnly.fromJson(snapshot.datePriseDePosteCible).toDate()
            : null,
          dateClôtureDélaiObservation: DateOnly.fromJson(
            snapshot.dateClôtureDélaiObservation,
          ).toDate(),
          nominationFiles: snapshot.nominationFiles,
        })
        .onConflictDoUpdate({
          target: transparencesPm.id,
          set: buildConflictUpdateColumns(transparencesPm, ['nominationFiles']),
        })
        .execute();
    };
  }

  transparence(
    name: Transparency,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): DrizzleTransactionableAsync<TransparenceXlsx | null> {
    return async (db) => {
      const transparenceResult = await db
        .select()
        .from(transparencesPm)
        .where(
          and(
            eq(transparencesPm.name, name),
            eq(transparencesPm.formation, formation),
            eq(
              transparencesPm.dateTransparence,
              DateOnly.fromJson(dateTransparence).toDate(),
            ),
          ),
        )
        .limit(1)
        .execute();

      if (!transparenceResult.length) {
        return null;
      }

      const transparenceRow = transparenceResult[0]!;

      return TransparenceXlsx.fromSnapshot({
        id: transparenceRow.id,
        createdAt: transparenceRow.createdAt,
        name: z.string().parse(transparenceRow.name),
        formation: transparenceRow.formation,
        dateTransparence: DateOnly.fromDate(
          transparenceRow.dateTransparence,
        ).toJson(),
        dateEchéance: transparenceRow.dateEchéance
          ? DateOnly.fromDate(transparenceRow.dateEchéance).toJson()
          : null,
        datePriseDePosteCible: transparenceRow.datePriseDePosteCible
          ? DateOnly.fromDate(transparenceRow.datePriseDePosteCible).toJson()
          : null,
        dateClôtureDélaiObservation: DateOnly.fromDate(
          transparenceRow.dateClôtureDélaiObservation,
        ).toJson(),
        nominationFiles: transparenceRow.nominationFiles.map((f) => ({
          ...(f as any),
          createdAt: new Date((f as any).createdAt),
        })) as TransparenceSnapshot['nominationFiles'],
      });
    };
  }

  findById(
    sessionId: string,
  ): DrizzleTransactionableAsync<TransparenceXlsx | null> {
    return async (db) => {
      const transparenceResult = await db
        .select()
        .from(transparencesPm)
        .where(eq(transparencesPm.id, sessionId))
        .limit(1)
        .execute();

      if (!transparenceResult.length) {
        return null;
      }

      const transparenceRow = transparenceResult[0]!;

      return TransparenceXlsx.fromSnapshot({
        id: transparenceRow.id,
        createdAt: transparenceRow.createdAt,
        name: z.string().parse(transparenceRow.name),
        formation: transparenceRow.formation,
        dateTransparence: DateOnly.fromDate(
          transparenceRow.dateTransparence,
        ).toJson(),
        dateEchéance: transparenceRow.dateEchéance
          ? DateOnly.fromDate(transparenceRow.dateEchéance).toJson()
          : null,
        datePriseDePosteCible: transparenceRow.datePriseDePosteCible
          ? DateOnly.fromDate(transparenceRow.datePriseDePosteCible).toJson()
          : null,
        dateClôtureDélaiObservation: DateOnly.fromDate(
          transparenceRow.dateClôtureDélaiObservation,
        ).toJson(),
        nominationFiles: transparenceRow.nominationFiles.map((f) => ({
          ...(f as any),
          createdAt: new Date((f as any).createdAt),
        })) as TransparenceSnapshot['nominationFiles'],
      });
    };
  }

  findBySessionIds(
    sessionIds: string[],
  ): DrizzleTransactionableAsync<TransparenceXlsx[]> {
    return async (db) => {
      const transparencesResult = await db
        .select()
        .from(transparencesPm)
        .where(inArray(transparencesPm.id, sessionIds))
        .execute();

      return transparencesResult.map((transparenceRow) =>
        TransparenceXlsx.fromSnapshot({
          id: transparenceRow.id,
          createdAt: transparenceRow.createdAt,
          name: z.string().parse(transparenceRow.name),
          formation: transparenceRow.formation,
          dateTransparence: DateOnly.fromDate(
            transparenceRow.dateTransparence,
          ).toJson(),
          dateEchéance: transparenceRow.dateEchéance
            ? DateOnly.fromDate(transparenceRow.dateEchéance).toJson()
            : null,
          datePriseDePosteCible: transparenceRow.datePriseDePosteCible
            ? DateOnly.fromDate(transparenceRow.datePriseDePosteCible).toJson()
            : null,
          dateClôtureDélaiObservation: DateOnly.fromDate(
            transparenceRow.dateClôtureDélaiObservation,
          ).toJson(),
          nominationFiles: transparenceRow.nominationFiles.map((f) => ({
            ...(f as any),
            createdAt: new Date((f as any).createdAt),
          })) as TransparenceSnapshot['nominationFiles'],
        }),
      );
    };
  }

  updateMetadata(
    sessionId: string,
    transparence: EditTransparencyDto,
  ): DrizzleTransactionableAsync {
    return async (db) => {
      await db
        .update(transparencesPm)
        .set({
          name: transparence.name,
          formation: transparence.formation,
          dateTransparence: new Date(transparence.dateTransparence),
          dateClôtureDélaiObservation: new Date(
            transparence.dateClotureDelaiObservation,
          ),
          datePriseDePosteCible: transparence.datePriseDePosteCible
            ? new Date(transparence.datePriseDePosteCible)
            : null,
          dateEchéance: transparence.dateEcheance
            ? new Date(transparence.dateEcheance)
            : null,
        })
        .where(eq(transparencesPm.id, sessionId))
        .execute();
    };
  }
}
