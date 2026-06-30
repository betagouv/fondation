import { Injectable } from '@nestjs/common';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { ListArchivedNominationSessionsQueryDto } from '../../archived-sessions.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

const SESSION_STATUSES = ['TO_VALIDATE', 'READY'] as const;
type SessionStatus = (typeof SESSION_STATUSES)[number];

@Injectable()
export class ListArchivedNominationSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    search: string | null;
    typeDeSaisine: TypeDeSaisine;
    formations: readonly Magistrat.Formation[] | undefined;
    sorting: Sortable<ListArchivedNominationSessionsQueryDto>;
    pagination: Pagination;
  }): Promise<ListedArchivedNominationSessionsDto> {
    const where: Prisma.SessionWhereInput = {
      deletedAt: null,
      archivedAt: { not: null },
      typeDeSaisine: query.typeDeSaisine,
      ...(query.formations?.length && {
        formation: { in: [...query.formations] },
      }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const orderBy: Prisma.SessionOrderByWithRelationInput[] = query.sorting.sortBy
      ? [
          {
            [query.sorting.sortBy]: query.sorting.sortDesc ? ('desc' as const) : ('asc' as const),
          },
        ]
      : [{ date: 'desc' as const }, { createdAt: 'asc' as const }];

    const [totalCount, sessions] = await this.prisma.$transaction([
      this.prisma.session.count({ where }),
      this.prisma.session.findMany({
        where,
        orderBy,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
        select: {
          id: true,
          name: true,
          formation: true,
          date: true,
          typeDeSaisine: true,
          validatedAt: true,

          transparenceGds: { select: { dueDate: true } },
        },
      }),
    ]);

    const items = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      formation: prismaFormationEnumToFormationEnum(s.formation),
      date: DateOnly.fromDate(s.date).toJson(),
      dueDate: DateOnly.fromOptionalDate(s.transparenceGds?.dueDate)?.toJson() ?? null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine),
      status: ListArchivedNominationSessionsQuery.computeStatus(s),
    }));

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private static computeStatus(session: { validatedAt: Date | null }): SessionStatus {
    if (!session.validatedAt) return 'TO_VALIDATE';
    return 'READY';
  }
}

export class ListedArchivedNominationSessionsDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
    formation: z.enum(Magistrat.Formation),
    date: dateOnlyJsonSchema,
    dueDate: dateOnlyJsonSchema.nullable(),
    typeDeSaisine: z.enum(TypeDeSaisine),
    status: z.enum(SESSION_STATUSES),
  }),
) {}
