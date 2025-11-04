import { Injectable } from '@nestjs/common';
import { Db } from 'src/modules/framework/drizzle';
import { z } from 'zod';

@Injectable()
export class SearchJurisdictionsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    search: string | undefined;
    includeIds: string[] | undefined;
  }): Promise<{ items: FoundJurisdictionsItem[] }> {
    const { items } = await this.db.transaction(async (tx) => {
      const jurisdictions = await tx.query.drizzleJurisdiction.findMany({
        where: (j, { and, or, notInArray, ilike }) =>
          and(
            query.includeIds
              ? notInArray(j.codejur, query.includeIds)
              : undefined,
            query.search
              ? or(
                  ...[j.codejur, j.ville].map((field) =>
                    ilike(field, `%${query.search}%`),
                  ),
                )
              : undefined,
          ),
        columns: { codejur: true, libelle: true, type_jur: true, ville: true },
        limit: 20,
        orderBy: (j, { asc }) => asc(j.codejur),
      });

      if (query.includeIds) {
        const includedJurisdictions =
          await tx.query.drizzleJurisdiction.findMany({
            where: (j, { inArray }) =>
              inArray(j.codejur, query.includeIds as string[]),
            columns: {
              codejur: true,
              libelle: true,
              type_jur: true,
              ville: true,
            },
            orderBy: (j, { asc }) => asc(j.codejur),
          });

        jurisdictions.unshift(...includedJurisdictions);
      }

      return { items: jurisdictions };
    });

    const responseItems = items.map((j) => ({
      id: j.codejur,
      label: j.libelle,
      type: j.type_jur,
      ville: j.ville,
    }));

    return { items: responseItems };
  }
}

export const FoundJurisdictionsItemSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  type: z.string(),
  ville: z.string().nullable(),
});

export type FoundJurisdictionsItem = z.infer<
  typeof FoundJurisdictionsItemSchema
>;
