import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { ListArchivedSessionsQueryDto } from '../dtos/transparence-session.dto';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import {
  ProposingAuthorityEnum,
  ProposingAuthorityEnumLabels,
  TypeDeSaisineEnum,
  TypeDeSaisineEnumLabels,
  typeDeSaisineProposingAuthority,
} from 'src/modules/shared/type-de-saisine.enum';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class ListArchivedNominationSessionsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    search: string | null;
    typeDeSaisine: TypeDeSaisineEnum;
    formations: readonly FormationEnum[] | undefined;
    sorting: Sortable<ListArchivedSessionsQueryDto>;
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

    const direction = query.sorting.sortDesc ? ('desc' as const) : ('asc' as const);
    const orderBy: Prisma.SessionOrderByWithRelationInput[] = [
      query.sorting.sortBy === 'date'
        ? { date: direction }
        : { archivedAt: query.sorting.sortBy ? direction : 'desc' },
      { createdAt: 'asc' },
    ];

    const totalCount = await this.db.tx.session.count({ where });
    const sessions = await this.db.tx.session.findMany({
      where,
      orderBy,
      skip: (query.pagination.page - 1) * query.pagination.limit,
      take: query.pagination.limit,
      select: {
        id: true,
        name: true,
        formation: true,
        date: true,
        archivedAt: true,
        typeDeSaisine: true,
      } satisfies Prisma.SessionSelect,
    });

    const items = sessions.map((s) => {
      const typeDeSaisine = prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine);
      const proposingAuthority = typeDeSaisineProposingAuthority[typeDeSaisine];

      return {
        id: s.id,
        name: s.name,
        formation: prismaFormationEnumToFormationEnum(s.formation),
        date: DateOnly.fromUtcDate(s.date).toJson(),
        archivedAt: s.archivedAt!.toISOString(),
        proposingAuthority: {
          id: proposingAuthority,
          label: ProposingAuthorityEnumLabels[proposingAuthority],
        },
        typeDeSaisine: { id: typeDeSaisine, label: TypeDeSaisineEnumLabels[typeDeSaisine] },
      };
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }
}

export class ListedArchivedNominationSessionsDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
    formation: z.enum(FormationEnum),
    date: dateOnlyJsonSchema,
    archivedAt: z.iso.datetime(),
    proposingAuthority: z.object({ id: z.enum(ProposingAuthorityEnum), label: z.string() }),
    typeDeSaisine: z.object({ id: z.enum(TypeDeSaisineEnum), label: z.string() }),
  }),
) {}
