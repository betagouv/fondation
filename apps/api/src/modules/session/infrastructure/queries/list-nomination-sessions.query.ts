import { Injectable } from '@nestjs/common';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

import { ListGdsNominationSessionsQueryDto } from '../dtos/nomination-session.dto';

const SESSION_STATUSES = ['TO_VALIDATE', 'READY'] as const;
type SessionStatus = (typeof SESSION_STATUSES)[number];

@Injectable()
export class ListNominationSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    typeDeSaisine: TypeDeSaisine;
    formations: readonly Magistrat.Formation[] | undefined;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
    pagination: Pagination;
  }): Promise<ListedNominationSessionsDto> {
    const where: Prisma.SessionWhereInput = {
      deletedAt: null,
      typeDeSaisine: query.typeDeSaisine,
      ...(query.formations?.length && {
        formation: { in: [...query.formations] },
      }),
    };

    const orderBy: Prisma.SessionOrderByWithRelationInput[] = query.sorting
      .sortBy
      ? [
          {
            [query.sorting.sortBy]: query.sorting.sortDesc
              ? ('desc' as const)
              : ('asc' as const),
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
          dueDate: true,
          typeDeSaisine: true,
          isValidated: true,
        },
      }),
    ]);

    const items = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      formation: prismaFormationEnumToFormationEnum(s.formation),
      date: DateOnly.fromDate(s.date).toJson(),
      dueDate: s.dueDate ? DateOnly.fromDate(s.dueDate).toJson() : null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine),
      status: ListNominationSessionsQuery.computeStatus(s),
    }));

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private static computeStatus(session: {
    isValidated: boolean;
  }): SessionStatus {
    if (!session.isValidated) return 'TO_VALIDATE';
    return 'READY';
  }
}

export class ListedNominationSessionsDto extends createPaginatedZodDto(
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
