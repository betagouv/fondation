import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class FindJusticeContactsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { search: string }): Promise<FoundJusticeContactsDto> {
    const contacts = await this.db.tx.justiceDepartmentContact.findMany({
      where: {
        name: query.search.trim() ? { contains: query.search, mode: 'insensitive' } : undefined,
      },
      select: {
        id: true,
        name: true,
        officialReportVersions: {
          select: { createdAt: true, id: true },
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
      } satisfies Prisma.JusticeDepartmentContactSelect,
    });

    return {
      items: contacts
        .sort(
          (a, b) =>
            (b.officialReportVersions[0]?.createdAt.getTime() ?? Infinity) -
            (a.officialReportVersions[0]?.createdAt.getTime() ?? Infinity),
        )
        .map((c) => ({ id: String(c.id), name: c.name })),
    };
  }
}

export class FoundJusticeContactsDto extends createZodDto(
  z.object({
    items: z.array(z.object({ id: z.string(), name: z.string() })),
  }),
) {}
