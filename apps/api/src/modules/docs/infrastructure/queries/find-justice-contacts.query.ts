import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import { z } from 'zod';

@Injectable()
export class FindJusticeContactsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { search: string }): Promise<FoundJusticeContactsDto> {
    const contacts = await this.prisma.justiceDepartmentContact.findMany({
      where: {
        name: query.search.trim()
          ? { contains: query.search, mode: 'insensitive' }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        officialReports: {
          select: { createdAt: true, id: true },
          orderBy: [{ createdAt: 'desc' }],
          take: 1,
        },
      },
    });

    return {
      items: contacts
        .sort(
          (a, b) =>
            (b.officialReports[0]?.createdAt.getTime() ?? Infinity) -
            (a.officialReports[0]?.createdAt.getTime() ?? Infinity),
        )
        .map((c) => ({ id: Number(c.id), name: c.name })),
    };
  }
}

export class SearchJusticeContactsQueryDto extends createZodDto(
  z.object({ search: z.string().default('') }),
) {}

export class FoundJusticeContactsDto extends createZodDto(
  z.object({
    items: z.array(z.object({ id: z.number().int(), name: z.string() })),
  }),
) {}
