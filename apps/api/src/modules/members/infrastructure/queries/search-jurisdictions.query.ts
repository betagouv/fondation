import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class SearchJurisdictionsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    search: string | undefined;
    includeIds: string[] | undefined;
  }): Promise<ListedJurisdictions> {
    const { items } = await this.db.withTransaction(async () => {
      const jurisdictions = await this.db.tx.jurisdiction.findMany({
        take: 20,
        orderBy: [{ codejur: 'asc' }],
        where: {
          AND: [
            { codejur: { not: { startsWith: 'TI' } } },
            { codejur: { not: { startsWith: 'TGI' } } },
            {
              codejur: query.includeIds ? { notIn: query.includeIds } : undefined,
            },
            {
              OR: query.search
                ? [
                    { codejur: { contains: query.search, mode: 'insensitive' } },
                    { ville: { contains: query.search, mode: 'insensitive' } },
                    { libelle: { contains: query.search, mode: 'insensitive' } },
                  ]
                : undefined,
            },
          ],
        },
        select: { codejur: true, libelle: true, typeJur: true, ville: true },
      });

      if (query.includeIds) {
        const includedJurisdictions = await this.db.tx.jurisdiction.findMany({
          where: { codejur: { in: query.includeIds as string[] } },
          select: { codejur: true, libelle: true, typeJur: true, ville: true },
          orderBy: [{ codejur: 'asc' }],
        });

        jurisdictions.unshift(...includedJurisdictions);
      }

      return { items: jurisdictions };
    });

    const responseItems = items.map((j) => ({
      id: j.codejur,
      label: j.libelle,
      type: j.typeJur,
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

export type FoundJurisdictionsItem = z.infer<typeof FoundJurisdictionsItemSchema>;

export class ListedJurisdictions extends createZodDto(
  z.object({ items: z.array(FoundJurisdictionsItemSchema) }),
) {}
