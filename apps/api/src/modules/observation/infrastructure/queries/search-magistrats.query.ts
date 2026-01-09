import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

const MagistratSearchResultSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  usedName: z.string(),
  grade: z.string().nullable(),
  professionalEmail: z.string().nullable(),
});

export class MagistratSearchResultDto extends createZodDto(
  MagistratSearchResultSchema,
) {}

export class SearchMagistratsResponseDto extends createZodDto(
  z.object({
    magistrats: z.array(MagistratSearchResultSchema),
  }),
) {}

@Injectable()
export class SearchMagistratsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search: string;
    limit?: number;
  }): Promise<SearchMagistratsResponseDto> {
    const searchTerm = query.search.trim();
    const limit = query.limit ?? 10;

    if (searchTerm.length < 2) {
      return { magistrats: [] };
    }

    const magistrats = await this.prisma.magistrat.findMany({
      where: {
        OR: [
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { usedName: { contains: searchTerm, mode: 'insensitive' } },
          { professionalEmail: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        usedName: true,
        grade: true,
        professionalEmail: true,
      },
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return { magistrats };
  }
}
