import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class SearchJurisdictionsQuery {
  constructor(private readonly db: PrismaService) {}

  async handle(query: {
    search: string | undefined;
    includeIds: string[] | undefined;
  }): Promise<ListedJurisdictions> {
    const { items } = await this.db.$transaction(async (tx) => {
      const jurisdictions = await tx.jurisdiction.findMany({
        take: 20,
        orderBy: [{ codejur: 'asc' }],
        where: {
          codejur: query.includeIds ? { notIn: query.includeIds } : undefined,
          OR: query.search
            ? [
                { codejur: { contains: query.search, mode: 'insensitive' } },
                { ville: { contains: query.search, mode: 'insensitive' } },
                { libelle: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        select: { codejur: true, libelle: true, typeJur: true, ville: true },
      });

      if (query.includeIds) {
        const includedJurisdictions = await tx.jurisdiction.findMany({
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

export type FoundJurisdictionsItem = z.infer<
  typeof FoundJurisdictionsItemSchema
>;

export class ListedJurisdictions extends createZodDto(
  z.object({ items: z.array(FoundJurisdictionsItemSchema) }),
) {}
