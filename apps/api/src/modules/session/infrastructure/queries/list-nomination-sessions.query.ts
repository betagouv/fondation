import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import {
  Paginated,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import {
  formationEnumToPrismaFormationEnum,
  prismaFormationEnumToFormationEnum,
} from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import type { SessionSortField } from '../dtos/nomination-session.dto';

@Injectable()
export class ListNominationSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    typeDeSaisine: TypeDeSaisine;
    pagination: Pagination;
    filters: { formations: readonly Magistrat.Formation[] };
    sort: { field: SessionSortField | undefined; direction: 'asc' | 'desc' };
  }): Promise<Paginated<ListedNominationSessionItem>> {
    const where = {
      typeDeSaisine: query.typeDeSaisine,
      formation:
        query.filters.formations.length > 0
          ? {
              in: query.filters.formations.map(
                formationEnumToPrismaFormationEnum,
              ),
            }
          : undefined,
    };

    const totalCount = await this.prisma.session.count({ where });

    const orderBy = this.buildOrderBy(query.sort.field, query.sort.direction);

    const sessions = await this.prisma.session.findMany({
      where,
      orderBy,
      take: query.pagination.limit,
      skip: (query.pagination.page - 1) * query.pagination.limit,
      select: {
        id: true,
        name: true,
        formation: true,
        date: true,
        dueDate: true,
        typeDeSaisine: true,
      },
    });

    const items = sessions.map(
      (s): ListedNominationSessionItem => ({
        id: s.id,
        name: s.name,
        formation: prismaFormationEnumToFormationEnum(s.formation),
        date: DateOnly.fromDate(s.date).toJson(),
        dueDate: s.dueDate ? DateOnly.fromDate(s.dueDate).toJson() : null,
        typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine),
      }),
    );

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private buildOrderBy(
    field: SessionSortField | undefined,
    direction: 'asc' | 'desc',
  ): Record<string, 'asc' | 'desc'> {
    if (!field) return { date: 'desc' };
    return { [field]: direction };
  }
}

const ListedNominationSessionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  formation: z.enum(Magistrat.Formation),
  date: dateOnlyJsonSchema,
  dueDate: dateOnlyJsonSchema.nullable(),
  typeDeSaisine: z.enum(TypeDeSaisine),
});

export class ListedNominationSessionItem extends createZodDto(
  ListedNominationSessionItemSchema,
) {}
