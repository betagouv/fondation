import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, TypeDeSaisine } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class ListNominationSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    typeDeSaisine: TypeDeSaisine;
    pagination: Pagination;
  }): Promise<PaginatedNominationSessionsDto> {
    const where = { typeDeSaisine: query.typeDeSaisine };

    const [totalCount, sessions] = await this.prisma.$transaction([
      this.prisma.session.count({ where }),
      this.prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    const items = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      formation: prismaFormationEnumToFormationEnum(s.formation),
      date: DateOnly.fromDate(s.date).toJson(),
      dueDate: s.dueDate ? DateOnly.fromDate(s.dueDate).toJson() : null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine),
    }));

    return paginate({ items, totalCount, pagination: query.pagination });
  }
}

const NominationSessionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  formation: z.enum(Magistrat.Formation),
  date: dateOnlyJsonSchema,
  dueDate: dateOnlyJsonSchema.nullable(),
  typeDeSaisine: z.enum(TypeDeSaisine),
});

export class PaginatedNominationSessionsDto extends createPaginatedZodDto(
  NominationSessionItemSchema,
) {}

/** @deprecated Use PaginatedNominationSessionsDto instead */
export class ListedNominationSessionsDto extends createZodDto(
  z.object({
    items: z.array(NominationSessionItemSchema),
  }),
) {}
